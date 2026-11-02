import type { Subscription } from '../types';
import { formatMoney } from '../utils/money';

interface Props {
  subs: Subscription[];
  onEdit: (s: Subscription) => void;
  onCancel: (s: Subscription) => void;
  onDelete: (id: number) => void;
}

export default function SubscriptionList({ subs, onEdit, onCancel, onDelete }: Props) {
  if (subs.length === 0) return <p>No subscriptions found.</p>;

  return (
    <ul className='list'>
      {subs.map((s) => (
        <li key={s.id} className={s.status === 'cancelled' ? 'cancelled' : ''}>
          <div>
            <strong>{s.name}</strong>
            <small>
              {s.category} · {s.billing_cycle}
              {s.next_billing_date ? ` · renews ${s.next_billing_date}` : ''}
              {s.status === 'cancelled' ? ' · cancelled' : ''}
            </small>
          </div>
          <span>{formatMoney(s.cost_cents)}</span>
          <div className='actions'>
            <button onClick={() => onEdit(s)}>Edit</button>
            {s.status === 'active' && <button onClick={() => onCancel(s)}>Cancel</button>}
            <button onClick={() => onDelete(s.id)}>Delete</button>
          </div>
        </li>
      ))}
    </ul>
  );
}