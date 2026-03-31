import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, LogIn, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleStandardLogin = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(email, password);
    if (result.success) {
      navigate('/profile');
      return;
    }

    setError(result.message);
    setIsSubmitting(false);
  };

  const handleGoogleContinue = async () => {
    setError('');
    setIsSubmitting(true);

    const result = await googleLogin();
    if (result.success) {
      navigate('/profile');
      return;
    }

    setError(result.message);
    setIsSubmitting(false);
  };

  return (
    <div className="auth-page" style={styles.container}>
      <div className="glass-panel auth-shell auth-shell-card" style={styles.shell}>
        <div className="auth-hero-side" style={styles.heroSide}>
          <div style={styles.heroBadge}>Аккаунт CineLuxe</div>
          <h1 style={styles.heroTitle}>Вход в аккаунт</h1>
          <p style={styles.heroText}>Войдите по почте или через Google и сразу перейдите в профиль.</p>
        </div>

        <div className="auth-form-side" style={styles.formSide}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Войти</h2>
            <p style={styles.formSubtitle}>Введите email и пароль или используйте Google.</p>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleStandardLogin}>
            <div className="input-group">
              <label>Email</label>
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
              <label>Пароль</label>
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

            <button disabled={isSubmitting} type="submit" className="btn-primary" style={styles.submitButton}>
              <LogIn size={18} />
              Войти
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerText}>или</span>
          </div>

          <button type="button" onClick={handleGoogleContinue} style={styles.googleButton} disabled={isSubmitting}>
            <GoogleMark />
            Войти через Google
          </button>

          <p style={styles.footerText}>
            Нет аккаунта? <Link to="/register">Регистрация</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const GoogleMark = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M22.56 12.25C22.56 11.47 22.49 10.74 22.37 10.03H12V14.23H17.92C17.66 15.61 16.88 16.78 15.71 17.57V20.33H19.27C21.35 18.42 22.56 15.59 22.56 12.25Z"
      fill="#4285F4"
    />
    <path
      d="M12 23C14.97 23 17.46 22.01 19.27 20.33L15.71 17.57C14.73 18.23 13.48 18.63 12 18.63C9.12 18.63 6.69 16.68 5.8 14.07H2.13V16.93C3.96 20.57 7.7 23 12 23Z"
      fill="#34A853"
    />
    <path
      d="M5.8 14.07C5.57 13.38 5.44 12.65 5.44 11.89C5.44 11.13 5.57 10.4 5.8 9.71V6.85H2.13C1.37 8.35 0.94 10.07 0.94 11.89C0.94 13.71 1.37 15.43 2.13 16.93L5.8 14.07Z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38C13.62 5.38 15.07 5.94 16.22 7.03L19.34 3.9C17.46 2.15 14.97 1.12 12 1.12C7.7 1.12 3.96 3.55 2.13 6.85L5.8 9.71C6.69 7.1 9.12 5.38 12 5.38Z"
      fill="#EA4335"
    />
  </svg>
);

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
    maxWidth: '940px',
    display: 'grid',
    gridTemplateColumns: '0.85fr 1.15fr',
    overflow: 'hidden',
    borderRadius: '24px',
  },
  heroSide: {
    padding: '34px',
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
    fontSize: '2.3rem',
    lineHeight: 1.08,
    marginBottom: '14px',
  },
  heroText: {
    color: 'var(--text-muted)',
    lineHeight: 1.7,
    fontSize: '1rem',
    maxWidth: '320px',
  },
  formSide: {
    padding: '34px',
    background: 'rgba(18, 18, 22, 0.96)',
  },
  formHeader: {
    marginBottom: '24px',
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '12px',
  },
  divider: {
    margin: '24px 0 18px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    position: 'relative',
  },
  dividerText: {
    position: 'absolute',
    left: '50%',
    top: 0,
    transform: 'translate(-50%, -50%)',
    padding: '0 10px',
    background: 'rgba(18, 18, 22, 0.96)',
    color: 'var(--text-muted)',
    fontSize: '0.84rem',
  },
  googleButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '13px',
    background: '#fff',
    color: '#202124',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 600,
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
  footerText: {
    marginTop: '22px',
    color: 'var(--text-muted)',
    textAlign: 'center',
    fontSize: '0.95rem',
  },
};

export default Login;
