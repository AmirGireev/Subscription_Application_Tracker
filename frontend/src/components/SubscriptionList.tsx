import type { Subscription } from '../types';
import { formatMoney } from '../utils/money';

const CANCEL_LINKS: Record<string, string> = {
  netflix: 'https://www.netflix.com/cancelplan',
  spotify: 'https://www.spotify.com/account/cancel/',
  amazon: 'https://www.amazon.de/mc/pipelines/cancellation',
  prime: 'https://www.amazon.de/mc/pipelines/cancellation',
  disney: 'https://www.disneyplus.com/account/cancel',
  apple: 'https://reportaproblem.apple.com/',
  dazn: 'https://my.dazn.com/help/how-to-cancel-your-subscription',
  adobe: 'https://account.adobe.com/plans',
  youtube: 'https://www.youtube.com/paid_memberships',
  chatgpt: 'https://chat.openai.com/#settings/DataControls',
  playstation: 'https://store.playstation.com/de-de/subscriptions',
  xbox: 'https://account.microsoft.com/services',
  microsoft: 'https://account.microsoft.com/services',
  icloud: 'https://support.apple.com/de-de/HT202619',
  dropbox: 'https://www.dropbox.com/account/plan'
};

interface Props {
  subs: Subscription[];
  onEdit: (s: Subscription) => void;
  onCancel: (s: Subscription) => void;
  onDelete: (id: number) => void;
  onReactivate: (s: Subscription) => void;
}

export default function SubscriptionList({ subs, onEdit, onCancel, onDelete, onReactivate }: Props) {
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
            {s.notes && <small style={{ color: '#059669', display: 'block', marginTop: '6px', fontWeight: '500' }}>{s.notes}</small>}
          </div>
          <span>{formatMoney(s.cost_cents)}</span>
          <div className='actions'>
            <button onClick={() => onEdit(s)}>Edit</button>
            
            {s.status === 'active' && (
              <button onClick={() => {
                onCancel(s);
                const nameStr = s.name.toLowerCase();
                const serviceKey = Object.keys(CANCEL_LINKS).find(key => nameStr.includes(key));
                if (serviceKey) window.open(CANCEL_LINKS[serviceKey], '_blank');
              }}>Cancel</button>
            )}

            {s.status === 'cancelled' && (
              <button onClick={() => onReactivate(s)}>Reactivate</button>
            )}
            
            <button onClick={() => onDelete(s.id)}>Delete</button>
          </div>
        </li>
      ))}
    </ul>
  );
}