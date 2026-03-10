import { Router, Request, Response } from 'express';

const TONAPI_KEY = process.env.TONAPI_KEY ?? '';
const DNS_COLLECTION = 'EQC3dNlesgVD8YbAazcauIrXBPfiVhMMr5YYk2in0Mtsz0Bz';

export const router = Router();

/**
 * GET /api/domains?wallet=<address>
 * Returns all .ton NFT domains owned by the wallet.
 */
router.get('/domains', async (req: Request, res: Response) => {
  const wallet = req.query.wallet as string | undefined;
  if (!wallet) {
    res.status(400).json({ error: 'Missing wallet parameter' });
    return;
  }

  try {
    const url = new URL(`https://tonapi.io/v2/accounts/${encodeURIComponent(wallet)}/nfts`);
    url.searchParams.set('collection', DNS_COLLECTION);
    url.searchParams.set('limit', '100');
    url.searchParams.set('offset', '0');

    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (TONAPI_KEY) headers['Authorization'] = `Bearer ${TONAPI_KEY}`;

    const tonapiRes = await fetch(url.toString(), { headers });
    if (!tonapiRes.ok) {
      res.status(502).json({ error: `TONAPI error: ${tonapiRes.status}` });
      return;
    }

    const data = await tonapiRes.json() as {
      nft_items?: Array<{ address: string; dns?: string; metadata?: { name?: string } }>;
    };

    const domains = (data.nft_items ?? []).map(item => ({
      name: item.dns ?? item.metadata?.name ?? item.address.slice(0, 8) + '…',
      address: item.address,
    }));

    res.json({ domains });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});
