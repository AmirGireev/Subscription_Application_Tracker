// imports
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { formatMoney } from './utils/money';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { AuthProvider } from './context/AuthContext';

// frontend tests
describe('Frontend Tests', () => {
  // reset mocks
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // cleanup
  afterEach(() => {
    cleanup();
  });

  // money format
  it('formatMoney gives the expected string', () => {
    expect(formatMoney(1999)).toMatch(/19[.,]99/);
  });

  // login error
  it('shows an error message when the login fails', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      })
    ) as any;

    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  // stat cards
  it('stat cards render the values from a mocked /stats response', async () => {
    globalThis.fetch = vi.fn((url) => {
      if (url.toString().includes('/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            activeCount: 5,
            monthlyBurnCents: 5000,
            yearlyProjectionCents: 60000,
            byCategory: {},
            upcoming: []
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }) as any;

    render(
      <MemoryRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText(/50[.,]00/)).toBeInTheDocument();
    });
  });

  // filter test
  it('list shows only matching items after you change the filter', async () => {
    globalThis.fetch = vi.fn((url) => {
      const urlStr = url.toString();
      
      if (urlStr.includes('/stats')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ activeCount: 2, monthlyBurnCents: 2500, yearlyProjectionCents: 30000, byCategory: {}, upcoming: [] }) });
      }
      
      if (urlStr.includes('/subscriptions')) {
        if (urlStr.includes('category=music')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
              { id: 2, name: 'Spotify', cost_cents: 1000, billing_cycle: 'monthly', category: 'music', status: 'active', next_billing_date: null, notes: null },
            ])
          });
        }
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, name: 'Netflix', cost_cents: 1500, billing_cycle: 'monthly', category: 'video', status: 'active', next_billing_date: null, notes: null },
            { id: 2, name: 'Spotify', cost_cents: 1000, billing_cycle: 'monthly', category: 'music', status: 'active', next_billing_date: null, notes: null },
          ])
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }) as any;

    render(
      <MemoryRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Netflix')).toBeInTheDocument();
    });
    expect(screen.getByText('Spotify')).toBeInTheDocument();

    const filterSelect = screen.getByDisplayValue('All categories');
    fireEvent.change(filterSelect, { target: { value: 'music' } });

    await waitFor(() => {
      expect(screen.queryByText('Netflix')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Spotify')).toBeInTheDocument();
  });
});