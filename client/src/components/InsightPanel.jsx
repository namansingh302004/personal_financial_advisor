import { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';
import './InsightPanel.css';

const TIMEFRAMES = [
  { value: 'week', label: 'this week' },
  { value: 'month', label: 'this month' },
  { value: '3months', label: 'last 3 months' },
  { value: 'year', label: 'this year' },
];

const InsightPanel = () => {
  const [timeframe, setTimeframe] = useState('month');
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/ai/insights', { timeframe });
      setInsights(data.insights);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate insights';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card insight-panel">
      <div className="flex items-center justify-between mb-4">
        <span className="card-title">ai insights</span>
        <Sparkles size={14} className="insight-sparkle" />
      </div>

      {/* Timeframe selector */}
      <div className="insight-timeframes">
        {TIMEFRAMES.map(({ value, label }) => (
          <button
            key={value}
            className={`insight-tf-btn ${timeframe === value ? 'insight-tf-btn--active' : ''}`}
            onClick={() => setTimeframe(value)}
          >
            [{label}]
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="insight-loading">
          <div className="spinner" />
          <span className="text-xs text-muted">analyzing your finances...</span>
        </div>
      ) : insights ? (
        <div className="insight-content">
          <p>{insights}</p>
          <button className="btn btn-ghost btn-sm mt-4" onClick={fetchInsights}>
            <RefreshCw size={12} />
            refresh insights
          </button>
        </div>
      ) : (
        <div className="insight-empty">
          <p className="text-sm text-muted">
            Let Gemini AI analyze your spending and give you personalized financial advice.
          </p>
          <button className="btn btn-primary btn-sm mt-4" onClick={fetchInsights}>
            <Sparkles size={13} />
            [ generate insights ]
          </button>
        </div>
      )}
    </div>
  );
};

export default InsightPanel;
