import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await register(name.trim(), email.trim(), password, adminSecret.trim());

    if (result.success) {
      setSuccessMessage(
        result.fallback
          ? 'Account created locally. You are being signed in now.'
          : 'Account created successfully. You are being signed in now.'
      );

      setTimeout(() => {
        if (adminSecret.trim() === 'admin777') {
          navigate('/admin');
        } else {
          navigate('/profile');
        }
      }, 500);
      return;
    }

    setError(result.message);
    setIsSubmitting(false);
  };

  return (
    <div className="auth-page" style={styles.container}>
      <div className="glass-panel auth-shell auth-shell-card" style={styles.shell}>
        <div className="auth-hero-side" style={styles.heroSide}>
          <div style={styles.heroBadge}>Create CineLuxe Account</div>
          <h1 style={styles.heroTitle}>Registration that actually gets you in</h1>
          <p style={styles.heroText}>
            Create an account, sign in immediately, and open your profile without extra steps.
          </p>

          <div style={styles.featureList}>
            <div style={styles.featureItem}>
              <CheckCircle2 size={18} color="var(--gold-primary)" />
              <span>Instant sign-in right after registration</span>
            </div>
            <div style={styles.featureItem}>
              <CheckCircle2 size={18} color="var(--gold-primary)" />
              <span>Works even if backend is temporarily unavailable</span>
            </div>
            <div style={styles.featureItem}>
              <CheckCircle2 size={18} color="var(--gold-primary)" />
              <span>Admin route opens automatically with the correct secret</span>
            </div>
          </div>
        </div>

        <div className="auth-form-side" style={styles.formSide}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Registration</h2>
            <p style={styles.formSubtitle}>Create your account and continue directly to your profile.</p>
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {successMessage && <div style={styles.success}>{successMessage}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Full name</label>
              <div style={styles.inputWrap}>
                <User size={18} style={styles.inputIcon} />
                <input
                  type="text"
                  required
                  className="input-field"
                  style={styles.inputWithIcon}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Email address</label>
              <div style={styles.inputWrap}>
                <Mail size={18} style={styles.inputIcon} />
                <input
                  type="email"
                  required
                  className="input-field"
                  style={styles.inputWithIcon}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div style={styles.inputWrap}>
                <Lock size={18} style={styles.inputIcon} />
                <input
                  type="password"
                  required
                  className="input-field"
                  style={styles.inputWithIcon}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Confirm password</label>
              <div style={styles.inputWrap}>
                <Lock size={18} style={styles.inputIcon} />
                <input
                  type="password"
                  required
                  className="input-field"
                  style={styles.inputWithIcon}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Admin secret (optional)</label>
              <div style={styles.inputWrap}>
                <ShieldCheck size={18} style={styles.inputIcon} />
                <input
                  type="password"
                  className="input-field"
                  style={styles.inputWithIcon}
                  value={adminSecret}
                  onChange={(event) => setAdminSecret(event.target.value)}
                  placeholder="Leave empty for a normal user account"
                />
              </div>
            </div>

            <button disabled={isSubmitting} type="submit" className="btn-primary" style={styles.submitButton}>
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p style={styles.footerText}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    backgroundImage:
      'linear-gradient(rgba(8, 8, 9, 0.84), rgba(8, 8, 9, 0.94)), url("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1470&auto=format&fit=crop")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  shell: {
    width: '100%',
    maxWidth: '1080px',
    display: 'grid',
    gridTemplateColumns: '1.05fr 0.95fr',
    overflow: 'hidden',
    borderRadius: '24px',
  },
  heroSide: {
    padding: '44px',
    background:
      'radial-gradient(circle at top left, rgba(212, 175, 55, 0.18), transparent 34%), linear-gradient(160deg, rgba(18, 18, 22, 0.98), rgba(11, 11, 14, 0.95))',
  },
  heroBadge: {
    display: 'inline-block',
    padding: '8px 14px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--gold-primary)',
    fontSize: '0.82rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '20px',
  },
  heroTitle: {
    fontSize: '2.7rem',
    lineHeight: 1.08,
    marginBottom: '16px',
  },
  heroText: {
    color: 'var(--text-muted)',
    lineHeight: 1.7,
    fontSize: '1rem',
    maxWidth: '430px',
  },
  featureList: {
    marginTop: '28px',
    display: 'grid',
    gap: '14px',
  },
  featureItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    padding: '16px 18px',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: 'var(--text-muted)',
  },
  formSide: {
    padding: '40px',
    background: 'rgba(18, 18, 22, 0.96)',
  },
  formHeader: {
    marginBottom: '26px',
  },
  formTitle: {
    fontSize: '2rem',
    marginBottom: '8px',
  },
  formSubtitle: {
    color: 'var(--text-muted)',
    lineHeight: 1.6,
  },
  inputWrap: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
  },
  inputWithIcon: {
    paddingLeft: '40px',
  },
  submitButton: {
    width: '100%',
    marginTop: '12px',
  },
  error: {
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    borderLeft: '4px solid var(--red-accent)',
    padding: '12px 15px',
    color: '#ffb4b4',
    marginBottom: '18px',
    fontSize: '0.9rem',
    borderRadius: '6px',
  },
  success: {
    backgroundColor: 'rgba(46, 204, 113, 0.12)',
    borderLeft: '4px solid #2ecc71',
    padding: '12px 15px',
    color: '#9df0b9',
    marginBottom: '18px',
    fontSize: '0.9rem',
    borderRadius: '6px',
  },
  footerText: {
    marginTop: '22px',
    color: 'var(--text-muted)',
    textAlign: 'center',
    fontSize: '0.95rem',
  },
};

export default Register;
