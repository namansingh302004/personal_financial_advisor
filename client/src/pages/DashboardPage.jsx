import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import WalletSummary from '../components/WalletSummary';
import TransactionTable from '../components/TransactionTable';
import ActivityChart from '../components/ActivityChart';
import RecurringPaymentsPanel from '../components/RecurringPaymentsPanel';
import AddTransactionModal from '../components/AddTransactionModal';
import toast from 'react-hot-toast';
import './DashboardPage.css';

const DashboardPage = () => {
  const { updateUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [recurringPayments, setRecurringPayments] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '', type: '', category: '', startDate: '', endDate: '',
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.search) params.search = filters.search;

      const [txRes, recurRes, dailyRes, sumRes] = await Promise.all([
        api.get('/api/transactions', { params }),
        api.get('/api/recurring'),
        api.get('/api/analytics/daily'),
        api.get('/api/analytics/summary'),
      ]);

      setTransactions(txRes.data);
      setRecurringPayments(recurRes.data);
      setDailyData(dailyRes.data);
      setSummary(sumRes.data);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleTransactionAdded = (newTx) => {
    setTransactions((prev) => [newTx, ...prev]);
    fetchAll(); // refresh summary + chart
    // Sync wallet balance from server
    api.get('/api/profile').then(({ data }) => updateUser(data)).catch(() => {});
  };

  const handleTransactionDelete = (id) => {
    setTransactions((prev) => prev.filter((t) => t._id !== id));
    fetchAll();
    api.get('/api/profile').then(({ data }) => updateUser(data)).catch(() => {});
  };

  const handleRecurringAdd = (p) => setRecurringPayments((prev) => [...prev, p]);

  const handleRecurringDelete = async (id) => {
    try {
      await api.delete(`/api/recurring/${id}`);
      setRecurringPayments((prev) => prev.filter((p) => p._id !== id));
      toast.success('Recurring payment removed');
    } catch {
      toast.error('Failed to delete recurring payment');
    }
  };

  const handleRecurringToggle = async (id, active) => {
    try {
      const { data } = await api.put(`/api/recurring/${id}`, { active });
      setRecurringPayments((prev) => prev.map((p) => (p._id === id ? data : p)));
    } catch {
      toast.error('Failed to update recurring payment');
    }
  };

  const handleRecurringPaid = (transaction, updatedPayment) => {
    setTransactions((prev) => [transaction, ...prev]);
    setRecurringPayments((prev) => prev.map((p) => (p._id === updatedPayment._id ? updatedPayment : p)));
    fetchAll(); // Refresh summary + chart
    api.get('/api/profile').then(({ data }) => updateUser(data)).catch(() => {});
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page">
          <div className="dashboard-header">
            <div>
              <h1 className="page-title">dashboard</h1>
              <p className="page-subtitle">track your financial life</p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
              id="add-transaction-btn"
            >
              <Plus size={15} />
              [ + add transaction ]
            </button>
          </div>

          {loading ? (
            <div className="loading-full">
              <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
            </div>
          ) : (
            <>
              <WalletSummary summary={summary} />

              <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="dashboard-main">
                  <TransactionTable
                    transactions={transactions}
                    onDelete={handleTransactionDelete}
                    filters={filters}
                    onFilterChange={setFilters}
                  />
                </div>
              </div>

              <div className="dashboard-bottom">
                <div className="dashboard-chart">
                  <ActivityChart data={dailyData} />
                </div>
                <div className="dashboard-recurring">
                  <RecurringPaymentsPanel
                    payments={recurringPayments}
                    onAdd={handleRecurringAdd}
                    onDelete={handleRecurringDelete}
                    onToggle={handleRecurringToggle}
                    onPaid={handleRecurringPaid}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {showAddModal && (
        <AddTransactionModal
          onClose={() => setShowAddModal(false)}
          onAdded={handleTransactionAdded}
        />
      )}
    </div>
  );
};

export default DashboardPage;
