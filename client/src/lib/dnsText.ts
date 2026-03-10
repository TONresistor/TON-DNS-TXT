import { beginCell, Cell, Dictionary } from '@ton/core';
import { CHANGE_DNS_RECORD_OP, DNS_TEXT_PREFIX, MAX_CHUNK_BYTES } from './constants';

export interface DnsTextRecord {
  keyHash: string;   // 64-char hex string of the 256-bit category key
  value: string;     // decoded UTF-8 text
}

/**
 * Encode a UTF-8 string as a dns_text#1eda TL-B cell.
 *
 * TL-B definition (block.tlb):
 *   text_chunk$_ {n:#} len:(## 8) data:(bits (len * 8)) next:(TextChunkRef n) = TextChunks (n + 1);
 *   text$_ chunks:(## 8) rest:(TextChunks chunks) = Text;
 *   dns_text#1eda _:Text = DNSRecord;
 *
 * For texts ≤ 123 bytes: single chunk, no refs.
 * For longer texts: additional chunks stored in refs (built back-to-front).
 */
export function encodeDnsText(text: string): Cell {
  const bytes = Buffer.from(text, 'utf-8');

  if (bytes.length <= MAX_CHUNK_BYTES) {
    return beginCell()
      .storeUint(DNS_TEXT_PREFIX, 16)
      .storeUint(1, 8)
      .storeUint(bytes.length, 8)
      .storeBuffer(bytes)
      .endCell();
  }

  // Multi-chunk: split bytes into 123-byte pieces (first chunk includes the 2-byte prefix).
  // Subsequent chunks allow 125 bytes each (no prefix overhead).
  const chunks: Buffer[] = [];
  let offset = 0;
  chunks.push(bytes.subarray(offset, offset + MAX_CHUNK_BYTES));
  offset += MAX_CHUNK_BYTES;
  while (offset < bytes.length) {
    chunks.push(bytes.subarray(offset, offset + 125));
    offset += 125;
  }

  // Build from last chunk to first using storeRef (chain of cells).
  let nextRef: Cell | null = null;
  for (let i = chunks.length - 1; i >= 1; i--) {
    const chunk = chunks[i];
    const builder = beginCell()
      .storeUint(chunk.length, 8)
      .storeBuffer(chunk);
    if (nextRef) builder.storeRef(nextRef);
    nextRef = builder.endCell();
  }

  const firstChunk = chunks[0];
  const builder = beginCell()
    .storeUint(DNS_TEXT_PREFIX, 16)
    .storeUint(chunks.length, 8)
    .storeUint(firstChunk.length, 8)
    .storeBuffer(firstChunk);
  if (nextRef) builder.storeRef(nextRef);
  return builder.endCell();
}

/**
 * Decode a dns_text#1eda TL-B cell back to a string.
 * Returns null if the cell is not a valid dns_text record.
 */
export function decodeDnsText(cell: Cell): string | null {
  try {
    const slice = cell.beginParse();
    const prefix = slice.loadUint(16);
    if (prefix !== DNS_TEXT_PREFIX) return null;

    const chunkCount = slice.loadUint(8);
    let result = '';

    for (let i = 0; i < chunkCount; i++) {
      const len = slice.loadUint(8);
      const data = slice.loadBuffer(len);
      result += data.toString('utf-8');

      // Follow the ref chain for subsequent chunks
      if (i < chunkCount - 1) {
        const ref = slice.loadRef();
        // Replace slice with the next chunk's slice
        // We need a fresh parse of the ref — use a recursive helper
        const nextText = decodeChainFrom(ref, chunkCount - i - 1);
        if (nextText === null) return null;
        result += nextText;
        break;
      }
    }

    return result;
  } catch {
    return null;
  }
}

function decodeChainFrom(cell: Cell, remaining: number): string | null {
  try {
    let result = '';
    let current: Cell | null = cell;
    for (let i = 0; i < remaining; i++) {
      if (!current) return null;
      const slice = current.beginParse();
      const len = slice.loadUint(8);
      const data = slice.loadBuffer(len);
      result += data.toString('utf-8');
      current = slice.remainingRefs > 0 ? slice.loadRef() : null;
    }
    return result;
  } catch {
    return null;
  }
}

/**
 * Build the body cell for a change_dns_record message.
 *
 * Format (nft-item.fc):
 *   op       : uint32  = 0x4eb1f0f9
 *   query_id : uint64  = 0
 *   key      : uint256 = sha256(category_string)
 *   [value]  : ^Cell   = dns_text cell (absent = deletion)
 */
export function buildChangeDnsRecord(categoryKey: bigint, value: Cell | null): Cell {
  const builder = beginCell()
    .storeUint(CHANGE_DNS_RECORD_OP, 32)
    .storeUint(0n, 64)
    .storeUint(categoryKey, 256);

  if (value !== null) {
    builder.storeRef(value);
  }
  // No ref = deletion (contract checks: has_value = in_msg_body.slice_refs() > 0)

  return builder.endCell();
}

/**
 * Convert a category name string to its 256-bit key (sha256 as bigint).
 * Uses browser-native crypto.subtle — no Node.js dependency.
 */
export async function categoryToKey(name: string): Promise<bigint> {
  const encoded = new TextEncoder().encode(name);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return BigInt('0x' + hex);
}

/**
 * Parse a base64-encoded BOC containing a DNS records Hashmap
 * into an array of decoded text records.
 */
export function parseDnsTextRecords(boc: string): DnsTextRecord[] {
  const rootCell = Cell.fromBoc(Buffer.from(boc, 'base64'))[0];

  const dict = Dictionary.loadDirect(
    Dictionary.Keys.BigUint(256),
    Dictionary.Values.Cell(),
    rootCell,
  );

  const results: DnsTextRecord[] = [];
  for (const [key, valueCell] of dict) {
    const text = decodeDnsText(valueCell);
    if (text !== null) {
      results.push({
        keyHash: key.toString(16).padStart(64, '0'),
        value: text,
      });
    }
  }
  return results;
}
