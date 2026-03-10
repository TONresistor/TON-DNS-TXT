// TON DNS NFT collection on mainnet (verified on TONViewer)
export const DNS_COLLECTION = 'EQC3dNlesgVD8YbAazcauIrXBPfiVhMMr5YYk2in0Mtsz0Bz';

// op code for change_dns_record in nft-item.fc
export const CHANGE_DNS_RECORD_OP = 0x4eb1f0f9;

// dns_text TL-B prefix (block.tlb: dns_text#1eda _:Text = DNSRecord)
export const DNS_TEXT_PREFIX = 0x1eda;

// Amount sent to the DNS NFT contract for gas (nanoTON)
export const TX_CONTRACT_AMOUNT = import.meta.env.VITE_TX_CONTRACT_AMOUNT ?? '50000000';

// Fee sent to the service wallet (nanoTON)
export const TX_FEE_AMOUNT = import.meta.env.VITE_TX_FEE_AMOUNT ?? '450000000';

// Service wallet that receives the fee
export const OWNER_WALLET = import.meta.env.VITE_OWNER_WALLET ?? '';

// Enable/disable service fee (set VITE_ENABLE_FEES=false to disable)
export const FEES_ENABLED = import.meta.env.VITE_ENABLE_FEES !== 'false';

// Max bytes per chunk in a single cell: (1023 - 16 - 8 - 8) / 8 = 123
export const MAX_CHUNK_BYTES = 123;
