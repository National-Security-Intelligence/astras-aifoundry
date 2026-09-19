import { Hono } from "hono";
import { paymentMiddleware } from "x402-hono";
import { newGrant, remainingHeaders } from "./session";
import { stubOpenSpecPlan } from "./tools/openspec-plan";

type Env = {
  PAY_TO: string;
  NETWORK: string;
  FACILITATOR_URL: string;
  SESSION_TTL_SEC: string;
  BUDGET_IN: string;
  BUDGET_OUT: string;
};

const app = new Hono<{ Bindings: Env }>();

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "aifoundry-x402",
    brand: "AIFoundry.sh",
    parent: "Astras.ai",
    network: c.env.NETWORK,
    pay_to_configured: Boolean(c.env.PAY_TO && !c.env.PAY_TO.toLowerCase().includes("dead")),
  }),
);

app.get("/", (c) =>
  c.json({
    name: "AIFoundry.sh",
    parent: "Astras.ai",
    tools: ["POST /v1/tools/openspec.plan"],
    skus: ["T10K", "M10"],
  }),
);

app.use("/v1/tools/*", async (c, next) => {
  const payTo = c.env.PAY_TO as `0x${string}`;
  const mw = paymentMiddleware(
    payTo,
    {
      "POST /v1/tools/openspec.plan": {
        price: "$0.05",
        network: c.env.NETWORK as "base-sepolia" | "base",
        config: { description: "AIFoundry OpenSpec plan block (T10K / 10 min)" },
      },
    },
    { url: c.env.FACILITATOR_URL },
  );
  return mw(c, next);
});

app.post("/v1/tools/openspec.plan", async (c) => {
  let body: { goal?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }
  const grant = newGrant(
    "openspec.plan",
    Number(c.env.SESSION_TTL_SEC || 600),
    Number(c.env.BUDGET_IN || 10000),
    Number(c.env.BUDGET_OUT || 10000),
  );
  for (const [k, v] of Object.entries(remainingHeaders(grant))) c.header(k, v);
  return c.json({ paid: true, grant, result: stubOpenSpecPlan(body) });
});

export default app;
