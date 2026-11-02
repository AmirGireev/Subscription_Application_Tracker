import { monthlyCost, calcStats } from '../lib/burn';

it('normalizes yearly to monthly', () => {
  expect(monthlyCost(1200, 'yearly')).toBe(100);
  expect(monthlyCost(999, 'monthly')).toBe(999);
});

it('sums burn and lists renewals in the next 30 days', () => {
  const today = new Date('2026-01-01');
  const stats = calcStats([
    { name: 'Netflix', cost_cents: 1000, billing_cycle: 'monthly', category: 'video', next_billing_date: '2026-01-10' },
    { name: 'Domain', cost_cents: 1200, billing_cycle: 'yearly', category: 'dev', next_billing_date: '2026-06-01' },
  ], today);
  expect(stats.monthlyBurnCents).toBe(1100);
  expect(stats.upcoming).toHaveLength(1);
});