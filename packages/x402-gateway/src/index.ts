import { Hono } from "hono";
import { paymentMiddleware } from "x402-hono";
import { newGrant, remainingHeaders } from "./session";
import { stubOpenSpecPlan } from "./tools/openspec-plan";
import { estimateTokens, runNemotron, type ChatMsg, type NemotronEnv } from "./nemotron";

type Env = NemotronEnv & {
  PAY_TO: string;
  NETWORK: string;
  FACILITATOR_URL: string;
  SESSION_TTL_SEC: string;
  BUDGET_IN: string;
  BUDGET_OUT: string;
};

const app = new Hono<{ Bindings: Env }>();

const PAID = {
  "POST /v1/tools/openspec.plan": {
    price: "$0.05",
    network: "base-sepolia" as const,
    config: { description: "OpenSpec plan via Nemotron (T10K / 10 min)" },
  },
  "POST /v1/tools/nemotron.chat": {
    price: "$0.05",
    network: "base-sepolia" as const,
    config: { description: "Nemotron T10K block (Workers AI or cloudflared)" },
  },
};

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "aifoundry-x402",
    brand: "AIFoundry.sh",
    parent: "Astras.ai",
    network: c.env.NETWORK,
    nemotron: c.env.NEMOTRON_URL ? "cloudflared" : "workers-ai",
    pay_to_configured: Boolean(c.env.PAY_TO && !c.env.PAY_TO.toLowerCase().includes("dead")),
  }),
);

app.get("/", (c) =>
  c.json({
    name: "AIFoundry.sh",
    parent: "Astras.ai",
    model: "@cf/nvidia/nemotron-3-120b-a12b",
    tools: ["POST /v1/tools/openspec.plan", "POST /v1/tools/nemotron.chat"],
    skus: ["T10K", "M10"],
    campaign_networks: ["base", "solana", "polygon", "arbitrum", "world"],
  }),
);

app.use("/v1/tools/*", async (c, next) => {
  const routes = {
    "POST /v1/tools/openspec.plan": { ...PAID["POST /v1/tools/openspec.plan"], network: c.env.NETWORK as "base-sepolia" | "base" },
    "POST /v1/tools/nemotron.chat": { ...PAID["POST /v1/tools/nemotron.chat"], network: c.env.NETWORK as "base-sepolia" | "base" },
  };
  return paymentMiddleware(c.env.PAY_TO as `0x${string}`, routes, { url: c.env.FACILITATOR_URL })(c, next);
});

async function paidNemotron(c: { env: Env; req: { json: () => Promise<unknown> }; json: (b: unknown, s?: number) => Response; header: (k: string, v: string) => void }, tool: string, system: string) {
  let body: { goal?: string; messages?: ChatMsg[]; prompt?: string } = {};
  try {
    body = (await c.req.json()) as typeof body;
  } catch {
    body = {};
  }
  const budgetIn = Number(c.env.BUDGET_IN || 10000);
  const budgetOut = Number(c.env.BUDGET_OUT || 10000);
  const messages: ChatMsg[] = body.messages?.length
    ? body.messages
    : [
        { role: "system", content: system },
        { role: "user", content: body.prompt || body.goal || "Plan the next AIFoundry paid tool." },
      ];
  const inTok = messages.reduce((n, m) => n + estimateTokens(m.content), 0);
  if (inTok > budgetIn) {
    return c.json({ error: "budget_in_exceeded", inTok, budgetIn }, 413);
  }
  const grant = newGrant(tool, Number(c.env.SESSION_TTL_SEC || 600), budgetIn - inTok, budgetOut);
  for (const [k, v] of Object.entries(remainingHeaders(grant))) c.header(k, v);
  const out = await runNemotron(c.env, messages, Math.min(2048, budgetOut));
  const usedOut = estimateTokens(out.text);
  grant.budget_out = Math.max(0, budgetOut - usedOut);
  for (const [k, v] of Object.entries(remainingHeaders(grant))) c.header(k, v);
  return c.json({ paid: true, grant, usage: { in: inTok, out: usedOut }, ...out });
}

app.post("/v1/tools/openspec.plan", async (c) => {
  try {
    const r = await paidNemotron(
      c,
      "openspec.plan",
      "You write OpenSpec change proposals for AIFoundry.sh (Astras.ai). Be concrete. No secrets. Prepaid T10K block.",
    );
    if (r.status === 413) return r;
    const data = (await r.json()) as { paid: boolean; grant: unknown; usage: unknown; text: string; via: string; model: string };
    return c.json({ ...data, result: stubOpenSpecPlan({ goal: data.text.slice(0, 240) }) });
  } catch (e) {
    return c.json({ error: String(e) }, 502);
  }
});

app.post("/v1/tools/nemotron.chat", async (c) => {
  try {
    return await paidNemotron(c, "nemotron.chat", "You are Nemotron on AIFoundry.sh. Stay inside the prepaid token budget.");
  } catch (e) {
    return c.json({ error: String(e) }, 502);
  }
});

export default app;
