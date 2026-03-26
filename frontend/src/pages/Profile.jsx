import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Camera,
  Crown,
  Film,
  ImageOff,
  LogOut,
  Mail,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProfileAvatar = ({ user, broken, onError }) => {
  if (user.avatarUrl && !broken) {
    return <img src={user.avatarUrl} alt={user.name} style={styles.avatarImage} onError={onError} />;
  }

  return (
    <div
      style={{
        ...styles.avatar,
        background:
          user.authProvider === 'google'
            ? 'linear-gradient(135deg, #4285F4, #34A853)'
            : 'linear-gradient(135deg, var(--gold-primary), #8a7322)',
      }}
    >
      {user.avatar || user.name.charAt(0).toUpperCase()}
    </div>
  );
};

const Profile = () => {
  const { user, logout, updateProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [saveMessage, setSaveMessage] = useState('');
  const [previewBroken, setPreviewBroken] = useState(false);
  const [profileBroken, setProfileBroken] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success')) {
      alert('Subscription successful! You are now a premium member.');
    }
  }, [location]);

  useEffect(() => {
    setAvatarUrl(user?.avatarUrl || '');
    setPreviewBroken(false);
    setProfileBroken(false);
  }, [user]);

  const previewUrl = useMemo(() => {
    const trimmed = avatarUrl.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('//')) return `https:${trimmed}`;
    return `https://${trimmed}`;
  }, [avatarUrl]);

  if (!user) return <div style={styles.emptyState}>Please login to view profile.</div>;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSavePhoto = () => {
    if (!avatarUrl.trim()) {
      updateProfile({ avatarUrl: '' });
      setSaveMessage('Profile photo removed.');
      setPreviewBroken(false);
      setProfileBroken(false);
      setTimeout(() => setSaveMessage(''), 1800);
      return;
    }

    updateProfile({ avatarUrl });
    setSaveMessage('Profile photo updated.');
    setProfileBroken(false);
    setTimeout(() => setSaveMessage(''), 1800);
  };

  const providerLabel = user.authProvider === 'google' ? 'Google Account' : 'Email Account';
  const providerAccent = user.authProvider === 'google' ? '#4285F4' : 'var(--gold-primary)';

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroLeft}>
          <div style={styles.providerPill(providerAccent)}>
            {user.authProvider === 'google' ? 'Signed in with Google' : 'Signed in with Email'}
          </div>
          <h1 style={styles.heroTitle}>Your profile is ready</h1>
          <p style={styles.heroText}>
            Your account information, membership status, and profile photo are all managed here.
          </p>
        </div>

        <div className="glass-panel" style={styles.accountCard}>
          <div style={styles.accountTop}>
            <ProfileAvatar user={user} broken={profileBroken} onError={() => setProfileBroken(true)} />
            <div>
              <div style={styles.accountName}>{user.name}</div>
              <div style={styles.accountEmail}>{user.email}</div>
            </div>
          </div>

          <div style={styles.profileMeta}>
            <div style={styles.metaRow}>
              <span style={styles.metaLabel}>Provider</span>
              <span style={styles.metaValue}>{providerLabel}</span>
            </div>
            <div style={styles.metaRow}>
              <span style={styles.metaLabel}>Role</span>
              <span style={styles.metaValue}>{user.role === 'admin' ? 'Administrator' : 'Viewer'}</span>
            </div>
            <div style={styles.metaRow}>
              <span style={styles.metaLabel}>Plan</span>
              <span style={styles.metaValue}>
                {user.isPremium || user.role === 'admin' ? 'Premium Active' : 'Basic'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="profile-grid" style={styles.grid}>
        <article className="glass-panel" style={styles.panel}>
          <div style={styles.panelHeader}>
            <UserCircle2 size={18} color="var(--gold-primary)" />
            <h2 style={styles.panelTitle}>Account summary</h2>
          </div>

          <div style={styles.summaryList}>
            <div style={styles.summaryItem}>
              <Mail size={16} color="var(--text-muted)" />
              <span>{user.email}</span>
            </div>
            <div style={styles.summaryItem}>
              <ShieldCheck size={16} color="var(--text-muted)" />
              <span>{providerLabel}</span>
            </div>
            <div style={styles.summaryItem}>
              <Crown size={16} color="var(--text-muted)" />
              <span>{user.role === 'admin' ? 'Admin access enabled' : 'Standard member access'}</span>
            </div>
          </div>
        </article>

        <article className="glass-panel" style={styles.panel}>
          <div style={styles.panelHeader}>
            <Camera size={18} color="var(--gold-primary)" />
            <h2 style={styles.panelTitle}>Profile photo</h2>
          </div>

          <div style={styles.photoEditor}>
            <div style={styles.photoHint}>
              Paste a direct image link like `https://site.com/photo.jpg`. If the image cannot open, the profile will
              keep the letter avatar.
            </div>
            <input
              type="text"
              className="input-field"
              placeholder="https://example.com/photo.jpg"
              value={avatarUrl}
              onChange={(event) => {
                setAvatarUrl(event.target.value);
                setPreviewBroken(false);
              }}
            />

            <div style={styles.previewCard}>
              <div style={styles.previewLabel}>Preview</div>
              {previewUrl && !previewBroken ? (
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  style={styles.previewImage}
                  onError={() => setPreviewBroken(true)}
                />
              ) : (
                <div style={styles.previewFallback}>
                  <ImageOff size={18} color="var(--text-muted)" />
                  <span>
                    {previewUrl ? 'This link does not open as an image.' : 'Paste an image URL to preview it here.'}
                  </span>
                </div>
              )}
            </div>

            <div style={styles.photoActions}>
              <button className="btn-primary" onClick={handleSavePhoto}>
                Save photo
              </button>
              <button
                className="btn-outline"
                onClick={() => {
                  setAvatarUrl('');
                  updateProfile({ avatarUrl: '' });
                  setSaveMessage('Profile photo removed.');
                  setPreviewBroken(false);
                  setProfileBroken(false);
                  setTimeout(() => setSaveMessage(''), 1800);
                }}
              >
                Remove
              </button>
            </div>
            {saveMessage && <div style={styles.saveMessage}>{saveMessage}</div>}
          </div>
        </article>

        <article className="glass-panel" style={styles.panel}>
          <div style={styles.panelHeader}>
            <Sparkles size={18} color="var(--gold-primary)" />
            <h2 style={styles.panelTitle}>Membership</h2>
          </div>

          <div style={styles.membershipCard}>
            <div style={styles.membershipValue}>
              {user.isPremium || user.role === 'admin' ? 'Premium Active' : 'Basic Plan'}
            </div>
            <div style={styles.membershipText}>
              {user.isPremium || user.role === 'admin'
                ? 'You have access to premium profile features and full content details.'
                : 'Upgrade to premium to unlock the full experience.'}
            </div>
            {!user.isPremium && user.role !== 'admin' && (
              <Link to="/subscription" className="btn-primary" style={styles.actionButton}>
                Upgrade to Premium
              </Link>
            )}
          </div>
        </article>
      </section>

      <section className="glass-panel" style={styles.actionsPanel}>
        <div style={styles.panelHeader}>
          <Settings size={18} color="var(--gold-primary)" />
          <h2 style={styles.panelTitle}>Quick links</h2>
        </div>

        <div style={styles.quickGrid}>
          <Link to="/movies" style={styles.quickLink}>
            Browse catalog
          </Link>
          <Link to="/login" style={styles.quickLink}>
            Switch account
          </Link>
          {user.role === 'admin' && (
            <Link to="/admin" style={styles.quickLink}>
              Open admin panel
            </Link>
          )}
          <button onClick={handleLogout} className="btn-outline" style={styles.logoutButton}>
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </section>
    </div>
  );
};

const styles = {
  page: {
    maxWidth: '1240px',
    margin: '0 auto',
    padding: '32px 24px 56px',
  },
  emptyState: {
    minHeight: '70vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.8fr',
    gap: '22px',
    marginBottom: '24px',
  },
  heroLeft: {
    padding: '38px',
    borderRadius: '24px',
    background:
      'radial-gradient(circle at top left, rgba(212, 175, 55, 0.16), transparent 36%), linear-gradient(160deg, rgba(18, 18, 22, 0.98), rgba(11, 11, 14, 0.95))',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  providerPill: (accent) => ({
    display: 'inline-block',
    padding: '8px 14px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.05)',
    color: accent,
    fontSize: '0.82rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '20px',
  }),
  heroTitle: {
    fontSize: '2.8rem',
    lineHeight: 1.08,
    marginBottom: '14px',
  },
  heroText: {
    color: 'var(--text-muted)',
    lineHeight: 1.7,
    maxWidth: '560px',
  },
  accountCard: {
    padding: '28px',
  },
  accountTop: {
    display: 'flex',
    gap: '14px',
    alignItems: 'center',
    marginBottom: '22px',
  },
  avatar: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '1.8rem',
    fontWeight: 700,
    flexShrink: 0,
  },
  avatarImage: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    objectFit: 'cover',
    flexShrink: 0,
    border: '2px solid rgba(255,255,255,0.12)',
  },
  accountName: {
    fontSize: '1.35rem',
    fontWeight: 700,
    marginBottom: '6px',
  },
  accountEmail: {
    color: 'var(--text-muted)',
  },
  profileMeta: {
    display: 'grid',
    gap: '12px',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  metaLabel: {
    color: 'var(--text-muted)',
  },
  metaValue: {
    fontWeight: 600,
    textAlign: 'right',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '18px',
    marginBottom: '24px',
  },
  panel: {
    padding: '24px',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '18px',
  },
  panelTitle: {
    fontSize: '1.25rem',
  },
  summaryList: {
    display: 'grid',
    gap: '14px',
  },
  summaryItem: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    color: 'var(--text-main)',
    lineHeight: 1.5,
  },
  photoEditor: {
    display: 'grid',
    gap: '12px',
  },
  photoHint: {
    color: 'var(--text-muted)',
    lineHeight: 1.6,
    fontSize: '0.92rem',
  },
  previewCard: {
    padding: '14px',
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  previewLabel: {
    color: 'var(--text-muted)',
    fontSize: '0.82rem',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  previewImage: {
    width: '100%',
    maxWidth: '180px',
    aspectRatio: '1 / 1',
    objectFit: 'cover',
    borderRadius: '18px',
    display: 'block',
  },
  previewFallback: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  },
  photoActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  saveMessage: {
    color: '#9de6a2',
    fontSize: '0.9rem',
  },
  membershipCard: {
    padding: '18px',
    borderRadius: '18px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  membershipValue: {
    fontSize: '1.25rem',
    fontWeight: 700,
    marginBottom: '8px',
  },
  membershipText: {
    color: 'var(--text-muted)',
    lineHeight: 1.6,
    marginBottom: '16px',
  },
  actionButton: {
    display: 'inline-block',
  },
  actionsPanel: {
    padding: '24px',
  },
  quickGrid: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  quickLink: {
    padding: '13px 14px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: 'var(--text-main)',
  },
  logoutButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
};

export default Profile;
