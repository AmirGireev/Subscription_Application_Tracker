import { useState, useEffect } from 'react';
import type { Subscription, SubscriptionInput } from '../types';

interface Props {
  initial: Subscription | null;
  onSave: (data: SubscriptionInput, alreadyPaid: boolean) => Promise<void>;
  onCancelEdit: () => void;
}

export default function SubscriptionForm({ initial, onSave, onCancelEdit }: Props) {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [cycle, setCycle] = useState<'monthly'|'yearly'>('monthly');
  const [category, setCategory] = useState('other');
  const [nextDate, setNextDate] = useState('');
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setCost((initial.cost_cents / 100).toString());
      setCycle(initial.billing_cycle);
      setCategory(initial.category);
      setNextDate(initial.next_billing_date || '');
    }
  }, [initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        name,
        cost_cents: Math.round(parseFloat(cost) * 100),
        billing_cycle: cycle,
        category,
        next_billing_date: nextDate || null,
        status: initial?.status || 'active',
        notes: initial?.notes || null
      }, alreadyPaid);
      
      if (!initial) {
        setName(''); setCost(''); setNextDate(''); setCategory('other'); setAlreadyPaid(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="sub-form">
      <div>
        <input 
          list="popular-subs" 
          placeholder="Name (e.g. Netflix)" 
          value={name} 
          onChange={e=>setName(e.target.value)} 
          required 
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
        <datalist id="popular-subs">
          <option value="Netflix" />
          <option value="Spotify" />
          <option value="Amazon Prime" />
          <option value="YouTube Premium" />
          <option value="Disney+" />
          <option value="Apple Music" />
          <option value="iCloud" />
          <option value="ChatGPT Plus" />
          <option value="DAZN" />
          <option value="Adobe Creative Cloud" />
          <option value="Microsoft 365" />
          <option value="PlayStation Plus" />
          <option value="Xbox Game Pass" />
        </datalist>
      </div>
      
      <input type="number" step="0.01" placeholder="Cost (EUR)" value={cost} onChange={e=>setCost(e.target.value)} required />
      
      <select value={cycle} onChange={e=>setCycle(e.target.value as any)}>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select>
      
      <input 
        list="categories-list" 
        placeholder="Category (e.g. video)" 
        value={category} 
        onChange={e=>setCategory(e.target.value)} 
        required 
      />
      <datalist id="categories-list">
        <option value="video" />
        <option value="music" />
        <option value="sport" />
        <option value="tech" />
        <option value="phone" />
        <option value="other" />
      </datalist>
      
      <input type="date" value={nextDate} onChange={e=>setNextDate(e.target.value)} />
      
      {!initial && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', gridColumn: '1 / -1', cursor: 'pointer' }}>
          <input type="checkbox" checked={alreadyPaid}  onChange={e => setAlreadyPaid(e.target.checked)} />
          Don't log immediate payment
        </label>
      )}

      <div style={{ display: 'flex', gap: '1rem', gridColumn: '1 / -1' }}>
        <button type="submit" disabled={loading}>Save</button>
        {initial && <button type="button" onClick={onCancelEdit} style={{ background: '#6b7280' }}>Cancel</button>}
      </div>
    </form>
  );
}