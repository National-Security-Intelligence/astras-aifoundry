# AIFoundry.sh

**Brand of [Astras.ai](https://github.com/astras-ai).** Prepaid tools for AI agents.

Agents pay USDC over HTTP 402. They never receive vendor API keys. After payment they get a scoped session: **T10K** (10k tokens in or out) or **M10** (10 minutes).

Demo / storefront UI (not live settle): [astras-ai/x402-monetized-api-gateway](https://github.com/astras-ai/x402-monetized-api-gateway)

This repo is the **production worker**: Cloudflare `x402-hono` + facilitator.

## First tool

`POST /v1/tools/openspec.plan` — stub OpenSpec change. Unpaid calls return **402**.

## Configure

Set `PAY_TO` in `packages/x402-gateway/wrangler.jsonc` to **your** Base wallet. Default is the burn address so funds cannot land on a tutorial wallet.

```bash
cd packages/x402-gateway
npm install
npx wrangler deploy
```

Network starts on `base-sepolia`. Flip to `base` after one test payment.

## SKUs

| SKU | Grant |
|-----|--------|
| T10K | 10,000 prompt or completion tokens |
| M10 | 600s wall clock |

## Related

| Repo | Role |
|------|------|
| [astras-ai/x402-monetized-api-gateway](https://github.com/astras-ai/x402-monetized-api-gateway) | Demo admin UI |
| [astras-ai/CF_Vibe](https://github.com/astras-ai/CF_Vibe) | Cloudflare vibe |
| This repo | Live x402 edge + brand |
