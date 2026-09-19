# Models — Nemotron first paid brain

Prepaid T10K / M10 blocks call **NVIDIA Nemotron 3 Super** so agents cannot hang an unbounded API bill.

| Path | How |
|---|---|
| Default | Workers AI `@cf/nvidia/nemotron-3-120b-a12b` via `ai.binding = AI` |
| Your box | cloudflared → OpenAI-compat. Secret `NEMOTRON_URL` (+ optional `NEMOTRON_TOKEN`) |

CF list price: **$0.50 / M in**, **$1.50 / M out**. A full 10k/10k block is about **$0.02** COGS. x402 SKU is **$0.05** on testnet until you flip mainnet.

Do not put Nemotron on the $10 brochure chat. That stays Llama/Qwen. Nemotron is agent planning + OpenSpec.

Secrets (not git, not workers.dev HTML):

```
npx wrangler secret put PAY_TO
npx wrangler secret put PAY_TO_SOLANA
# only if using the tunnel instead of Workers AI:
npx wrangler secret put NEMOTRON_URL
npx wrangler secret put NEMOTRON_TOKEN
```
