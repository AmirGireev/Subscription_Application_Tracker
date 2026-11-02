// imports
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, type Stats, type Subscription, type SubscriptionInput } from '../types';
import { formatMoney } from '../utils/money';
import SubscriptionForm from '../components/SubscriptionForm';
import SubscriptionList from '../components/SubscriptionList';

// stat card
function StatCard({ label, value }: { label: string; value: string }) {
  // render
  return (
    <div className='card'>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

// dashboard
export default function Dashboard() {
  // state
  const { logout } = useAuth();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // load data
  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      
      const [list, st] = await Promise.all([
        api<Subscription[]>(`/api/subscriptions?${params}`),
        api<Stats>('/api/subscriptions/stats'),
      ]);

      // due renewals
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dueRenewals = list.filter(sub => 
        sub.status === 'active' && 
        sub.next_billing_date && 
        new Date(sub.next_billing_date + 'T00:00:00') <= today
      );

      // auto renew
      if (dueRenewals.length > 0) {
        await Promise.all(dueRenewals.map(sub => {
          const nextDate = new Date(sub.next_billing_date + 'T00:00:00');
          if (sub.billing_cycle === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
          else nextDate.setFullYear(nextDate.getFullYear() + 1);

          const costStr = formatMoney(sub.cost_cents);
          const todayStr = new Date().toLocaleDateString();
          const newNote = sub.notes ? `${sub.notes} | Paid ${costStr} on ${todayStr}` : `Paid ${costStr} on ${todayStr}`;

          return api(`/api/subscriptions/${sub.id}`, {
            method: 'PUT',
            body: JSON.stringify({ 
              ...sub, 
              next_billing_date: nextDate.toISOString().split('T')[0], 
              notes: newNote 
            }),
          });
        }));

        const [newList, newSt] = await Promise.all([
          api<Subscription[]>(`/api/subscriptions?${params}`),
          api<Stats>('/api/subscriptions/stats'),
        ]);
        setSubs(newList);
        setStats(newSt);
      } else {
        setSubs(list);
        setStats(st);
      }
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter]);

  // initial load
  useEffect(() => {
    load();
  }, [load]);

  // save
  async function save(data: SubscriptionInput, alreadyPaid: boolean = true) {
    if (editing) {
      await api(`/api/subscriptions/${editing.id}`, { method: 'PUT', body: JSON.stringify(data) });
      setEditing(null);
    } else {
      const costStr = formatMoney(data.cost_cents);
      const todayStr = new Date().toLocaleDateString();
      
      let nextDate = data.next_billing_date ? new Date(data.next_billing_date) : new Date();
      if (!data.next_billing_date) {
         if (data.billing_cycle === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
         else nextDate.setFullYear(nextDate.getFullYear() + 1);
      }

      const newData = {
        ...data,
        next_billing_date: nextDate.toISOString().split('T')[0],
        notes: alreadyPaid ? '' : `Paid ${costStr} on ${todayStr}`
      };

      await api('/api/subscriptions', { method: 'POST', body: JSON.stringify(newData) });
    }
    await load();
  }

  // run action
  async function run(action: () => Promise<unknown>) {
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  // cancel
  const cancelSub = (s: Subscription) =>
    run(() =>
      api(`/api/subscriptions/${s.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...s, status: 'cancelled' }),
      })
    );

  // delete
  const removeSub = (id: number) => {
    if (!confirm('Delete this subscription?')) return;
    run(() => api(`/api/subscriptions/${id}`, { method: 'DELETE' }));
  };

  // reactivate
  const reactivateSub = (s: Subscription) => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30);
    run(() =>
      api(`/api/subscriptions/${s.id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          ...s, 
          status: 'active', 
          next_billing_date: nextDate.toISOString().split('T')[0] 
        }),
      })
    );
  };

  // total paid
  const totalPaidCents = subs.reduce((sum, sub) => {
    if (!sub.notes) return sum;
    const paymentCount = (sub.notes.match(/Paid/g) || []).length;
    return sum + (paymentCount * sub.cost_cents);
  }, 0);

  // loading state
  if (loading) return <p className='container'>Loading…</p>;

  return (
    <main className='container'>
      <header className='topbar'>
        <h1>Subscription Tracker</h1>
        <button onClick={logout}>Log out</button>
      </header>

      {error && <p className='error' role='alert'>{error}</p>}

      {stats && (
        <>
          <section className='cards'>
            <StatCard label='Monthly burn' value={formatMoney(stats.monthlyBurnCents)} />
            <StatCard label='Yearly projection' value={formatMoney(stats.yearlyProjectionCents)} />
            <StatCard label='Active subscriptions' value={String(stats.activeCount)} />
            <StatCard label='Total Paid (All-Time)' value={formatMoney(totalPaidCents)} />
          </section>

          <section>
            <h2>By category</h2>
            {Object.keys(stats.byCategory).length === 0 && <p>Nothing yet.</p>}
            {Object.entries(stats.byCategory).map(([cat, cents]) => (
              <div key={cat} className='bar-row'>
                <span>{cat}</span>
                <div className='bar'>
                  <div
                    className='bar-fill'
                    style={{ width: `${stats.monthlyBurnCents ? (cents / stats.monthlyBurnCents) * 100 : 0}%` }}
                  />
                </div>
                <span>{formatMoney(cents)}</span>
              </div>
            ))}
          </section>

          <section>
            <h2>Upcoming renewals (30 days)</h2>
            {stats.upcoming.length === 0 && <p>No renewals coming up.</p>}
            <ul>
              {stats.upcoming.map((u) => (
                <li key={`${u.name}-${u.next_billing_date}`}>
                  {u.next_billing_date}: {u.name} ({formatMoney(u.cost_cents)})
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <section>
        <h2>{editing ? 'Edit subscription' : 'Add subscription'}</h2>
        <SubscriptionForm
          key={editing?.id ?? 'new'}
          initial={editing}
          onSave={save}
          onCancelEdit={() => setEditing(null)}
        />
      </section>

      <section>
        <h2>Subscriptions</h2>
        <div className='filters'>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value=''>All statuses</option>
            <option value='active'>Active</option>
            <option value='cancelled'>Cancelled</option>
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value=''>All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <SubscriptionList 
          subs={subs} 
          onEdit={setEditing} 
          onCancel={cancelSub} 
          onDelete={removeSub} 
          onReactivate={reactivateSub} 
        />
      </section>
    </main>
  );
}