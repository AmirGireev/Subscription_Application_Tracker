export type BillingCycle = 'monthly' | 'yearly';
export type SubStatus = 'active' | 'cancelled';

export interface Subscription {
  id: number;
  name: string;
  cost_cents: number;
  billing_cycle: BillingCycle;
  category: string;
  status: SubStatus;
  next_billing_date: string | null;
  notes: string | null;
}

export interface Stats {
  activeCount: number;
  monthlyBurnCents: number;
  yearlyProjectionCents: number;
  byCategory: Record<string, number>;
  upcoming: { name: string; cost_cents: number; next_billing_date: string }[];
}