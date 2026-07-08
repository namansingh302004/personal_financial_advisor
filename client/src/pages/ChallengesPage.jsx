import { useState, useEffect } from 'react';
import { Trophy, Flame, Target, Plus, Trash2, Award, Lock } from 'lucide-react';
import api from '../api/axiosInstance';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import './ChallengesPage.css';

const ChallengesPage = () => {
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [availableChallenges, setAvailableChallenges] = useState([]);
  const [streaks, setStreaks] = useState({ noSpend: 0, dailyLog: 0 });
  const [badges, setBadges] = useState([]);
  const [tab, setTab] = useState('active');
  const [loading, setLoading] = useState(true);

  const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

  const fetchData = async () => {
    try {
      const [challengeRes, availableRes, streakRes] = await Promise.all([
        api.get('/api/challenges'),
        api.get('/api/challenges/available'),
        api.get('/api/challenges/streaks'),
      ]);

      setActiveChallenges(challengeRes.data.filter((c) => c.status === 'active'));
      setAvailableChallenges(availableRes.data);
      setStreaks(streakRes.data.streaks);
      setBadges(streakRes.data.badges);

      // Collect all completed/failed challenges for badge display
      const completedChallenges = challengeRes.data.filter((c) => c.status === 'completed');
      // Already handled by streakRes.data.badges
    } catch {
      toast.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const joinChallenge = async (id) => {
    try {
      await api.post(`/api/challenges/join/${id}`);
      toast.success('Challenge joined! 🔥');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join challenge');
    }
  };

  const abandonChallenge = async (id) => {
    try {
      await api.delete(`/api/challenges/${id}`);
      toast.success('Challenge abandoned');
      fetchData();
    } catch {
      toast.error('Failed to abandon challenge');
    }
  };

  const getProgressPercent = (challenge) => {
    if (challenge.type === 'category_cap') {
      // Inverted: progress is amount spent, lower is better
      return challenge.target > 0
        ? Math.min(100, (challenge.progress / challenge.target) * 100)
        : 0;
    }
    return challenge.target > 0
      ? Math.min(100, (challenge.progress / challenge.target) * 100)
      : 0;
  };

  const getProgressLabel = (challenge) => {
    if (challenge.type === 'category_cap') {
      return `${fmt(challenge.progress)} / ${fmt(challenge.target)} limit`;
    }
    if (challenge.unit === '₹') {
      return `${fmt(challenge.progress)} / ${fmt(challenge.target)}`;
    }
    return `${challenge.progress} / ${challenge.target} ${challenge.unit}`;
  };

  const getDaysLeft = (endDate) => {
    const diff = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  // All possible badges for the badge collection
  const ALL_BADGES = [
    { name: 'Frugal Starter', icon: '🌱', color: '#10b981' },
    { name: 'Diamond Hands', icon: '💎', color: '#6366f1' },
    { name: 'Budget Shield', icon: '🛡️', color: '#0ea5e9' },
    { name: 'Chef Mode', icon: '👨‍🍳', color: '#f59e0b' },
    { name: 'Minimalist', icon: '✨', color: '#ec4899' },
    { name: 'Money Maker', icon: '💰', color: '#22c55e' },
    { name: 'Vault Master', icon: '🏦', color: '#8b5cf6' },
    { name: 'Consistent', icon: '📝', color: '#14b8a6' },
    { name: 'Legendary Logger', icon: '🏆', color: '#f97316' },
    { name: 'Zen Mode', icon: '🧘', color: '#a855f7' },
  ];

  const earnedBadgeNames = badges.map((b) => b.name);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page">
          <div className="challenges-header mb-4">
            <div>
              <h1 className="page-title">challenges</h1>
              <p className="page-subtitle">gamify your finances & earn badges</p>
            </div>
          </div>

          {loading ? (
            <div className="loading-full"><div className="spinner" /></div>
          ) : (
            <>
              {/* Streaks */}
              <div className="streaks-bar">
                <div className="streak-card">
                  <Flame size={20} className="streak-icon fire" />
                  <div className="streak-info">
                    <span className="streak-count">{streaks.noSpend}</span>
                    <span className="streak-label">no-spend day streak</span>
                  </div>
                </div>
                <div className="streak-card">
                  <Target size={20} className="streak-icon target" />
                  <div className="streak-info">
                    <span className="streak-count">{streaks.dailyLog}</span>
                    <span className="streak-label">daily log streak</span>
                  </div>
                </div>
                <div className="streak-card">
                  <Award size={20} className="streak-icon award" />
                  <div className="streak-info">
                    <span className="streak-count">{badges.length}</span>
                    <span className="streak-label">badges earned</span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="challenges-tabs">
                <button
                  className={`challenges-tab ${tab === 'active' ? 'active' : ''}`}
                  onClick={() => setTab('active')}
                >
                  active ({activeChallenges.length})
                </button>
                <button
                  className={`challenges-tab ${tab === 'available' ? 'active' : ''}`}
                  onClick={() => setTab('available')}
                >
                  available ({availableChallenges.length})
                </button>
                <button
                  className={`challenges-tab ${tab === 'badges' ? 'active' : ''}`}
                  onClick={() => setTab('badges')}
                >
                  badges ({badges.length}/{ALL_BADGES.length})
                </button>
              </div>

              {/* Active Challenges */}
              {tab === 'active' && (
                <div className="challenges-grid">
                  {activeChallenges.length === 0 ? (
                    <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                      <div className="empty-state-icon"><Trophy size={48} /></div>
                      <h3 className="empty-state-title">No Active Challenges</h3>
                      <p className="empty-state-text">Join a challenge to start earning badges!</p>
                      <button className="btn btn-primary mt-2" onClick={() => setTab('available')}>
                        Browse Challenges
                      </button>
                    </div>
                  ) : (
                    activeChallenges.map((challenge) => {
                      const percent = getProgressPercent(challenge);
                      const daysLeft = getDaysLeft(challenge.endDate);
                      const isOverBudget = challenge.type === 'category_cap' && challenge.progress > challenge.target;

                      return (
                        <div key={challenge._id} className="challenge-card">
                          <div className="challenge-card-header">
                            <span className="challenge-icon">{challenge.icon}</span>
                            <div className="challenge-meta">
                              <span className="challenge-days-left">{daysLeft}d left</span>
                              <button
                                className="btn-icon"
                                onClick={() => abandonChallenge(challenge._id)}
                                title="Abandon challenge"
                              >
                                <Trash2 size={14} className="text-muted" />
                              </button>
                            </div>
                          </div>
                          <h3 className="challenge-title">{challenge.title}</h3>
                          <p className="challenge-desc">{challenge.description}</p>
                          <div className="challenge-progress">
                            <div className="challenge-progress-header">
                              <span className="challenge-progress-label">{getProgressLabel(challenge)}</span>
                              <span className="challenge-progress-pct">{Math.round(percent)}%</span>
                            </div>
                            <div className="challenge-progress-bar">
                              <div
                                className={`challenge-progress-fill ${isOverBudget ? 'danger' : percent >= 100 ? 'complete' : ''}`}
                                style={{ width: `${Math.min(percent, 100)}%` }}
                              />
                            </div>
                          </div>
                          {challenge.badge && (
                            <div className="challenge-reward">
                              <span>Reward:</span>
                              <span className="challenge-badge-preview" style={{ background: challenge.badge.color + '20', color: challenge.badge.color }}>
                                {challenge.badge.icon} {challenge.badge.name}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Available Challenges */}
              {tab === 'available' && (
                <div className="challenges-grid">
                  {availableChallenges.length === 0 ? (
                    <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                      <div className="empty-state-icon"><Trophy size={48} /></div>
                      <h3 className="empty-state-title">All Joined!</h3>
                      <p className="empty-state-text">You've joined all available challenges. Complete them to earn badges!</p>
                    </div>
                  ) : (
                    availableChallenges.map((preset) => (
                      <div key={preset.id} className="challenge-card challenge-card-available">
                        <div className="challenge-card-header">
                          <span className="challenge-icon">{preset.icon}</span>
                          <span className="challenge-duration">{preset.duration} days</span>
                        </div>
                        <h3 className="challenge-title">{preset.title}</h3>
                        <p className="challenge-desc">{preset.description}</p>
                        <div className="challenge-target">
                          Target: {preset.unit === '₹' ? fmt(preset.target) : `${preset.target} ${preset.unit}`}
                        </div>
                        {preset.badge && (
                          <div className="challenge-reward">
                            <span>Reward:</span>
                            <span className="challenge-badge-preview" style={{ background: preset.badge.color + '20', color: preset.badge.color }}>
                              {preset.badge.icon} {preset.badge.name}
                            </span>
                          </div>
                        )}
                        <button
                          className="btn btn-primary w-full mt-2"
                          onClick={() => joinChallenge(preset.id)}
                        >
                          <Plus size={14} /> Join Challenge
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Badge Collection */}
              {tab === 'badges' && (
                <div className="badges-grid">
                  {ALL_BADGES.map((badge) => {
                    const earned = earnedBadgeNames.includes(badge.name);
                    const earnedData = badges.find((b) => b.name === badge.name);
                    return (
                      <div
                        key={badge.name}
                        className={`badge-card ${earned ? 'earned' : 'locked'}`}
                      >
                        <div
                          className="badge-icon-large"
                          style={earned ? { background: badge.color + '15', borderColor: badge.color + '40' } : {}}
                        >
                          {earned ? (
                            <span style={{ fontSize: 32 }}>{badge.icon}</span>
                          ) : (
                            <Lock size={24} className="badge-lock-icon" />
                          )}
                        </div>
                        <span className="badge-name" style={earned ? { color: badge.color } : {}}>
                          {badge.name}
                        </span>
                        {earned && earnedData && (
                          <span className="badge-earned-date">
                            {new Date(earnedData.earnedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ChallengesPage;
