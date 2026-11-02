export const formatMoney = (cents: number) =>
  (cents / 100).toLocaleString('en-IE', { style: 'currency', currency: 'EUR' });