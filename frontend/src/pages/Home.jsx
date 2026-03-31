import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clapperboard, Play, Sparkles, Tv2 } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import { isAnimeMovie } from '../utils/episodes';
import { fetchCatalogMovies } from '../services/movieService';

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [anime, setAnime] = useState([]);

  useEffect(() => {
    const splitCatalog = (items) => {
      const movieItems = items.filter((item) => !isAnimeMovie(item)).slice(0, 5);
      const animeItems = items.filter((item) => isAnimeMovie(item)).slice(0, 5);
      setMovies(movieItems);
      setAnime(animeItems);
    };

    const fetchMovies = async () => {
      try {
        splitCatalog(await fetchCatalogMovies());
      } catch (error) {
        console.error('Error fetching movies', error);
        splitCatalog([]);
      }
    };

    fetchMovies();
  }, []);

  return (
    <div>
      <section className="home-hero" style={styles.hero}>
        <div style={styles.heroOverlay} />
        <div className="home-hero-content" style={styles.heroContent}>
          <div style={styles.kicker}>CineLuxe</div>
          <h1 style={styles.heroTitle}>Классический каталог фильмов и аниме</h1>
          <p style={styles.heroSubtitle}>
            Выберите фильм или аниме из подборки и откройте для себя аккуратный премиальный каталог в классическом стиле.
          </p>
          <div style={styles.ctaGroup}>
            <Link to="/movies" className="btn-primary" style={styles.ctaButton}>
              Открыть каталог <Play size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section" style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <div style={styles.sectionEyebrow}>Главный каталог</div>
            <h2 style={styles.sectionTitle}>Фильмы</h2>
          </div>
          <Clapperboard color="var(--gold-primary)" size={28} />
        </div>

        <div className="home-grid" style={styles.grid}>
          {movies.map((movie) => (
            <MovieCard key={movie._id} movie={movie} />
          ))}
        </div>
      </section>

      <section className="home-section" style={{ ...styles.section, ...styles.animeSection }}>
        <div style={styles.sectionHeader}>
          <div>
            <div style={styles.sectionEyebrow}>Подборка</div>
            <h2 style={styles.sectionTitle}>Аниме</h2>
          </div>
          <Tv2 color="var(--gold-primary)" size={28} />
        </div>

        <div className="home-grid" style={styles.grid}>
          {anime.map((movie) => (
            <MovieCard key={movie._id} movie={movie} />
          ))}
        </div>
      </section>

      <section style={styles.bottomBanner}>
        <Sparkles size={18} color="var(--gold-primary)" />
        <span>Все тексты на главной странице теперь оформлены на русском языке.</span>
      </section>
    </div>
  );
};

const styles = {
  hero: {
    position: 'relative',
    minHeight: '84vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    backgroundImage:
      'url("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2000&auto=format&fit=crop")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '40px 20px',
    overflow: 'hidden',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(8, 8, 9, 0.35) 0%, rgba(8, 8, 9, 0.72) 55%, rgba(8, 8, 9, 0.96) 100%)',
  },
  heroContent: {
    position: 'relative',
    maxWidth: '920px',
    zIndex: 1,
  },
  kicker: {
    display: 'inline-block',
    padding: '8px 14px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.08)',
    color: 'var(--gold-primary)',
    fontSize: '0.82rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '20px',
  },
  heroTitle: {
    fontSize: 'clamp(3rem, 5vw, 4.8rem)',
    marginBottom: '1rem',
    color: '#fff',
    textShadow: '0 4px 20px rgba(0,0,0,0.65)',
    lineHeight: 1.05,
  },
  heroSubtitle: {
    fontSize: 'clamp(1.08rem, 2.3vw, 1.45rem)',
    marginBottom: '2.3rem',
    fontWeight: '400',
    color: '#f0e3b0',
    lineHeight: 1.7,
    maxWidth: '760px',
    marginInline: 'auto',
  },
  ctaGroup: {
    display: 'flex',
    justifyContent: 'center',
  },
  ctaButton: {
    padding: '16px 40px',
    fontSize: '1.05rem',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  section: {
    padding: '56px 5%',
    backgroundColor: '#0a0a0c',
  },
  animeSection: {
    backgroundColor: 'var(--bg-dark)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '28px',
  },
  sectionEyebrow: {
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontSize: '0.8rem',
    marginBottom: '8px',
  },
  sectionTitle: {
    fontSize: '2.2rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '30px',
  },
  bottomBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '22px',
    color: 'var(--text-muted)',
    background: '#080809',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
};

export default Home;
