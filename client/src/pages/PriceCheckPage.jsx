import { useState } from 'react';
import { ShieldAlert, Search, ExternalLink, AlertTriangle, CheckCircle, HelpCircle, XCircle } from 'lucide-react';
import api from '../api/axiosInstance';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import './PriceCheckPage.css';

const VERDICT_CONFIG = {
  genuine: { label: 'Genuine Deal', icon: CheckCircle, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
  suspicious: { label: 'Suspicious', icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  fake_discount: { label: 'Fake Discount', icon: XCircle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  insufficient_data: { label: 'Insufficient Data', icon: HelpCircle, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' },
};

const PriceCheckPage = () => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const fmt = (n) => {
    if (n == null) return 'N/A';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  };

  const analyzeUrl = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const { data } = await api.post('/api/pricecheck', { url: url.trim() });
      setResult(data);
      setHistory((prev) => [data, ...prev].slice(0, 10));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to analyze product');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') analyzeUrl();
  };

  const verdict = result ? VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG.insufficient_data : null;
  const VerdictIcon = verdict?.icon;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page">
          <div className="pricecheck-header mb-4">
            <div>
              <h1 className="page-title">price check</h1>
              <p className="page-subtitle">detect fake discounts & dark patterns</p>
            </div>
          </div>

          {/* URL Input */}
          <div className="pricecheck-input-section card">
            <div className="pricecheck-input-wrapper">
              <ShieldAlert size={18} className="pricecheck-input-icon" />
              <input
                type="url"
                className="pricecheck-input"
                placeholder="Paste a product URL (Amazon, Flipkart, etc.)..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button
                className="btn btn-primary"
                onClick={analyzeUrl}
                disabled={!url.trim() || loading}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                    analyzing...
                  </>
                ) : (
                  <>
                    <Search size={14} />
                    [ analyze ]
                  </>
                )}
              </button>
            </div>
            <p className="pricecheck-hint">
              Works best with Amazon, Flipkart, Myntra, and other Indian e-commerce sites
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="pricecheck-loading card mt-4">
              <div className="pricecheck-loading-animation">
                <ShieldAlert size={32} className="pricecheck-shield-pulse" />
              </div>
              <p className="pricecheck-loading-text">Scanning product page for dark patterns...</p>
              <div className="pricecheck-loading-steps">
                <span className="pricecheck-step active">Fetching page data</span>
                <span className="pricecheck-step">Analyzing pricing</span>
                <span className="pricecheck-step">Detecting patterns</span>
              </div>
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <div className="pricecheck-result mt-4" style={{ animation: 'slideUp 0.4s ease' }}>
              {/* Verdict Card */}
              <div
                className="pricecheck-verdict card"
                style={{ borderLeft: `4px solid ${verdict.color}` }}
              >
                <div className="pricecheck-verdict-header">
                  <div className="pricecheck-verdict-badge" style={{ background: verdict.bg, color: verdict.color }}>
                    <VerdictIcon size={18} />
                    {verdict.label}
                  </div>
                  {result.confidenceLevel && (
                    <span className="pricecheck-confidence">
                      {result.confidenceLevel} confidence
                    </span>
                  )}
                </div>

                <h2 className="pricecheck-product-name">{result.productName}</h2>

                <div className="pricecheck-prices">
                  {result.currentPrice && (
                    <div className="pricecheck-price-item">
                      <span className="pricecheck-price-label">Current Price</span>
                      <span className="pricecheck-price-value">{fmt(result.currentPrice)}</span>
                    </div>
                  )}
                  {result.originalPrice && (
                    <div className="pricecheck-price-item">
                      <span className="pricecheck-price-label">Claimed Original</span>
                      <span className="pricecheck-price-value strikethrough">{fmt(result.originalPrice)}</span>
                    </div>
                  )}
                  {result.claimedDiscount && (
                    <div className="pricecheck-price-item">
                      <span className="pricecheck-price-label">Claimed Discount</span>
                      <span className="pricecheck-price-value">{result.claimedDiscount}</span>
                    </div>
                  )}
                  {result.realDiscount && (
                    <div className="pricecheck-price-item highlight">
                      <span className="pricecheck-price-label">Estimated Real Discount</span>
                      <span className="pricecheck-price-value">{result.realDiscount}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Analysis */}
              <div className="pricecheck-analysis card mt-4">
                <h3 className="card-title">analysis</h3>
                <p className="pricecheck-analysis-text">{result.analysis}</p>
              </div>

              {/* Dark Patterns */}
              {result.darkPatterns && result.darkPatterns.length > 0 && (
                <div className="pricecheck-patterns card mt-4">
                  <h3 className="card-title">dark patterns detected</h3>
                  <div className="pricecheck-patterns-list">
                    {result.darkPatterns.map((pattern, i) => (
                      <div key={i} className="pricecheck-pattern-item">
                        <AlertTriangle size={14} />
                        <span>{pattern}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              {result.tips && result.tips.length > 0 && (
                <div className="pricecheck-tips card mt-4">
                  <h3 className="card-title">consumer tips</h3>
                  <div className="pricecheck-tips-list">
                    {result.tips.map((tip, i) => (
                      <div key={i} className="pricecheck-tip-item">
                        <CheckCircle size={14} />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Source link */}
              <div className="pricecheck-source mt-2">
                <a href={result.url} target="_blank" rel="noopener noreferrer" className="pricecheck-source-link">
                  <ExternalLink size={12} />
                  {result.domain}
                </a>
                <span className="text-xs text-muted">
                  Checked at {new Date(result.checkedAt).toLocaleTimeString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 1 && !loading && (
            <div className="pricecheck-history card mt-4">
              <h3 className="card-title">recent checks</h3>
              <div className="pricecheck-history-list">
                {history.slice(1).map((item, i) => {
                  const v = VERDICT_CONFIG[item.verdict] || VERDICT_CONFIG.insufficient_data;
                  const VIcon = v.icon;
                  return (
                    <div key={i} className="pricecheck-history-item" onClick={() => setResult(item)}>
                      <VIcon size={14} style={{ color: v.color }} />
                      <span className="pricecheck-history-name">{item.productName}</span>
                      <span className="pricecheck-history-verdict" style={{ color: v.color }}>{v.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PriceCheckPage;
