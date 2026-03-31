import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Info, Play, Star, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getEpisodeList, isAnimeMovie } from '../utils/episodes';
import { getPlayableVideoSource } from '../utils/video';
import { fetchMovieById } from '../services/movieService';

const fallbackPoster =
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop';

const MovieDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState(1);

  const episodes = useMemo(() => getEpisodeList(movie), [movie]);
  const activeEpisode = episodes.find((episode) => episode.number === selectedEpisodeNumber) || episodes[0] || null;
  const hasEpisodes = episodes.length > 0;
  const isAnime = isAnimeMovie(movie);

  useEffect(() => {
    const fetchDatabaseMovie = async () => {
      try {
        const data = await fetchMovieById(id, user?.token);
        setMovie(data);
      } catch (err) {
        console.error('Error fetching specific movie', err);
        setError(err.response?.data?.message || 'Movie not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchDatabaseMovie();
  }, [id, user]);

  useEffect(() => {
    setSelectedEpisodeNumber(1);
  }, [movie?._id]);

  if (loading) {
    return <div style={styles.center}>Loading...</div>;
  }

  if (!movie) {
    return <div style={styles.center}>Movie not found.</div>;
  }

  if (isPlaying) {
    const playbackUrl = activeEpisode?.videoUrl || movie.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4';
    const videoSource = getPlayableVideoSource(playbackUrl);

    return (
      <div style={styles.videoContainer}>
        <button style={styles.closeBtn} onClick={() => setIsPlaying(false)}>
          <X size={30} color="#fff" />
          Close
        </button>

        {hasEpisodes && (
          <div style={styles.nowPlayingBadge}>
            {movie.title} • Episode {activeEpisode?.number}
          </div>
        )}

        {videoSource.type === 'youtube' ? (
          <iframe
            src={videoSource.src}
            style={styles.videoPlayer}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video player"
          />
        ) : (
          <video src={videoSource.src} autoPlay controls style={styles.videoPlayer}>
            Video format not supported
          </video>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          ...styles.hero,
          backgroundImage: `linear-gradient(rgba(8,8,9,0.3), rgba(8,8,9,1)), url(${movie.posterUrl || fallbackPoster})`,
        }}
      >
        <div style={styles.content}>
          <h1 style={styles.title}>{movie.title}</h1>

          <div style={styles.meta}>
            <span>{movie.releaseYear}</span>
            <span style={styles.rating}>
              <Star size={16} fill="var(--gold-primary)" />
              {movie.rating}
            </span>
          </div>

          <div style={styles.genres}>
            {movie.genres?.map((genre) => (
              <span key={genre} style={styles.tag}>
                {genre}
              </span>
            ))}
          </div>

          <p style={styles.description}>{movie.description}</p>

          {hasEpisodes && (
            <div style={styles.episodeSummary}>
              <div style={styles.episodeSummaryTitle}>Episode Library</div>
              <div style={styles.episodeSummaryText}>
                {movie.title} has {episodes.length} episodes. Pick an episode below and start watching right away.
              </div>
            </div>
          )}

          {error ? (
            <div className="glass-panel" style={styles.errorBox}>
              <Info color="var(--gold-primary)" />
              <p>{error}</p>
            </div>
          ) : (
            <button
              className="btn-primary"
              style={styles.watchButton}
              onClick={() => setIsPlaying(true)}
            >
              <Play fill="#000" />
              {hasEpisodes ? `Watch Episode ${activeEpisode?.number || 1}` : 'Watch Now'}
            </button>
          )}
        </div>
      </div>

      {hasEpisodes && (
        <section style={styles.episodesSection}>
          <div style={styles.episodesHeader}>
            <div>
              <div style={styles.episodesEyebrow}>{isAnime ? 'Anime episodes' : 'Episode list'}</div>
              <h2 style={styles.episodesTitle}>Choose an episode</h2>
            </div>
            <div style={styles.episodeCounter}>{episodes.length} total</div>
          </div>

          <div style={styles.episodeGrid}>
            {episodes.map((episode) => {
              const isActive = episode.number === selectedEpisodeNumber;

              return (
                <button
                  key={episode.id}
                  type="button"
                  onClick={() => setSelectedEpisodeNumber(episode.number)}
                  style={{
                    ...styles.episodeCard,
                    ...(isActive ? styles.episodeCardActive : {}),
                  }}
                >
                  <div style={styles.episodeNumber}>Episode {episode.number}</div>
                  <div style={styles.episodeTitle}>{episode.title}</div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

const styles = {
  center: {
    textAlign: 'center',
    padding: '100px',
    color: 'var(--gold-primary)',
  },
  hero: {
    minHeight: '90vh',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'flex-end',
    padding: '60px 5%',
  },
  content: {
    maxWidth: '860px',
    paddingBottom: '50px',
  },
  title: {
    fontSize: '4rem',
    marginBottom: '10px',
    lineHeight: '1.1',
  },
  meta: {
    display: 'flex',
    gap: '20px',
    fontSize: '1.2rem',
    color: 'var(--text-muted)',
    marginBottom: '20px',
    alignItems: 'center',
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    color: 'var(--gold-primary)',
  },
  genres: {
    display: 'flex',
    gap: '10px',
    marginBottom: '25px',
    flexWrap: 'wrap',
  },
  tag: {
    background: 'rgba(255,255,255,0.1)',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.9rem',
  },
  description: {
    fontSize: '1.2rem',
    lineHeight: '1.6',
    marginBottom: '32px',
    color: 'var(--text-main)',
  },
  episodeSummary: {
    marginBottom: '28px',
    padding: '18px 20px',
    borderRadius: '18px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    maxWidth: '540px',
  },
  episodeSummaryTitle: {
    fontWeight: 700,
    marginBottom: '8px',
  },
  episodeSummaryText: {
    color: 'var(--text-muted)',
    lineHeight: '1.6',
  },
  watchButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '1.2rem',
  },
  errorBox: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    borderLeft: '4px solid var(--gold-primary)',
  },
  videoContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  nowPlayingBadge: {
    position: 'absolute',
    top: '24px',
    right: '24px',
    zIndex: 10000,
    background: 'rgba(212, 175, 55, 0.18)',
    border: '1px solid rgba(212, 175, 55, 0.4)',
    color: '#fff',
    padding: '10px 16px',
    borderRadius: '999px',
    fontSize: '0.95rem',
    backdropFilter: 'blur(10px)',
  },
  closeBtn: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 10000,
    background: 'rgba(0,0,0,0.5)',
    border: 'none',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '1.1rem',
  },
  episodesSection: {
    padding: '36px 5% 48px',
    background: 'linear-gradient(180deg, rgba(8,8,9,0), rgba(8,8,9,0.94) 15%, rgba(8,8,9,1) 100%)',
  },
  episodesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'end',
    marginBottom: '22px',
    flexWrap: 'wrap',
  },
  episodesEyebrow: {
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontSize: '0.78rem',
    marginBottom: '8px',
  },
  episodesTitle: {
    fontSize: '2rem',
  },
  episodeCounter: {
    color: 'var(--gold-primary)',
    fontWeight: 700,
    fontSize: '1rem',
  },
  episodeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px',
  },
  episodeCard: {
    textAlign: 'left',
    padding: '18px',
    borderRadius: '18px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'var(--text-main)',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  episodeCardActive: {
    background: 'rgba(212, 175, 55, 0.12)',
    border: '1px solid rgba(212, 175, 55, 0.45)',
    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.22)',
  },
  episodeNumber: {
    color: 'var(--gold-primary)',
    fontSize: '0.88rem',
    fontWeight: 700,
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  episodeTitle: {
    fontSize: '1rem',
    lineHeight: '1.45',
  },
};

export default MovieDetails;
