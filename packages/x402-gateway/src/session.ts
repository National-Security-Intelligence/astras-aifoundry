export type SessionGrant = {
  sku: "T10K" | "M10";
  tool: string;
  budget_in: number;
  budget_out: number;
  exp: number;
  jti: string;
};

export function newGrant(tool: string, ttlSec: number, budgetIn: number, budgetOut: number): SessionGrant {
  return {
    sku: "T10K",
    tool,
    budget_in: budgetIn,
    budget_out: budgetOut,
    exp: Math.floor(Date.now() / 1000) + ttlSec,
    jti: crypto.randomUUID(),
  };
}

export function remainingHeaders(g: SessionGrant): Record<string, string> {
  return {
    "X-AIFoundry-Sku": g.sku,
    "X-AIFoundry-Tool": g.tool,
    "X-AIFoundry-Budget-In": String(g.budget_in),
    "X-AIFoundry-Budget-Out": String(g.budget_out),
    "X-AIFoundry-Expires": String(g.exp),
    "X-AIFoundry-Jti": g.jti,
  };
}
