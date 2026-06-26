import { useState, useEffect } from 'react';
import { Sparkles, Calendar } from 'lucide-react';
import api from '../api/axiosInstance';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import './InsightsPage.css';

const TIMEFRAMES = [
  { value: 'week', label: 'this week' },
  { value: 'month', label: 'this month' },
  { value: '3months', label: 'last 3 months' },
  { value: 'year', label: 'this year' },
];

const InsightsPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [timeframe, setTimeframe] = useState('month');

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/api/ai/insights');
      setHistory(data);
    } catch (err) {
      toast.error('Failed to load insights history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const generateInsight = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/api/ai/insights', { timeframe });
      setHistory([data, ...history]);
      toast.success('New insights generated!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate insights';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page">
          <div className="insights-header mb-4">
            <div>
              <h1 className="page-title">ai insights</h1>
              <p className="page-subtitle">personalized financial advice & history</p>
            </div>
            <div className="insight-actions">
              <select 
                className="form-select" 
                style={{ width: 'auto', padding: '8px 12px', margin: 0 }}
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
              >
                {TIMEFRAMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <button 
                className="btn btn-primary" 
                onClick={generateInsight}
                disabled={generating}
              >
                {generating ? <div className="spinner" style={{width: 14, height: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff'}} /> : <Sparkles size={14} />}
                {generating ? 'analyzing...' : '[ generate new ]'}
              </button>
            </div>
          </div>

          {loading ? (
             <div className="loading-full"><div className="spinner" /></div>
          ) : history.length === 0 ? (
            <div className="empty-state" style={{ marginTop: '100px' }}>
              <div className="empty-state-icon"><Sparkles size={48} /></div>
              <h3 className="empty-state-title">No Insights Yet</h3>
              <p className="empty-state-text">Generate your first AI financial insight using the button above.</p>
            </div>
          ) : (
            <div className="insight-timeline">
              {history.map((insight) => (
                <div key={insight._id} className="insight-card">
                  <div className="insight-card-header">
                    <div className="insight-meta">
                      <Calendar size={14} className="text-muted" />
                      <span className="insight-date">{fmtDate(insight.createdAt)}</span>
                      <span className="badge badge-income" style={{ background: 'var(--color-surface-container)', color: 'var(--color-primary)' }}>
                        {TIMEFRAMES.find(t => t.value === insight.timeframe)?.label || insight.timeframe}
                      </span>
                    </div>
                  </div>
                  
                  {insight.transactionCount > 0 && (
                    <div className="insight-stats">
                      <div className="insight-stat">
                        <span className="insight-stat-label">Transactions</span>
                        <span className="insight-stat-value">{insight.transactionCount}</span>
                      </div>
                      <div className="insight-stat">
                        <span className="insight-stat-label">Income</span>
                        <span className="insight-stat-value amount-income">{fmt(insight.totalIncome || 0)}</span>
                      </div>
                      <div className="insight-stat">
                        <span className="insight-stat-label">Expenses</span>
                        <span className="insight-stat-value amount-expense">{fmt(insight.totalExpense || 0)}</span>
                      </div>
                    </div>
                  )}

                  <div className="insight-text">
                    {insight.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default InsightsPage;
