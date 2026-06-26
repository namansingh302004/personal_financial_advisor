import { useState, useEffect, useCallback } from 'react';
import { Plus, CheckCircle, X, Calendar, User as UserIcon } from 'lucide-react';
import api from '../api/axiosInstance';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import './DebtsPage.css';

const defaultForm = {
  personName: '',
  amount: '',
  type: 'lent',
  dueDate: '',
  note: ''
};

const DebtsPage = () => {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchDebts = useCallback(async () => {
    try {
      const { data } = await api.get('/api/debts');
      setDebts(data);
    } catch (err) {
      toast.error('Failed to load IOUs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const change = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.personName || !form.amount) return toast.error('Name and amount required');
    setSubmitting(true);
    try {
      const { data } = await api.post('/api/debts', form);
      setDebts(prev => [data, ...prev]);
      toast.success('IOU recorded!');
      setShowModal(false);
      setForm(defaultForm);
    } catch {
      toast.error('Failed to add IOU');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettle = async (id) => {
    try {
      const { data } = await api.put(`/api/debts/${id}/settle`);
      setDebts(prev => prev.map(d => d._id === id ? data.debt : d));
      toast.success('Debt settled and recorded in transactions!');
    } catch {
      toast.error('Failed to settle debt');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/debts/${id}`);
      setDebts(prev => prev.filter(d => d._id !== id));
      toast.success('Debt deleted');
    } catch {
      toast.error('Failed to delete debt');
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'No due date';
  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const lentDebts = debts.filter(d => d.type === 'lent');
  const borrowedDebts = debts.filter(d => d.type === 'borrowed');

  const renderDebtCard = (debt) => (
    <div key={debt._id} className={`debt-card ${debt.status === 'settled' ? 'settled' : ''}`}>
      <div className="debt-info">
        <span className="debt-person">{debt.personName}</span>
        <div className="debt-meta">
          <Calendar size={10} /> {fmtDate(debt.dueDate)}
          {debt.status === 'settled' && <span className="badge" style={{background:'var(--color-surface-dim)'}}>settled</span>}
        </div>
      </div>
      <div className="debt-amount-container">
        <span className={`debt-amount ${debt.type}`}>
          {fmt(debt.amount)}
        </span>
        <div className="debt-actions">
          {debt.status !== 'settled' && (
            <button className="btn btn-icon btn-ghost" title="Mark Settled" onClick={() => handleSettle(debt._id)}>
              <CheckCircle size={14} style={{ color: 'var(--color-primary)' }} />
            </button>
          )}
          <button className="btn btn-icon btn-danger" title="Delete" onClick={() => handleDelete(debt._id)}>
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page debts-page">
          <div className="debts-header">
            <div>
              <h1 className="page-title">iou tracking</h1>
              <p className="page-subtitle">keep track of money you owe or are owed</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={15} />
              [ add iou ]
            </button>
          </div>

          {loading ? (
             <div className="loading-full"><div className="spinner" /></div>
          ) : debts.length === 0 ? (
            <div className="empty-state" style={{ marginTop: '100px' }}>
              <div className="empty-state-icon"><UserIcon size={48} /></div>
              <h3 className="empty-state-title">All settled up!</h3>
              <p className="empty-state-text">You don't have any pending IOUs.</p>
            </div>
          ) : (
            <div className="debts-grid">
              <div className="debt-column">
                <h3 className="debt-column-title">i am owed (lent)</h3>
                {lentDebts.length === 0 ? (
                  <p className="text-muted text-sm">No active lent records.</p>
                ) : (
                  lentDebts.map(renderDebtCard)
                )}
              </div>
              <div className="debt-column">
                <h3 className="debt-column-title">i owe (borrowed)</h3>
                {borrowedDebts.length === 0 ? (
                  <p className="text-muted text-sm">No active borrowed records.</p>
                ) : (
                  borrowedDebts.map(renderDebtCard)
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">[ add iou record ]</span>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">person name</label>
                <input className="form-input" placeholder="Alice, Bob..." value={form.personName} onChange={(e) => change('personName', e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">amount (₹)</label>
                  <input type="number" className="form-input" placeholder="0" value={form.amount} onChange={(e) => change('amount', e.target.value)} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">type</label>
                  <select className="form-select" value={form.type} onChange={(e) => change('type', e.target.value)}>
                    <option value="lent">I lent them</option>
                    <option value="borrowed">I borrowed from them</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">due date (optional)</label>
                <input type="date" className="form-input" value={form.dueDate} onChange={(e) => change('dueDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">note (optional)</label>
                <input className="form-input" placeholder="Dinner, movie tickets..." value={form.note} onChange={(e) => change('note', e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                {submitting ? 'saving...' : '[ save iou ]'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtsPage;
