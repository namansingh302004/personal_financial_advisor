import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import './ActivityChart.css';

const fmt = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }} className="chart-tooltip-item">
            {p.name}: {fmt(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ActivityChart = ({ data = [] }) => {
  if (!data.length) {
    return (
      <div className="card activity-card">
        <span className="card-title">spending activity</span>
        <div className="empty-state">
          <div className="empty-state-icon">📈</div>
          <p className="empty-state-text">no data for chart yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card activity-card">
      <div className="flex items-center justify-between mb-4">
        <span className="card-title">spending activity — last 30 days</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#064e3b" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#064e3b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ba1a1a" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#ba1a1a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#dee9fd" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#707974', fontFamily: 'Outfit' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
            tick={{ fontSize: 10, fill: '#707974', fontFamily: 'Outfit' }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, fontFamily: 'Outfit', paddingTop: 12 }}
          />
          <Area
            type="monotone"
            dataKey="income"
            name="income"
            stroke="#064e3b"
            strokeWidth={1.8}
            fill="url(#colorIncome)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="expense"
            name="expense"
            stroke="#ba1a1a"
            strokeWidth={1.8}
            fill="url(#colorExpense)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ActivityChart;
