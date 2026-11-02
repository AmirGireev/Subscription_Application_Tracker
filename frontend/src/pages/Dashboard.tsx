import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, type Stats, type Subscription, type SubscriptionInput } from '../types';
import { formatMoney } from '../utils/money';
import SubscriptionForm from '../components/SubscriptionForm';
import SubscriptionList from '../components/SubscriptionList';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className='card'>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

export default function Dashboard() {
  const { logout } = useAuth();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetches the list (with filters) and the stats together
  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      const [list, st] = await Promise.all([
        api<Subscription[]>(`/api/subscriptions?${params}`),
        api<Stats>('/api/subscriptions/stats'),
      ]);
      setSubs(list);
      setStats(st);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Errors are thrown back to the form, which shows them
  async function save(data: SubscriptionInput) {
    if (editing) {
      await api(`/api/subscriptions/${editing.id}`, { method: 'PUT', body: JSON.stringify(data) });
      setEditing(null);
    } else {
      await api('/api/subscriptions', { method: 'POST', body: JSON.stringify(data) });
    }
    await load();
  }

  async function run(action: () => Promise<unknown>) {
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  // PUT replaces the whole object, so send every field with the new status
  const cancelSub = (s: Subscription) =>
    run(() =>
      api(`/api/subscriptions/${s.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...s, status: 'cancelled' }),
      })
    );

  const removeSub = (id: number) => {
    if (!confirm('Delete this subscription?')) return;
    run(() => api(`/api/subscriptions/${id}`, { method: 'DELETE' }));
  };

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
        <SubscriptionList subs={subs} onEdit={setEditing} onCancel={cancelSub} onDelete={removeSub} />
      </section>
    </main>
  );
}