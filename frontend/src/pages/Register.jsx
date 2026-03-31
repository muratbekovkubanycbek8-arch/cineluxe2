import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldCheck, User } from 'lucide-react';
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
      setError('Пароль должен содержать минимум 4 символа.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают.');
      return;
    }

    setIsSubmitting(true);
    const result = await register(name.trim(), email.trim(), password, adminSecret.trim());

    if (result.success) {
      setSuccessMessage('Аккаунт создан. Выполняется вход...');

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
          <div style={styles.heroBadge}>Регистрация</div>
          <h1 style={styles.heroTitle}>Создайте аккаунт CineLuxe</h1>
          <p style={styles.heroText}>
            Простая регистрация без лишних блоков. После создания аккаунта вы сразу попадете в профиль.
          </p>
        </div>

        <div className="auth-form-side" style={styles.formSide}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Новый аккаунт</h2>
            <p style={styles.formSubtitle}>Заполните поля ниже и продолжайте просмотр.</p>
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {successMessage && <div style={styles.success}>{successMessage}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Имя</label>
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

            <div className="input-group">
              <label>Подтвердите пароль</label>
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
              <label>Секрет администратора</label>
              <div style={styles.inputWrap}>
                <ShieldCheck size={18} style={styles.inputIcon} />
                <input
                  type="password"
                  className="input-field"
                  style={styles.inputWithIcon}
                  value={adminSecret}
                  onChange={(event) => setAdminSecret(event.target.value)}
                  placeholder="Необязательно"
                />
              </div>
            </div>

            <button disabled={isSubmitting} type="submit" className="btn-primary" style={styles.submitButton}>
              {isSubmitting ? 'Создание...' : 'Создать аккаунт'}
            </button>
          </form>

          <p style={styles.footerText}>
            Уже есть аккаунт? <Link to="/login">Войти</Link>
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
    maxWidth: '940px',
    display: 'grid',
    gridTemplateColumns: '0.85fr 1.15fr',
    overflow: 'hidden',
    borderRadius: '24px',
  },
  heroSide: {
    padding: '36px',
    background:
      'radial-gradient(circle at top left, rgba(212, 175, 55, 0.14), transparent 34%), linear-gradient(160deg, rgba(18, 18, 22, 0.98), rgba(11, 11, 14, 0.95))',
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
    fontSize: '2.25rem',
    lineHeight: 1.08,
    marginBottom: '14px',
  },
  heroText: {
    color: 'var(--text-muted)',
    lineHeight: 1.7,
    fontSize: '0.98rem',
    maxWidth: '360px',
  },
  formSide: {
    padding: '36px',
    background: 'rgba(18, 18, 22, 0.96)',
  },
  formHeader: {
    marginBottom: '24px',
  },
  formTitle: {
    fontSize: '1.95rem',
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
