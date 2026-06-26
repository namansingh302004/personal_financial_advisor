import { useState } from 'react';
import { Trash2, Search, SlidersHorizontal } from 'lucide-react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';
import './TransactionTable.css';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const CATEGORIES = [
  'All', 'Food & Dining', 'Transport', 'Entertainment', 'Health & Fitness',
  'Shopping', 'Bills & Utilities', 'Education', 'Travel', 'Groceries',
  'Salary', 'Freelance', 'Investment', 'Gift', 'Other',
];

const TransactionTable = ({ transactions, onDelete, filters, onFilterChange }) => {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/api/transactions/${id}`);
      toast.success('Transaction deleted');
      onDelete(id);
    } catch {
      toast.error('Failed to delete transaction');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="card transaction-card">
      <div className="flex items-center justify-between mb-4">
        <span className="card-title">recent transactions</span>
        <span className="text-xs text-muted">{transactions.length} entries</span>
      </div>

      {/* Filters */}
      <div className="tx-filters">
        <div className="tx-search">
          <Search size={14} className="tx-search-icon" />
          <input
            type="text"
            placeholder="search transactions..."
            className="tx-search-input"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          />
        </div>
        <div className="tx-filter-row">
          <select
            className="form-select tx-select"
            value={filters.type}
            onChange={(e) => onFilterChange({ ...filters, type: e.target.value })}
          >
            <option value="">all types</option>
            <option value="income">income</option>
            <option value="expense">expense</option>
          </select>
          <select
            className="form-select tx-select"
            value={filters.category}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c === 'All' ? '' : c}>{c.toLowerCase()}</option>
            ))}
          </select>
          <input
            type="date"
            className="form-input tx-select"
            value={filters.startDate}
            onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
            placeholder="from"
          />
          <input
            type="date"
            className="form-input tx-select"
            value={filters.endDate}
            onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
            placeholder="to"
          />
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">no transactions found</div>
          <p className="empty-state-text">adjust filters or add a new transaction</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>date</th>
                <th>category</th>
                <th>note</th>
                <th>method</th>
                <th>amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id}>
                  <td className="text-xs text-muted">{fmtDate(tx.date)}</td>
                  <td>
                    <span className={`badge ${tx.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                      {tx.category}
                    </span>
                  </td>
                  <td className="tx-note">{tx.note || <span className="text-muted">—</span>}</td>
                  <td className="text-xs text-muted">{tx.paymentMethod}</td>
                  <td className={tx.type === 'income' ? 'amount-income' : 'amount-expense'}>
                    {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount)}
                  </td>
                  <td>
                    <button
                      className="btn btn-icon btn-danger"
                      onClick={() => handleDelete(tx._id)}
                      disabled={deletingId === tx._id}
                      title="Delete transaction"
                    >
                      {deletingId === tx._id ? (
                        <span className="spinner" style={{ width: 13, height: 13, borderWidth: 1.5 }} />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
