// imports
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

// auth form
export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // submit
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await api<{ token: string }>(`/api/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      login(token);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  // mode
  const isLogin = mode === 'login';

  // render
  return (
    <form className='auth' onSubmit={handleSubmit}>
      <h1>{isLogin ? 'Log in' : 'Create account'}</h1>
      <label>
        Email
        <input type='email' value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        Password
        <input
          type='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
      </label>
      {error && <p className='error' role='alert'>{error}</p>}
      <button type='submit' disabled={loading}>
        {loading ? 'Please wait…' : isLogin ? 'Log in' : 'Register'}
      </button>
      <p>
        {isLogin ? (
          <>No account? <Link to='/register'>Register</Link></>
        ) : (
          <>Already registered? <Link to='/login'>Log in</Link></>
        )}
      </p>
    </form>
  );
}