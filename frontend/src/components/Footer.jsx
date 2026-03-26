import React from 'react';

const Footer = () => {
  return (
    <footer style={styles.footer}>
      <p style={styles.text}>&copy; {new Date().getFullYear()} CineLuxe. All rights reserved.</p>
      <p style={styles.subtext}>Classic Cinema. Premium Experience.</p>
    </footer>
  );
};

const styles = {
  footer: {
    padding: '40px 20px',
    textAlign: 'center',
    background: 'var(--bg-darker)',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    marginTop: 'auto'
  },
  text: {
    color: 'var(--text-main)',
    fontFamily: 'var(--font-serif)',
    fontSize: '1.1rem',
    marginBottom: '8px'
  },
  subtext: {
    color: 'var(--gold-primary)',
    fontSize: '0.9rem',
    letterSpacing: '2px',
    textTransform: 'uppercase'
  }
};

export default Footer;
