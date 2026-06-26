import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const change = (field, value) => {
    setError('');
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) return setError('Email and password are required');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', form);
      login(data);
      toast.success(`Welcome back, ${data.name}!`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo">finwise</span>
          <p className="auth-tagline">your money, simplified.</p>
        </div>

        <span className="auth-label">[login]</span>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">email</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => change('email', e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => change('password', e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="form-error mb-4">{error}</p>}

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> entering...</>
            ) : (
              '[ enter ]'
            )}
          </button>
        </form>

        <p className="auth-footer">
          No account?<Link to="/signup"> sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
