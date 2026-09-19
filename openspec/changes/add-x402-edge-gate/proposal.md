# Change: add-x402-edge-gate

## Why
Demo gateway cannot settle. This brand worker uses x402-hono + facilitator.

## Scope
Worker, health, stub openspec.plan, 402 unpaid, budget headers.

## Out of scope
Kimi review, DeepSeek design, human OpenDesign.

## Acceptance
- GET /health → 200
- POST /v1/tools/openspec.plan unpaid → 402
- PAY_TO is operator wallet or burn placeholder
