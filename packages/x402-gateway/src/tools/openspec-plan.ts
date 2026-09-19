export function stubOpenSpecPlan(input: { goal?: string }) {
  const goal = input.goal ?? "Define the next paid AIFoundry tool";
  return {
    brand: "AIFoundry.sh",
    parent: "Astras.ai",
    change: "add-x402-edge-gate",
    goal,
    next: [
      "Set PAY_TO to operator wallet",
      "Prove unpaid 402",
      "Settle on base-sepolia",
      "Flip NETWORK to base",
    ],
    sku: "T10K",
    note: "Stub only. No vendor model call.",
  };
}
