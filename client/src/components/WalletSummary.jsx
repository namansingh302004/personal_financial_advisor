import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './WalletSummary.css';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const WalletSummary = ({ summary }) => {
  const { user } = useAuth();

  const budgetUsed = user?.monthlyBudget > 0
    ? Math.min(100, Math.round((summary?.monthlyExpense / user.monthlyBudget) * 100))
    : 0;

  const cards = [
    {
      label: 'wallet balance',
      value: fmt(user?.walletBalance),
      icon: Wallet,
      sub: 'current balance',
      colorClass: 'card-neutral',
    },
    {
      label: 'monthly budget',
      value: fmt(user?.monthlyBudget),
      icon: TrendingDown,
      sub: `${budgetUsed}% used this month`,
      colorClass: 'card-neutral',
      progress: budgetUsed,
    },
    {
      label: 'monthly income',
      value: fmt(summary?.monthlyIncome),
      icon: TrendingUp,
      sub: `${summary?.monthlyTransactions || 0} transactions`,
      colorClass: 'card-income',
    },
    {
      label: 'savings this month',
      value: fmt(summary?.monthlySavings),
      icon: PiggyBank,
      sub: summary?.monthlySavings >= 0 ? 'on track ✓' : 'over budget',
      colorClass: summary?.monthlySavings >= 0 ? 'card-income' : 'card-expense',
    },
  ];

  return (
    <div className="wallet-summary">
      {cards.map(({ label, value, icon: Icon, sub, colorClass, progress }) => (
        <div key={label} className={`metric-card card ${colorClass}`}>
          <div className="metric-header">
            <span className="card-title">{label}</span>
            <div className="metric-icon">
              <Icon size={14} strokeWidth={2} />
            </div>
          </div>
          <div className="metric-value">{value}</div>
          <div className="metric-sub">{sub}</div>
          {progress !== undefined && (
            <div className="metric-progress">
              <div
                className="metric-progress-bar"
                style={{ width: `${progress}%`, background: progress > 90 ? 'var(--color-expense)' : 'var(--color-primary)' }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default WalletSummary;
