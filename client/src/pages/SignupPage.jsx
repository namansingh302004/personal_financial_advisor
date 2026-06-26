import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SignupPage = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    walletBalance: '',
    monthlyBudget: '',
  });
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
    if (!form.name || !form.email || !form.password) return setError('Name, email and password are required');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/signup', {
        ...form,
        walletBalance: Number(form.walletBalance) || 0,
        monthlyBudget: Number(form.monthlyBudget) || 0,
      });
      login(data);
      toast.success(`Welcome to finwise, ${data.name}!`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const { data } = await api.post('/api/auth/google', { token: credentialResponse.credential });
      login(data);
      toast.success(`Welcome, ${data.name}!`);
      navigate('/dashboard');
    } catch (err) {
      setError('Google Sign-In failed. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 440 }}>
        <div className="auth-brand">
          <span className="auth-logo">finwise</span>
          <p className="auth-tagline">your money, simplified.</p>
        </div>

        <span className="auth-label">[create account]</span>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">full name</label>
            <input
              id="signup-name"
              type="text"
              className="form-input"
              placeholder="Naman Singh"
              value={form.name}
              onChange={(e) => change('name', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">email</label>
            <input
              id="signup-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => change('email', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">password</label>
            <input
              id="signup-password"
              type="password"
              className="form-input"
              placeholder="min 6 characters"
              value={form.password}
              onChange={(e) => change('password', e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">current balance (₹)</label>
              <input
                id="signup-balance"
                type="number"
                className="form-input"
                placeholder="45000"
                value={form.walletBalance}
                onChange={(e) => change('walletBalance', e.target.value)}
                min="0"
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">monthly budget (₹)</label>
              <input
                id="signup-budget"
                type="number"
                className="form-input"
                placeholder="20000"
                value={form.monthlyBudget}
                onChange={(e) => change('monthlyBudget', e.target.value)}
                min="0"
              />
            </div>
          </div>

          {error && <p className="form-error mb-4">{error}</p>}

          <button
            id="signup-submit"
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> creating account...</>
            ) : (
              '[ create account ]'
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Sign-In failed')}
            shape="rectangular"
            theme="outline"
            text="signup_with"
          />
        </div>

        <p className="auth-footer">
          Already have an account?<Link to="/login"> log in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
