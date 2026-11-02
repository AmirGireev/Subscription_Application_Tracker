export type BillingCycle = 'monthly' | 'yearly';

export interface SubRow {
  name: string;
  cost_cents: number;
  billing_cycle: BillingCycle;
  category: string;
  next_billing_date: string | null; // YYYY-MM-DD
}

export function monthlyCost(costCents: number, cycle: BillingCycle): number {
  return cycle === 'yearly' ? Math.round(costCents / 12) : costCents;
}

export function calcStats(subs: SubRow[], today = new Date()) {
  const byCategory: Record<string, number> = {};
  let monthlyBurnCents = 0;

  for (const s of subs) {
    const m = monthlyCost(s.cost_cents, s.billing_cycle);
    monthlyBurnCents += m;
    byCategory[s.category] = (byCategory[s.category] ?? 0) + m;
  }

  const from = today.toISOString().slice(0, 10);
  const limit = new Date(today);
  limit.setDate(limit.getDate() + 30);
  const to = limit.toISOString().slice(0, 10);

  // ISO date strings compare correctly as plain strings
  const upcoming = subs
    .filter((s) => s.next_billing_date && s.next_billing_date >= from && s.next_billing_date <= to)
    .sort((a, b) => a.next_billing_date!.localeCompare(b.next_billing_date!));

  return {
    activeCount: subs.length,
    monthlyBurnCents,
    yearlyProjectionCents: monthlyBurnCents * 12,
    byCategory,
    upcoming,
  };
}