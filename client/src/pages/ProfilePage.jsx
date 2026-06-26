import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import { Save, User } from 'lucide-react';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    walletBalance: user?.walletBalance || 0,
    monthlyBudget: user?.monthlyBudget || 0,
    currentPassword: '',
    newPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const change = (field, value) => {
    setError('');
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword && form.newPassword.length < 6) {
      return setError('New password must be at least 6 characters');
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        walletBalance: Number(form.walletBalance),
        monthlyBudget: Number(form.monthlyBudget),
      };
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }

      const { data } = await api.put('/api/profile', payload);
      updateUser(data);
      toast.success('Profile updated');
      setForm((f) => ({ ...f, currentPassword: '', newPassword: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page">
          <h1 className="page-title">profile</h1>
          <p className="page-subtitle">manage your account and preferences</p>

          {/* Avatar card */}
          <div className="profile-avatar-card card">
            <div className="profile-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="profile-name">{user?.name}</div>
              <div className="profile-email">{user?.email}</div>
              <div className="profile-since text-xs text-muted mt-1">
                member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="profile-grid">
            {/* Account Settings */}
            <form className="card" onSubmit={handleSave}>
              <span className="card-title">[ account settings ]</span>

              <div className="form-group">
                <label className="form-label">full name</label>
                <input className="form-input" value={form.name} onChange={(e) => change('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">email</label>
                <input type="email" className="form-input" value={form.email} onChange={(e) => change('email', e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">wallet balance (₹)</label>
                  <input type="number" className="form-input" value={form.walletBalance} onChange={(e) => change('walletBalance', e.target.value)} min="0" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">monthly budget (₹)</label>
                  <input type="number" className="form-input" value={form.monthlyBudget} onChange={(e) => change('monthlyBudget', e.target.value)} min="0" />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 20, marginTop: 4 }}>
                <span className="card-title">[ change password ]</span>
                <div className="form-group mt-4">
                  <label className="form-label">current password</label>
                  <input type="password" className="form-input" placeholder="leave blank to keep current" value={form.currentPassword} onChange={(e) => change('currentPassword', e.target.value)} autoComplete="current-password" />
                </div>
                <div className="form-group">
                  <label className="form-label">new password</label>
                  <input type="password" className="form-input" placeholder="min 6 characters" value={form.newPassword} onChange={(e) => change('newPassword', e.target.value)} autoComplete="new-password" />
                </div>
              </div>

              {error && <p className="form-error mb-4">{error}</p>}

              <button type="submit" className="btn btn-primary" disabled={loading} id="save-profile-btn">
                {loading ? <span className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} /> : <Save size={14} />}
                {loading ? 'saving...' : '[ save changes ]'}
              </button>
            </form>

            {/* Stats card */}
            <div className="card">
              <span className="card-title">[ financial overview ]</span>
              <div className="stat-list">
                <div className="stat-item">
                  <span className="stat-label">wallet balance</span>
                  <span className="stat-value">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(user?.walletBalance || 0)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">monthly budget</span>
                  <span className="stat-value">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(user?.monthlyBudget || 0)}</span>
                </div>
              </div>

              <div className="profile-tips">
                <p className="card-title" style={{ marginBottom: 12 }}>[ tips ]</p>
                <ul className="tips-list">
                  <li>set your wallet balance to reflect your actual current balance</li>
                  <li>your monthly budget is used to track spending progress</li>
                  <li>use the AI insights panel to get personalized advice</li>
                  <li>mark recurring transactions to track subscriptions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
