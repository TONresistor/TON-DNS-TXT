<div align="center">

<h1>TON DNS TXT</h1>

<p>Manage <code>dns_text</code> records on your <code>.ton</code> domains directly from your browser.</p>

<br/>

<a href="https://dns.resistance.dog"><img src="https://img.shields.io/badge/Live_Demo-dns.resistance.dog-0098ea?style=flat-square" alt="Live Demo"/></a>
<a href="https://ton.org"><img src="https://img.shields.io/badge/Built_on-TON_Blockchain-0098ea?style=flat-square" alt="TON Blockchain"/></a>
<a href="https://dns.ton.org"><img src="https://img.shields.io/badge/TON_DNS-dns.ton.org-0067cc?style=flat-square" alt="TON DNS"/></a>
<img src="https://img.shields.io/badge/License-MIT-22c55e?style=flat-square" alt="MIT License"/>

</div>

---

## Background

TON DNS domains are NFTs. Each domain can store multiple on-chain records: a wallet address, a TON Site, a TON Storage bag, a next resolver, and text records. The official interface at [dns.ton.org](https://dns.ton.org) lets you set wallet addresses, TON bags and ADNL addresses, but provides no way to add or manage `dns_text` records. This tool fills that gap.

---

## What is a dns_text record?

`dns_text` is a record type in the TON DNS standard that lets you attach arbitrary key/value text data to your `.ton` domain. Records are stored on-chain and publicly readable by anyone.

| Field | Description |
|---|---|
| **Key** | A free-form string (e.g. `avatar`, `bio`, `channel`). Stored as its SHA-256 hash on-chain. |
| **Value** | Plain UTF-8 text, up to 123 bytes per cell. Longer values chain across multiple cells via refs. |
| **Visibility** | Public. Anyone can read records via the `dnsresolve` get-method. |

Records live in a `Hashmap 256 DNSRecord` inside the NFT item contract. The `dns_text` type is identified by the TL-B prefix `0x1eda`.

**Example use cases:** `pgp`, `url`, `avatar`, `channel`, `nostr`, any custom key your app defines.

---

## Building on dns_text

`dns_text` records have no predefined schema. The key space is completely open, which means any developer can define their own key convention, write records under it, and build an app that reads them back. No registration, no coordination with anyone.

This is what makes it interesting. Your `.ton` domain stops being just a name pointing to a wallet. It becomes a small public data store, attached to a human-readable identity, that any application can extend for its own needs.

For example any app could resolves `avatar`, `bio`, and `channel` to build a rich profile from a domain name alone. Each application defines its own key, reads its own data, ignores everything else.

Any app resolving a domain can bootstrap entirely from on-chain data, with no central server involved. Because records are owner-signed, you can verify that what you read is exactly what the owner published, not an altered version served by an intermediary.

The pattern is the same in each case: agree on a key name, write once, let any app resolve it. The `.ton` domain becomes the coordination point.

---

## Reading and Writing dns_text Records

### Reading records

Call the `dnsresolve` get-method on the NFT item contract with `category = 0`. This returns all DNS records as a `Hashmap 256 DNSRecord` cell. No wallet or transaction needed — it is a free read-only call.

**Request (TonCenter JSON-RPC):**

```typescript
const res = await fetch('https://toncenter.com/api/v2/jsonRPC', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0', id: 1, method: 'runGetMethod',
    params: {
      address: '<nft-item-address>',
      method: 'dnsresolve',
      stack: [
        ['tvm.Slice', '<0x00 byte as base64 BOC>'], // empty subdomain = all records
        ['num', '0'],                               // category 0 = all types
      ],
    },
  }),
});
// response.result.stack[1] contains the Hashmap root cell (base64 BOC)
```

**Parsing with `@ton/core`:**

```typescript
import { Cell, Dictionary } from '@ton/core';

const rootCell = Cell.fromBoc(Buffer.from(boc, 'base64'))[0];

// TonCenter returns the Hashmap trie root directly — use loadDirect, not load
const dict = Dictionary.loadDirect(
  Dictionary.Keys.BigUint(256),
  Dictionary.Values.Cell(),
  rootCell,
);

for (const [key, valueCell] of dict) {
  const slice = valueCell.beginParse();
  if (slice.loadUint(16) === 0x1eda) {           // dns_text prefix
    const chunkCount = slice.loadUint(8);
    const len = slice.loadUint(8);
    const text = slice.loadBuffer(len).toString('utf-8');
    // key is sha256(keyName) as bigint — the original name is not stored on-chain
  }
}
```

### Writing a record

Build the message body in the client and send it directly from the owner's wallet. No backend required.

```typescript
import { beginCell } from '@ton/core';

// 1. Hash the key name with SHA-256
const encoded = new TextEncoder().encode('email');
const hash = await crypto.subtle.digest('SHA-256', encoded);
const keyHash = BigInt('0x' + [...new Uint8Array(hash)]
  .map(b => b.toString(16).padStart(2, '0')).join(''));

// 2. Encode the value as a dns_text#1eda TL-B cell (≤ 123 bytes per chunk)
const value = Buffer.from('alice@example.com', 'utf-8');
const valueCell = beginCell()
  .storeUint(0x1eda, 16)        // dns_text prefix
  .storeUint(1, 8)              // chunk count
  .storeUint(value.length, 8)
  .storeBuffer(value)
  .endCell();

// 3. Build the change_dns_record message body
const body = beginCell()
  .storeUint(0x4eb1f0f9, 32)   // op: change_dns_record
  .storeUint(0n, 64)            // query_id
  .storeUint(keyHash, 256)      // key = sha256(name)
  .storeRef(valueCell)          // omit this ref to delete the record
  .endCell();

// 4. Send via TonConnect
await tonConnectUI.sendTransaction({
  validUntil: Math.floor(Date.now() / 1000) + 300,
  messages: [{
    address: nftItemAddress,
    amount: '50000000',          // 0.05 TON gas
    payload: body.toBoc().toString('base64'),
  }],
});
```

To delete a record, omit `.storeRef(valueCell)`. The contract checks `slice_refs() > 0` to distinguish set from delete.

---

## Live Demo Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + TypeScript |
| Wallet | TonConnect (`@tonconnect/ui-react`) |
| TON | `@ton/core`, `@ton/ton` |
| Backend | Express (API proxy for TONAPI + TonCenter) |

---

## How it works

**Reading records:** the backend calls `dnsresolve(category=0)` on the NFT item contract via TonCenter JSON-RPC. This returns the full `Hashmap 256 DNSRecord` trie as a base64 BOC. The client deserializes it, filters entries with the `0x1eda` prefix, and decodes the UTF-8 text.

**Writing and deleting:** the client builds the `change_dns_record` message (op `0x4eb1f0f9`) locally and sends it directly from the user's wallet via TonConnect. No backend is involved for writes. Deleting a record sends the same op without a value cell ref.

The backend is a thin proxy that keeps API keys server-side.

---

## Running locally

### 1. Backend

```bash
cd server
cp .env.example .env
npm install
npx tsc && node dist/index.js
```

Listens on port `4727` by default. API keys are optional. TONAPI and TonCenter both work without a key at low rate limits.

### 2. Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

The Vite dev server proxies `/api/*` to `localhost:4727`.

---

## Environment variables

### `server/.env`

| Variable | Description |
|---|---|
| `TONAPI_KEY` | TONAPI bearer token (optional) |
| `TONCENTER_KEY` | TonCenter API key (optional) |
| `PORT` | Server port (default: `4727`) |

### `client/.env`

| Variable | Description | Default |
|---|---|---|
| `VITE_TX_CONTRACT_AMOUNT` | Gas sent to DNS contract, in nanoTON | `50000000` (0.05 TON) |
| `VITE_TX_FEE_AMOUNT` | Service fee, in nanoTON | `450000000` (0.45 TON) |
| `VITE_OWNER_WALLET` | Wallet that receives the service fee | (empty) |

Client variables are baked in at build time by Vite.

---

## Deployment

```bash
# Build the client
cd client && npm run build

# Run the server with PM2
cd server && npx tsc && pm2 start dist/index.js --name dns-text-api
```

Serve `client/dist` as a static site behind nginx with `/api/*` proxied to the Express server.

---

## License

MIT
