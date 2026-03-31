import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarBroken, setAvatarBroken] = useState(false);

  useEffect(() => {
    setAvatarBroken(false);
  }, [user?.avatarUrl]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="site-navbar" style={styles.nav}>
      <div style={styles.logoContainer}>
        <Film color="var(--gold-primary)" size={28} />
        <Link to="/" style={styles.logo}>
          CineLuxe
        </Link>
      </div>

      <div className="site-navbar-links" style={styles.links}>
        <Link to="/movies" style={styles.link}>
          Catalog
        </Link>
        {user ? (
          <>
            <Link to="/profile" style={styles.profileLink}>
              {user.avatarUrl && !avatarBroken ? (
                <img src={user.avatarUrl} alt={user.name} style={styles.avatarImage} onError={() => setAvatarBroken(true)} />
              ) : (
                <span style={styles.avatar}>{user.avatar || user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              )}
              <span>{user.name}</span>
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" style={styles.link}>
                Admin Panel
              </Link>
            )}
            <button onClick={handleLogout} className="btn-outline">
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>
              Sign In
            </Link>
            <Link to="/register">
              <button className="btn-primary">Registration</button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    background: 'rgba(8, 8, 9, 0.9)',
    backdropFilter: 'blur(10px)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    borderBottom: '1px solid rgba(212, 175, 55, 0.1)',
    gap: '16px',
    flexWrap: 'wrap',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logo: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.8rem',
    fontWeight: '700',
    color: 'var(--gold-primary)',
    letterSpacing: '1px',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    flexWrap: 'wrap',
  },
  link: {
    color: 'var(--text-main)',
    fontWeight: '500',
    fontSize: '1rem',
  },
  profileLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: 'var(--text-main)',
    fontWeight: 500,
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4285F4, #34A853)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
    fontWeight: 700,
  },
  avatarImage: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid rgba(255,255,255,0.14)',
  },
};

export default Navbar;
