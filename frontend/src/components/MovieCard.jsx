import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star } from 'lucide-react';

const FALLBACK_POSTER =
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop';

const MovieCard = ({ movie }) => {
  const [imageSrc, setImageSrc] = useState(movie.posterUrl || FALLBACK_POSTER);

  useEffect(() => {
    setImageSrc(movie.posterUrl || FALLBACK_POSTER);
  }, [movie.posterUrl]);

  return (
    <Link to={`/movies/${movie._id}`} style={styles.cardLink}>
      <div style={styles.card} className="movie-card">
        <div style={styles.imageContainer}>
          <img
            src={imageSrc}
            alt={movie.title}
            style={styles.image}
            onError={() => setImageSrc(FALLBACK_POSTER)}
          />
          <div style={styles.overlay}>
            <Play size={42} style={styles.playIcon} />
          </div>
        </div>
        <div style={styles.info}>
          <h3 style={styles.title}>{movie.title}</h3>
          <div style={styles.meta}>
            <span style={styles.year}>{movie.releaseYear || '2024'}</span>
            <div style={styles.rating}>
              <Star size={14} fill="var(--gold-primary)" color="var(--gold-primary)" />
              <span>{Number(movie.rating || 0).toFixed(1)}</span>
            </div>
          </div>
          <p style={styles.genre}>{movie.genres?.slice(0, 2).join(' • ')}</p>
        </div>
      </div>
    </Link>
  );
};

const styles = {
  cardLink: {
    display: 'block',
    textDecoration: 'none',
  },
  card: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '8px',
    overflow: 'hidden',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
    position: 'relative',
  },
  imageContainer: {
    position: 'relative',
    height: '350px',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.04)',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.5s ease',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  playIcon: {
    color: 'var(--gold-primary)',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
  },
  info: {
    padding: '16px',
  },
  title: {
    color: 'var(--text-main)',
    fontSize: '1.2rem',
    marginBottom: '8px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: 'var(--gold-primary)',
    fontWeight: '600',
  },
  genre: {
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
  },
};

export default MovieCard;
