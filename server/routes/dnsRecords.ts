import { Router, Request, Response } from 'express';
import { beginCell } from '@ton/core';

const TONCENTER_KEY = process.env.TONCENTER_KEY ?? '';

// Pre-compute the \x00 BOC once at startup.
// This is the domain parameter for dnsresolve on NFT items.
const NULL_BYTE_BOC = beginCell().storeUint(0, 8).endCell().toBoc().toString('base64');

export const router = Router();

/**
 * GET /api/dns-records?address=<nft-item-address>
 * Calls dnsresolve(category=0) on the NFT item and returns the HashmapE BOC.
 */
router.get('/dns-records', async (req: Request, res: Response) => {
  const address = req.query.address as string | undefined;
  if (!address) {
    res.status(400).json({ error: 'Missing address parameter' });
    return;
  }

  try {
    const body = {
      id: 1,
      jsonrpc: '2.0',
      method: 'runGetMethod',
      params: {
        address,
        method: 'dnsresolve',
        stack: [
          ['tvm.Slice', NULL_BYTE_BOC],
          ['num', '0'],
        ],
      },
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (TONCENTER_KEY) headers['X-API-Key'] = TONCENTER_KEY;

    const tcRes = await fetch('https://toncenter.com/api/v2/jsonRPC', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!tcRes.ok) {
      res.status(502).json({ error: `TonCenter error: ${tcRes.status}` });
      return;
    }

    const data = await tcRes.json() as {
      ok?: boolean;
      result?: {
        exit_code: number;
        stack: Array<[string, unknown]>;
      };
      error?: string;
    };

    if (!data.ok || !data.result || data.result.exit_code !== 0) {
      // No records or contract error — return empty
      res.json({ ok: true, boc: null });
      return;
    }

    const stack = data.result.stack;
    // stack[0] = bits resolved (int), stack[1] = HashmapE cell or null
    if (!stack || stack.length < 2 || stack[1][0] === 'null') {
      res.json({ ok: true, boc: null });
      return;
    }

    const cellEntry = stack[1][1] as { bytes?: string } | undefined;
    const boc = cellEntry?.bytes ?? null;

    res.json({ ok: true, boc });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});
