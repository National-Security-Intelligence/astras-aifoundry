export const NEMOTRON_CF = "@cf/nvidia/nemotron-3-120b-a12b";

export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

type AiBinding = {
  run: (model: string, input: Record<string, unknown>) => Promise<unknown>;
};

export type NemotronEnv = {
  AI?: AiBinding;
  NEMOTRON_URL?: string;
  NEMOTRON_TOKEN?: string;
  NEMOTRON_MODEL?: string;
};

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function extractText(raw: unknown): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  const o = raw as {
    response?: string;
    result?: { response?: string };
    choices?: { message?: { content?: string } }[];
  };
  return o.response ?? o.result?.response ?? o.choices?.[0]?.message?.content ?? JSON.stringify(raw);
}

export async function runNemotron(
  env: NemotronEnv,
  messages: ChatMsg[],
  maxOut: number,
): Promise<{ text: string; via: "cloudflared" | "workers-ai"; model: string }> {
  const model = env.NEMOTRON_MODEL || NEMOTRON_CF;
  const cap = Math.min(Math.max(16, maxOut), 8192);

  if (env.NEMOTRON_URL) {
    const base = env.NEMOTRON_URL.replace(/\/$/, "");
    const url = base.endsWith("/chat/completions") ? base : `${base}/v1/chat/completions`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(env.NEMOTRON_TOKEN ? { authorization: `Bearer ${env.NEMOTRON_TOKEN}` } : {}),
      },
      body: JSON.stringify({ model, messages, max_tokens: cap, stream: false }),
    });
    if (!res.ok) throw new Error(`nemotron_tunnel_${res.status}`);
    const text = extractText(await res.json());
    return { text, via: "cloudflared", model };
  }

  if (!env.AI) throw new Error("nemotron_not_configured");
  const raw = await env.AI.run(NEMOTRON_CF, { messages, max_tokens: cap });
  return { text: extractText(raw), via: "workers-ai", model: NEMOTRON_CF };
}
