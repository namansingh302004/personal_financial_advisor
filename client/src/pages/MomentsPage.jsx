import { useState, useEffect, useRef } from 'react';
import { Camera, Download, ChevronLeft, ChevronRight, Sparkles, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import api from '../api/axiosInstance';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import './MomentsPage.css';

const MomentsPage = () => {
  const [todayData, setTodayData] = useState(null);
  const [weekData, setWeekData] = useState([]);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(true);
  const [captionLoading, setCaptionLoading] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const cardRef = useRef(null);

  const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

  const fetchData = async () => {
    try {
      const [todayRes, weekRes] = await Promise.all([
        api.get('/api/moments/today'),
        api.get('/api/moments/week'),
      ]);
      setTodayData(todayRes.data);
      setWeekData(weekRes.data);

      // Auto-generate caption
      setCaptionLoading(true);
      try {
        const { data } = await api.post('/api/moments/caption', {
          totalSpent: todayRes.data.totalSpent,
          topCategory: todayRes.data.topCategory?.name,
          biggestExpense: todayRes.data.biggestExpense?.note,
          transactionCount: todayRes.data.transactionCount,
          monthBudget: todayRes.data.monthBudget,
          monthSpent: todayRes.data.monthSpent,
        });
        setCaption(data.caption);
      } catch {
        setCaption('✨ Another day, another dollar tracked!');
      } finally {
        setCaptionLoading(false);
      }
    } catch {
      toast.error('Failed to load moments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const downloadCard = async () => {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `finwise-moment-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Card downloaded!');
    } catch {
      toast.error('Failed to download card');
    }
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const budgetPercent = todayData?.monthBudget > 0
    ? Math.min(100, ((todayData?.monthSpent || 0) / todayData.monthBudget) * 100)
    : 0;

  const categoryEntries = todayData?.categoryBreakdown
    ? Object.entries(todayData.categoryBreakdown).sort(([, a], [, b]) => b - a)
    : [];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page">
          <div className="moments-header mb-4">
            <div>
              <h1 className="page-title">money moments</h1>
              <p className="page-subtitle">your daily financial story</p>
            </div>
            <button className="btn btn-primary" onClick={downloadCard} disabled={loading}>
              <Download size={14} />
              [ download card ]
            </button>
          </div>

          {loading ? (
            <div className="loading-full"><div className="spinner" /></div>
          ) : (
            <>
              {/* Main Story Card */}
              <div className="moment-card-wrapper">
                <div className="moment-card" ref={cardRef}>
                  <div className="moment-card-bg" />
                  <div className="moment-card-content">
                    <div className="moment-card-top">
                      <div className="moment-brand">
                        <span className="moment-brand-logo">finwise</span>
                        <span className="moment-brand-tag">money moment</span>
                      </div>
                      <span className="moment-date">{dateStr}</span>
                    </div>

                    <div className="moment-card-avatar">
                      {todayData?.userName?.charAt(0).toUpperCase() || '?'}
                    </div>

                    <div className="moment-card-stats">
                      <div className="moment-stat moment-stat-primary">
                        <TrendingDown size={18} />
                        <div>
                          <span className="moment-stat-value">{fmt(todayData?.totalSpent)}</span>
                          <span className="moment-stat-label">spent today</span>
                        </div>
                      </div>

                      {todayData?.totalEarned > 0 && (
                        <div className="moment-stat moment-stat-income">
                          <TrendingUp size={18} />
                          <div>
                            <span className="moment-stat-value">{fmt(todayData.totalEarned)}</span>
                            <span className="moment-stat-label">earned today</span>
                          </div>
                        </div>
                      )}

                      <div className="moment-stat">
                        <Wallet size={18} />
                        <div>
                          <span className="moment-stat-value">{todayData?.transactionCount || 0}</span>
                          <span className="moment-stat-label">transactions</span>
                        </div>
                      </div>
                    </div>

                    {todayData?.biggestExpense && (
                      <div className="moment-biggest">
                        💸 Biggest: {todayData.biggestExpense.note} — {fmt(todayData.biggestExpense.amount)}
                      </div>
                    )}

                    {todayData?.monthBudget > 0 && (
                      <div className="moment-budget">
                        <div className="moment-budget-header">
                          <span>monthly budget</span>
                          <span>{fmt(todayData.monthSpent)} / {fmt(todayData.monthBudget)}</span>
                        </div>
                        <div className="moment-budget-bar">
                          <div
                            className={`moment-budget-fill ${budgetPercent > 80 ? 'danger' : budgetPercent > 50 ? 'warning' : ''}`}
                            style={{ width: `${budgetPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="moment-caption">
                      {captionLoading ? (
                        <span className="moment-caption-loading">
                          <Sparkles size={14} className="spin-slow" />
                          generating caption...
                        </span>
                      ) : (
                        <p>{caption}</p>
                      )}
                    </div>

                    <div className="moment-card-footer">
                      <span>finwise — your money, simplified.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              {categoryEntries.length > 0 && (
                <div className="moment-categories card mt-4">
                  <h3 className="card-title">today's spending breakdown</h3>
                  <div className="moment-cat-list">
                    {categoryEntries.map(([cat, amount]) => {
                      const percent = todayData.totalSpent > 0 ? (amount / todayData.totalSpent) * 100 : 0;
                      return (
                        <div key={cat} className="moment-cat-item">
                          <div className="moment-cat-info">
                            <span className="moment-cat-name">{cat}</span>
                            <span className="moment-cat-amount">{fmt(amount)}</span>
                          </div>
                          <div className="moment-cat-bar">
                            <div className="moment-cat-fill" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Week History */}
              <div className="moment-week card mt-4">
                <h3 className="card-title">last 7 days</h3>
                <div className="moment-week-grid">
                  {weekData.map((day, i) => {
                    const dayDate = new Date(day.date);
                    const isToday = dayDate.toDateString() === today.toDateString();
                    return (
                      <div
                        key={i}
                        className={`moment-week-day ${isToday ? 'today' : ''} ${day.totalSpent === 0 ? 'no-spend' : ''}`}
                      >
                        <span className="moment-week-day-name">
                          {dayDate.toLocaleDateString('en-IN', { weekday: 'short' })}
                        </span>
                        <span className="moment-week-day-amount">{fmt(day.totalSpent)}</span>
                        <span className="moment-week-day-count">{day.transactionCount} txn</span>
                        {day.totalSpent === 0 && <span className="moment-week-badge">🔥</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default MomentsPage;
