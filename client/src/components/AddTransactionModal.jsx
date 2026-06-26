import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';
import './AddTransactionModal.css';

const CATEGORIES = [
  'Food & Dining', 'Transport', 'Entertainment', 'Health & Fitness',
  'Shopping', 'Bills & Utilities', 'Education', 'Travel', 'Groceries',
  'Salary', 'Freelance', 'Investment', 'Gift', 'Other',
];

const METHODS = ['cash', 'card', 'upi', 'netbanking', 'other'];

const defaultForm = {
  amount: '',
  type: 'expense',
  category: 'Food & Dining',
  note: '',
  paymentMethod: 'upi',
  recurring: false,
  date: new Date().toISOString().split('T')[0],
};

const AddTransactionModal = ({ onClose, onAdded }) => {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const change = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) {
      return setError('Please enter a valid amount greater than 0');
    }

    setLoading(true);
    try {
      const { data } = await api.post('/api/transactions', {
        ...form,
        amount: Number(form.amount),
      });
      toast.success('Transaction added');
      onAdded(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">[ add transaction ]</span>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Type toggle */}
          <div className="form-group">
            <label className="form-label">type</label>
            <div className="type-toggle">
              {['expense', 'income'].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`type-btn ${form.type === t ? `type-btn--${t}` : ''}`}
                  onClick={() => change('type', t)}
                >
                  [{t}]
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="form-label">amount (₹)</label>
            <input
              type="number"
              className="form-input"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => change('amount', e.target.value)}
              min="0.01"
              step="0.01"
              required
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">category</label>
            <select
              className="form-select"
              value={form.category}
              onChange={(e) => change('category', e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Row: Date + Method */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">date</label>
              <input
                type="date"
                className="form-input"
                value={form.date}
                onChange={(e) => change('date', e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">payment method</label>
              <select
                className="form-select"
                value={form.paymentMethod}
                onChange={(e) => change('paymentMethod', e.target.value)}
              >
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Note */}
          <div className="form-group">
            <label className="form-label">note (optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="brief description..."
              value={form.note}
              onChange={(e) => change('note', e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Recurring */}
          <div className="form-group">
            <label className="recurring-check">
              <input
                type="checkbox"
                checked={form.recurring}
                onChange={(e) => change('recurring', e.target.checked)}
              />
              <span className="form-label" style={{ marginBottom: 0 }}>mark as recurring</span>
            </label>
          </div>

          {error && <p className="form-error mb-4">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Plus size={15} />}
            {loading ? 'saving...' : '[ add transaction ]'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
