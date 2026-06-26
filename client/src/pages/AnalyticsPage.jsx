import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip as PieTooltip,
} from 'recharts';
import api from '../api/axiosInstance';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import './AnalyticsPage.css';

const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const CATEGORY_COLORS = [
  '#064e3b', '#0b6e52', '#1a7a5e', '#2d8c71', '#4da08e',
  '#6bb5a9', '#8dc7c2', '#ba1a1a', '#d64545', '#f07070',
];

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.fill }} className="chart-tooltip-item">
            {p.name}: {fmt(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const TIMEFRAME_OPTS = [
  { label: 'this month', value: 'month' },
  { label: 'last 3 months', value: '3months' },
  { label: 'this year', value: 'year' },
];

const AnalyticsPage = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState({ categories: [], totalExpense: 0 });
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      const [monthlyRes, catRes] = await Promise.all([
        api.get(`/api/analytics/monthly?year=${year}`),
        api.get(`/api/analytics/categories?startDate=${monthStart}`),
      ]);
      setMonthlyData(monthlyRes.data);
      setCategoryData(catRes.data);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, [year]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page">
          <div className="analytics-header">
            <div>
              <h1 className="page-title">analytics</h1>
              <p className="page-subtitle">understand your spending patterns</p>
            </div>
            <div className="year-selector">
              <button className="btn btn-ghost btn-sm" onClick={() => setYear(y => y - 1)}>←</button>
              <span className="year-label">{year}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setYear(y => y + 1)} disabled={year >= new Date().getFullYear()}>→</button>
            </div>
          </div>

          {loading ? (
            <div className="loading-full"><div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
          ) : (
            <>
              {/* Monthly bar chart */}
              <div className="card analytics-card">
                <span className="card-title">monthly income vs expenses — {year}</span>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dee9fd" vertical={false} />
                    <XAxis dataKey="monthName" tick={{ fontSize: 11, fill: '#707974', fontFamily: 'Outfit' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                      tick={{ fontSize: 11, fill: '#707974', fontFamily: 'Outfit' }}
                      axisLine={false} tickLine={false} width={52}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Outfit', paddingTop: 12 }} />
                    <Bar dataKey="income" name="income" fill="#064e3b" radius={[3, 3, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="expense" name="expense" fill="#ba1a1a" radius={[3, 3, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category breakdown */}
              <div className="analytics-row">
                <div className="card analytics-card" style={{ flex: 1 }}>
                  <span className="card-title">spending by category — this month</span>
                  {categoryData.categories.length === 0 ? (
                    <div className="empty-state"><p className="empty-state-text">no expense data this month</p></div>
                  ) : (
                    <div className="category-layout">
                      <ResponsiveContainer width={200} height={200}>
                        <PieChart>
                          <Pie
                            data={categoryData.categories}
                            dataKey="total"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={88}
                            paddingAngle={2}
                          >
                            {categoryData.categories.map((_, i) => (
                              <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                            ))}
                          </Pie>
                          <PieTooltip formatter={(v) => fmt(v)} contentStyle={{ fontFamily: 'Outfit', fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="category-legend">
                        {categoryData.categories.map((cat, i) => (
                          <div key={cat.category} className="category-legend-item">
                            <span
                              className="category-legend-dot"
                              style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                            />
                            <span className="category-name">{cat.category}</span>
                            <span className="category-pct">{cat.percentage}%</span>
                            <span className="category-amt">{fmt(cat.total)}</span>
                          </div>
                        ))}
                        <div className="category-total">
                          total expense: <strong>{fmt(categoryData.totalExpense)}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AnalyticsPage;
