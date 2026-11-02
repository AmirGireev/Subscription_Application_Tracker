import { useState, type FormEvent } from 'react';
import { CATEGORIES, type BillingCycle, type Subscription, type SubscriptionInput } from '../types';

interface Props {
  initial: Subscription | null;
  onSave: (data: SubscriptionInput) => Promise<void>;
  onCancelEdit: () => void;
}

export default function SubscriptionForm({ initial, onSave, onCancelEdit }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [price, setPrice] = useState(initial ? (initial.cost_cents / 100).toFixed(2) : '');
  const [cycle, setCycle] = useState<BillingCycle>(initial?.billing_cycle ?? 'monthly');
  const [category, setCategory] = useState(initial?.category ?? 'other');
  const [date, setDate] = useState(initial?.next_billing_date ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const euros = parseFloat(price.replace(',', '.'));
    if (!name.trim() || Number.isNaN(euros) || euros < 0) {
      setError('Enter a name and a valid price');
      return;
    }
    try {
      await onSave({
        name: name.trim(),
        cost_cents: Math.round(euros * 100), // euros -> integer cents
        billing_cycle: cycle,
        category,
        status: initial?.status ?? 'active',
        next_billing_date: date || null,
        notes: notes.trim() || null,
      });
      if (!initial) {
        setName('');
        setPrice('');
        setDate('');
        setNotes('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <form className='sub-form' onSubmit={handleSubmit}>
      <input placeholder='Name (e.g. Netflix)' value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder='Price in EUR' inputMode='decimal' value={price} onChange={(e) => setPrice(e.target.value)} />
      <select value={cycle} onChange={(e) => setCycle(e.target.value as BillingCycle)}>
        <option value='monthly'>Monthly</option>
        <option value='yearly'>Yearly</option>
      </select>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <input type='date' value={date} onChange={(e) => setDate(e.target.value)} />
      <input placeholder='Notes (optional)' value={notes} onChange={(e) => setNotes(e.target.value)} />
      <button type='submit'>{initial ? 'Save changes' : 'Add'}</button>
      {initial && <button type='button' onClick={onCancelEdit}>Discard</button>}
      {error && <p className='error' role='alert'>{error}</p>}
    </form>
  );
}