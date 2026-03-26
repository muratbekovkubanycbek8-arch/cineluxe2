import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Mail,
  ShieldCheck,
  Smartphone,
  Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const maskEmail = (email) => {
  if (!email) return 'gmail.com';
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
};

const Subscription = () => {
  const { user, upgradeToPremium } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('plan');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvc: '' });

  const deliveryAddress = user?.email || 'example@gmail.com';
  const maskedEmail = useMemo(() => maskEmail(deliveryAddress), [deliveryAddress]);

  const startPayment = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setStep('payment');
  };

  const handlePaymentSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    setPaymentStatus('Проверяем платеж и подготавливаем код подтверждения...');

    window.setTimeout(() => {
      const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
      setVerificationCode(generatedCode);
      setEnteredCode('');
      setCodeError('');
      setPaymentStatus(`Код подтверждения отправлен на ${maskedEmail}`);
      setLoading(false);
      setStep('verify');
    }, 1600);
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    setCodeError('');

    if (enteredCode.trim() !== verificationCode) {
      setCodeError('Неверный код. Введите код из письма Gmail.');
      return;
    }

    setLoading(true);
    setPaymentStatus('Подписка активируется...');

    window.setTimeout(async () => {
      await upgradeToPremium();
      setLoading(false);
      setStep('success');
      window.setTimeout(() => navigate('/movies'), 1600);
    }, 1400);
  };

  const handleResendCode = () => {
    const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
    setVerificationCode(generatedCode);
    setEnteredCode('');
    setCodeError('');
    setPaymentStatus(`Новый код отправлен на ${maskedEmail}`);
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroTextWrap}>
          <div style={styles.kicker}>Подписка CineLuxe</div>
          <h1 style={styles.title}>Оформите подписку и откройте полный каталог</h1>
          <p style={styles.subtitle}>
            После оплаты на Gmail придет код подтверждения. Введите его на телефоне, и подписка активируется сразу.
          </p>
        </div>
        <div className="glass-panel" style={styles.heroCard}>
          <div style={styles.heroCardTitle}>Что откроется после подписки</div>
          <div style={styles.heroBenefit}><Star size={16} color="var(--gold-primary)" /> Полный каталог фильмов и аниме</div>
          <div style={styles.heroBenefit}><Star size={16} color="var(--gold-primary)" /> Доступ к карточкам и сериям</div>
          <div style={styles.heroBenefit}><Star size={16} color="var(--gold-primary)" /> Подтверждение через Gmail-код</div>
        </div>
      </section>

      {step === 'plan' && (
        <section className="subscription-grid" style={styles.planGrid}>
          <div className="glass-panel" style={styles.planCard}>
            <div style={styles.planLabel}>Текущий план</div>
            <h2 style={styles.planTitle}>Базовый</h2>
            <div style={styles.planPrice}>0 ₽</div>
            <div style={styles.featureList}>
              <div style={styles.featureItem}>Просмотр страницы профиля</div>
              <div style={styles.featureItem}>Регистрация и вход</div>
              <div style={styles.featureItem}>Каталог и фильмы закрыты</div>
            </div>
            <button className="btn-outline" style={styles.fullWidthButton} disabled>
              Недоступно для просмотра
            </button>
          </div>

          <div className="glass-panel" style={styles.premiumPlanCard}>
            <div style={styles.recommendedBadge}>Классический план</div>
            <h2 style={styles.planTitle}>Премиум</h2>
            <div style={styles.planPrice}>
              499 ₽ <span style={styles.planPriceMeta}>в месяц</span>
            </div>
            <div style={styles.featureList}>
              <div style={styles.featureItem}>Полный доступ к каталогу</div>
              <div style={styles.featureItem}>Просмотр фильмов и аниме</div>
              <div style={styles.featureItem}>Серии и карточки эпизодов</div>
              <div style={styles.featureItem}>Подтверждение по коду Gmail</div>
            </div>
            <button className="btn-primary" style={styles.fullWidthButton} onClick={startPayment}>
              Оформить подписку
            </button>
          </div>
        </section>
      )}

      {step === 'payment' && (
        <section className="glass-panel" style={styles.checkoutCard}>
          <div style={styles.stepTitleRow}>
            <CreditCard size={20} color="var(--gold-primary)" />
            <h2 style={styles.cardTitle}>Оплата подписки</h2>
          </div>
          <p style={styles.mutedText}>
            После оплаты 6-значный код придет на <strong>{deliveryAddress}</strong>.
          </p>

          <form onSubmit={handlePaymentSubmit}>
            <div className="input-group">
              <label>Имя на карте</label>
              <input
                type="text"
                required
                className="input-field"
                value={cardData.name}
                onChange={(event) => setCardData({ ...cardData, name: event.target.value })}
                placeholder="IVAN PETROV"
              />
            </div>

            <div className="input-group">
              <label>Номер карты</label>
              <input
                type="text"
                required
                className="input-field"
                value={cardData.number}
                onChange={(event) => setCardData({ ...cardData, number: event.target.value })}
                placeholder="4242 4242 4242 4242"
                maxLength="19"
              />
            </div>

            <div className="subscription-inline-fields" style={styles.inlineFields}>
              <div className="input-group" style={styles.fieldFlex}>
                <label>Срок действия</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={cardData.expiry}
                  onChange={(event) => setCardData({ ...cardData, expiry: event.target.value })}
                  placeholder="12/27"
                  maxLength="5"
                />
              </div>
              <div className="input-group" style={styles.fieldFlex}>
                <label>CVC</label>
                <input
                  type="password"
                  required
                  className="input-field"
                  value={cardData.cvc}
                  onChange={(event) => setCardData({ ...cardData, cvc: event.target.value })}
                  placeholder="123"
                  maxLength="3"
                />
              </div>
            </div>

            <div style={styles.actionRow}>
              <button disabled={loading} type="submit" className="btn-primary" style={styles.fullWidthButton}>
                {loading ? 'Ожидайте...' : 'Оплатить 499 ₽'}
              </button>
              <button type="button" className="btn-outline" style={styles.secondaryButton} onClick={() => setStep('plan')}>
                Назад
              </button>
            </div>
          </form>
        </section>
      )}

      {step === 'verify' && (
        <section className="subscription-grid" style={styles.verifyGrid}>
          <div className="glass-panel" style={styles.checkoutCard}>
            <div style={styles.stepTitleRow}>
              <Mail size={20} color="#4285F4" />
              <h2 style={styles.cardTitle}>Подтверждение через Gmail</h2>
            </div>
            <p style={styles.mutedText}>
              Мы отправили код на <strong>{maskedEmail}</strong>. Введите его ниже, чтобы открыть каталог.
            </p>

            {paymentStatus && <div style={styles.infoBox}>{paymentStatus}</div>}
            {codeError && <div style={styles.errorBox}>{codeError}</div>}

            <form onSubmit={handleVerifyCode}>
              <div className="input-group">
                <label>Код из письма</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={enteredCode}
                  onChange={(event) => setEnteredCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                />
              </div>

              <div style={styles.actionRow}>
                <button disabled={loading} type="submit" className="btn-primary" style={styles.fullWidthButton}>
                  {loading ? 'Проверяем код...' : 'Подтвердить подписку'}
                </button>
                <button type="button" className="btn-outline" style={styles.secondaryButton} onClick={handleResendCode}>
                  Отправить код еще раз
                </button>
              </div>
            </form>
          </div>

          <div className="glass-panel" style={styles.phoneCard}>
            <div style={styles.phoneTop}>
              <Smartphone size={18} color="var(--gold-primary)" />
              <span>Телефон</span>
            </div>
            <div style={styles.phoneFrame}>
              <div style={styles.phoneStatus}>
                <span>9:41</span>
                <span>Gmail</span>
              </div>
              <div style={styles.gmailAppCard}>
                <div style={styles.gmailSender}>CineLuxe</div>
                <div style={styles.gmailSubject}>Код подтверждения подписки</div>
                <div style={styles.gmailText}>Введите этот код на странице подписки, чтобы открыть каталог фильмов.</div>
                <div style={styles.gmailCode}>{verificationCode}</div>
                <div style={styles.gmailFooter}>
                  <span>{maskedEmail}</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {step === 'success' && (
        <section className="glass-panel" style={styles.successCard}>
          <div style={styles.successIcon}>
            <CheckCircle2 size={34} />
          </div>
          <h2 style={styles.successTitle}>Подписка успешно активирована</h2>
          <p style={styles.mutedText}>Доступ к каталогу открыт. Сейчас вы перейдете к фильмам и аниме.</p>
        </section>
      )}

      <section className="glass-panel" style={styles.securityCard}>
        <div style={styles.stepTitleRow}>
          <ShieldCheck size={18} color="var(--gold-primary)" />
          <h3 style={styles.securityTitle}>Как это работает</h3>
        </div>
        <div className="subscription-security-grid" style={styles.securityGrid}>
          <div style={styles.securityItem}>1. Сначала оформляется подписка</div>
          <div style={styles.securityItem}>2. Затем код приходит на Gmail</div>
          <div style={styles.securityItem}>3. Только после кода открывается каталог</div>
        </div>
      </section>
    </div>
  );
};

const styles = {
  page: {
    maxWidth: '1180px',
    margin: '0 auto',
    padding: '40px 20px 56px',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: '1.3fr 0.7fr',
    gap: '24px',
    marginBottom: '28px',
    alignItems: 'stretch',
  },
  heroTextWrap: {
    padding: '34px',
    borderRadius: '24px',
    background:
      'linear-gradient(135deg, rgba(24,24,28,0.96), rgba(10,10,12,0.98)), radial-gradient(circle at top left, rgba(212, 175, 55, 0.12), transparent 35%)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  kicker: {
    display: 'inline-block',
    padding: '8px 14px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.05)',
    color: 'var(--gold-primary)',
    fontSize: '0.82rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '18px',
  },
  title: {
    fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
    marginBottom: '12px',
  },
  subtitle: {
    color: 'var(--text-muted)',
    lineHeight: 1.8,
    maxWidth: '720px',
  },
  heroCard: {
    padding: '28px',
  },
  heroCardTitle: {
    fontSize: '1.15rem',
    fontWeight: 700,
    marginBottom: '16px',
  },
  heroBenefit: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    padding: '12px 0',
    color: 'var(--text-main)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  planGrid: {
    marginBottom: '24px',
  },
  verifyGrid: {
    marginBottom: '24px',
    alignItems: 'start',
  },
  planCard: {
    padding: '32px',
  },
  premiumPlanCard: {
    padding: '32px',
    position: 'relative',
    border: '1px solid rgba(212, 175, 55, 0.36)',
    boxShadow: '0 0 34px rgba(212, 175, 55, 0.1)',
  },
  recommendedBadge: {
    position: 'absolute',
    top: '-12px',
    right: '22px',
    background: 'var(--gold-primary)',
    color: 'var(--bg-darker)',
    padding: '6px 14px',
    borderRadius: '999px',
    fontWeight: 700,
    fontSize: '0.8rem',
  },
  planLabel: {
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontSize: '0.78rem',
    marginBottom: '10px',
  },
  planTitle: {
    fontSize: '1.7rem',
    marginBottom: '10px',
  },
  planPrice: {
    fontSize: '2.9rem',
    fontWeight: 700,
    marginBottom: '24px',
  },
  planPriceMeta: {
    fontSize: '1rem',
    color: 'var(--text-muted)',
  },
  featureList: {
    display: 'grid',
    gap: '12px',
    marginBottom: '28px',
  },
  featureItem: {
    color: 'var(--text-muted)',
  },
  fullWidthButton: {
    width: '100%',
  },
  checkoutCard: {
    padding: '30px',
  },
  stepTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  cardTitle: {
    fontSize: '1.5rem',
  },
  mutedText: {
    color: 'var(--text-muted)',
    lineHeight: 1.65,
    marginBottom: '20px',
  },
  inlineFields: {
    display: 'flex',
    gap: '14px',
  },
  fieldFlex: {
    flex: 1,
  },
  actionRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '10px',
    flexWrap: 'wrap',
  },
  secondaryButton: {
    minWidth: '150px',
  },
  phoneCard: {
    padding: '24px',
  },
  phoneTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '18px',
    color: 'var(--gold-primary)',
  },
  phoneFrame: {
    borderRadius: '30px',
    padding: '16px',
    background: 'linear-gradient(180deg, #111216, #080809)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)',
  },
  phoneStatus: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#d7d7db',
    fontSize: '0.9rem',
    marginBottom: '16px',
  },
  gmailAppCard: {
    padding: '18px',
    borderRadius: '22px',
    background: '#ffffff',
    color: '#111',
  },
  gmailSender: {
    fontWeight: 700,
    marginBottom: '8px',
  },
  gmailSubject: {
    fontSize: '1rem',
    marginBottom: '10px',
  },
  gmailText: {
    color: '#4a4a4a',
    lineHeight: 1.55,
    marginBottom: '14px',
  },
  gmailCode: {
    fontSize: '2rem',
    letterSpacing: '0.22em',
    color: '#1a73e8',
    fontWeight: 700,
    marginBottom: '12px',
  },
  gmailFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#666',
    fontSize: '0.9rem',
    borderTop: '1px solid #ececec',
    paddingTop: '12px',
  },
  infoBox: {
    padding: '12px 14px',
    borderRadius: '12px',
    background: 'rgba(66, 133, 244, 0.1)',
    border: '1px solid rgba(66, 133, 244, 0.22)',
    color: '#aecdff',
    marginBottom: '16px',
  },
  errorBox: {
    padding: '12px 14px',
    borderRadius: '12px',
    background: 'rgba(229, 9, 20, 0.12)',
    border: '1px solid rgba(229, 9, 20, 0.24)',
    color: '#ffb4b4',
    marginBottom: '16px',
  },
  successCard: {
    maxWidth: '620px',
    margin: '0 auto 24px',
    padding: '42px',
    textAlign: 'center',
    border: '1px solid rgba(212, 175, 55, 0.3)',
  },
  successIcon: {
    width: '76px',
    height: '76px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 18px',
    background: 'rgba(212, 175, 55, 0.14)',
    color: 'var(--gold-primary)',
  },
  successTitle: {
    color: 'var(--gold-primary)',
    marginBottom: '10px',
  },
  securityCard: {
    padding: '24px',
  },
  securityTitle: {
    fontSize: '1.2rem',
  },
  securityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '14px',
  },
  securityItem: {
    padding: '14px 16px',
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-muted)',
    lineHeight: 1.6,
  },
};

export default Subscription;
