import { useState } from 'react';
import { X, Calendar, RepeatIcon } from 'lucide-react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Bills & Utilities', 'Subscription', 'Rent', 'Insurance',
  'EMI', 'Salary', 'Freelance', 'Investment', 'Other',
];

const defaultForm = {
  title: '',
  amount: '',
  type: 'expense',
  category: 'Bills & Utilities',
  frequency: 'monthly',
  nextDueDate: new Date().toISOString().split('T')[0],
};

const RecurringPaymentsPanel = ({ payments, onAdd, onDelete, onToggle }) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const isDue = (date) => new Date(date) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  const change = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) return toast.error('Title and amount are required');
    setLoading(true);
    try {
      const { data } = await api.post('/api/recurring', { ...form, amount: Number(form.amount) });
      toast.success('Recurring payment added');
      onAdd(data);
      setForm(defaultForm);
      setShowModal(false);
    } catch {
      toast.error('Failed to add recurring payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div className="flex items-center justify-between mb-4">
        <span className="card-title">recurring payments</span>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <RepeatIcon size={12} />
          [ add reminder ]
        </button>
      </div>

      {payments.length === 0 ? (
        <div className="empty-state" style={{ padding: '24px 0' }}>
          <div className="empty-state-icon">🔄</div>
          <p className="empty-state-text">no recurring payments yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {payments.map((p) => (
            <div
              key={p._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid var(--color-border-subtle)',
                opacity: p.active ? 1 : 0.5,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>{p.title}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  <Calendar size={10} style={{ display: 'inline', marginRight: 4 }} />
                  due {fmtDate(p.nextDueDate)} · {p.frequency}
                  {isDue(p.nextDueDate) && p.active && (
                    <span style={{ marginLeft: 6, color: 'var(--color-expense)', fontWeight: 600 }}>● due soon</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={p.type === 'income' ? 'amount-income' : 'amount-expense'} style={{ fontSize: 14 }}>
                  {p.type === 'income' ? '+' : '−'}{fmt(p.amount)}
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => onToggle(p._id, !p.active)}
                  title={p.active ? 'Pause' : 'Resume'}
                  style={{ fontSize: 10, padding: '4px 8px' }}
                >
                  {p.active ? 'pause' : 'resume'}
                </button>
                <button
                  className="btn btn-icon btn-danger"
                  onClick={() => onDelete(p._id)}
                  title="Delete"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">[ add recurring payment ]</span>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">title</label>
                <input className="form-input" placeholder="Netflix, Rent, EMI..." value={form.title} onChange={(e) => change('title', e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">amount (₹)</label>
                  <input type="number" className="form-input" placeholder="0" value={form.amount} onChange={(e) => change('amount', e.target.value)} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">type</label>
                  <select className="form-select" value={form.type} onChange={(e) => change('type', e.target.value)}>
                    <option value="expense">expense</option>
                    <option value="income">income</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">frequency</label>
                  <select className="form-select" value={form.frequency} onChange={(e) => change('frequency', e.target.value)}>
                    <option value="daily">daily</option>
                    <option value="weekly">weekly</option>
                    <option value="monthly">monthly</option>
                    <option value="yearly">yearly</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">next due date</label>
                  <input type="date" className="form-input" value={form.nextDueDate} onChange={(e) => change('nextDueDate', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">category</label>
                <select className="form-select" value={form.category} onChange={(e) => change('category', e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? 'saving...' : '[ add recurring payment ]'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringPaymentsPanel;
