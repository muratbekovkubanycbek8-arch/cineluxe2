import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clapperboard,
  Clock3,
  Edit3,
  Film,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mockMoviesData as initialMockMovies } from '../data/moviesData';
import { getYouTubeVideoId, normalizeVideoUrl } from '../utils/video';
import { isAnimeMovie } from '../utils/episodes';
import {
  mergeMovieCollections,
  readDeletedMovieIds,
  readLocalAdminMovies,
  saveDeletedMovieIds,
  saveLocalAdminMovies,
} from '../utils/localMovies';

const API_URL = 'http://localhost:5000/api';

const defaultMovieState = {
  title: '',
  releaseYear: '',
  rating: '',
  posterUrl: '',
  videoUrl: '',
  episodeCount: '',
  episodes: [],
  description: '',
  genres: 'Action, Drama',
};

const defaultEpisodeDraft = {
  number: '1',
  title: '',
  videoUrl: '',
};

const adminAlerts = [
  {
    title: '2 titles need poster updates',
    detail: 'Artwork ratio mismatches were detected during the last QA sync.',
    tone: 'warning',
  },
  {
    title: 'Moderation backlog is within SLA',
    detail: 'Average approval time is 41 minutes across the last 24 hours.',
    tone: 'success',
  },
  {
    title: 'Premium churn risk increased',
    detail: 'Weekend engagement fell 6.2% in the family catalog segment.',
    tone: 'neutral',
  },
];

const opsChecklist = [
  { title: 'Metadata QA', value: '18/22 cleared', detail: '4 titles still missing localized keywords.' },
  { title: 'Trailer readiness', value: '93%', detail: 'All Friday launches have playable trailer links.' },
  { title: 'Publishing queue', value: '7 pending', detail: 'Mostly scheduled for tomorrow morning rollout.' },
];

const formatCompact = (value) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

const getMovieStatus = (movie) => {
  if (!movie.videoUrl) return 'Needs Trailer';
  if ((movie.rating || 0) >= 8.5) return 'Featured';
  if ((movie.releaseYear || 0) >= 2023) return 'New Release';
  return 'Library';
};

const getStatusTone = (status) => {
  if (status === 'Featured') return 'success';
  if (status === 'Needs Trailer') return 'warning';
  if (status === 'New Release') return 'info';
  return 'neutral';
};

const getAlertTone = (tone) => {
  if (tone === 'success') return styles.alertSuccess;
  if (tone === 'warning') return styles.alertWarning;
  return styles.alertNeutral;
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [submitError, setSubmitError] = useState('');
  const [newMovie, setNewMovie] = useState(defaultMovieState);
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [episodeDraft, setEpisodeDraft] = useState(defaultEpisodeDraft);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const fetchMovies = async () => {
      const localAdminMovies = readLocalAdminMovies();
      try {
        const { data } = await axios.get(`${API_URL}/movies`);
        setMovies(mergeMovieCollections(localAdminMovies, data, initialMockMovies));
      } catch (error) {
        console.error('Error fetching movies', error);
        setMovies(mergeMovieCollections(localAdminMovies, initialMockMovies));
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [user]);

  const dashboardMetrics = useMemo(() => {
    const totalTitles = movies.length;
    const featuredTitles = movies.filter((movie) => (movie.rating || 0) >= 8.5).length;
    const newReleases = movies.filter((movie) => (movie.releaseYear || 0) >= 2023).length;
    const averageRating =
      totalTitles > 0
        ? (movies.reduce((sum, movie) => sum + (Number(movie.rating) || 0), 0) / totalTitles).toFixed(1)
        : '0.0';

    return [
      {
        label: 'Active viewers',
        value: formatCompact(18420 + totalTitles * 37),
        note: 'Watching during the current 15 min window',
        icon: Users,
      },
      {
        label: 'Premium revenue',
        value: `$${formatCompact(126800 + featuredTitles * 420)}`,
        note: 'Projected monthly recurring revenue',
        icon: CircleDollarSign,
      },
      {
        label: 'Featured titles',
        value: featuredTitles,
        note: `${newReleases} recent releases are outperforming baseline`,
        icon: Sparkles,
      },
      {
        label: 'Catalog health',
        value: `${averageRating}/10`,
        note: `${totalTitles} total titles indexed in the dashboard`,
        icon: ShieldCheck,
      },
    ];
  }, [movies]);

  const upcomingLaunches = useMemo(
    () =>
      movies
        .filter((movie) => (movie.releaseYear || 0) >= 2022)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 4)
        .map((movie, index) => ({
          id: movie._id,
          title: movie.title,
          date: ['Today, 18:00', 'Tomorrow, 11:30', 'Friday, 20:00', 'Saturday, 16:00'][index] || 'Next slot',
          tag: getMovieStatus(movie),
        })),
    [movies]
  );

  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const movieStatus = getMovieStatus(movie);
      const matchesSearch =
        !searchTerm ||
        movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.genres?.join(' ').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || movieStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [movies, searchTerm, statusFilter]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMovieId(null);
    setNewMovie(defaultMovieState);
    setEpisodeDraft(defaultEpisodeDraft);
    setSubmitError('');
  };

  const openCreateModal = () => {
    setEditingMovieId(null);
    setNewMovie(defaultMovieState);
    setEpisodeDraft(defaultEpisodeDraft);
    setSubmitError('');
    setIsModalOpen(true);
  };

  const syncEpisodeDraft = (episodeNumber, episodeList) => {
    const normalizedNumber = Math.max(1, parseInt(episodeNumber, 10) || 1);
    const existingEpisode = (episodeList || []).find((episode) => Number(episode.number) === normalizedNumber);

    setEpisodeDraft({
      number: normalizedNumber.toString(),
      title: existingEpisode?.title || '',
      videoUrl: existingEpisode?.videoUrl || '',
    });
  };

  const openEditModal = (movie) => {
    setEditingMovieId(movie._id);
    setSubmitError('');
    const normalizedEpisodes = Array.isArray(movie.episodes)
      ? movie.episodes.map((episode, index) => ({
          id: episode.id || `episode-${index + 1}`,
          number: Number(episode.number) || index + 1,
          title: episode.title || '',
          videoUrl: episode.videoUrl || '',
        }))
      : [];

    setNewMovie({
      title: movie.title || '',
      releaseYear: movie.releaseYear?.toString() || '',
      rating: movie.rating?.toString() || '',
      posterUrl: movie.posterUrl || '',
      videoUrl: movie.videoUrl || '',
      episodeCount: movie.episodeCount?.toString() || '',
      episodes: normalizedEpisodes,
      description: movie.description || '',
      genres: Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres || '',
    });
    syncEpisodeDraft(normalizedEpisodes[0]?.number || 1, normalizedEpisodes);
    setIsModalOpen(true);
  };

  const handleEpisodeNumberChange = (value) => {
    syncEpisodeDraft(value, newMovie.episodes);
  };

  const handleSaveEpisode = () => {
    const episodeNumber = Math.max(1, parseInt(episodeDraft.number, 10) || 1);
    const normalizedEpisodeUrl = normalizeVideoUrl(episodeDraft.videoUrl);

    if (!normalizedEpisodeUrl) {
      setSubmitError('Episode video URL is required.');
      return;
    }

    const isYouTubeVideo = Boolean(getYouTubeVideoId(normalizedEpisodeUrl));
    const isDirectVideoFile = /\.(mp4|webm|ogg)(\?.*)?$/i.test(normalizedEpisodeUrl);

    if (!isYouTubeVideo && !isDirectVideoFile) {
      setSubmitError('Episode video URL must be a YouTube link or direct .mp4/.webm/.ogg file.');
      return;
    }

    const updatedEpisode = {
      id: `${editingMovieId || 'draft'}-episode-${episodeNumber}`,
      number: episodeNumber,
      title: episodeDraft.title.trim() || `Episode ${episodeNumber}`,
      videoUrl: normalizedEpisodeUrl,
    };

    const remainingEpisodes = (newMovie.episodes || []).filter((episode) => Number(episode.number) !== episodeNumber);
    const updatedEpisodes = [...remainingEpisodes, updatedEpisode].sort((a, b) => a.number - b.number);

    setNewMovie((currentMovie) => ({
      ...currentMovie,
      episodeCount: Math.max(parseInt(currentMovie.episodeCount, 10) || 0, episodeNumber).toString(),
      episodes: updatedEpisodes,
    }));
    setEpisodeDraft({
      number: episodeNumber.toString(),
      title: updatedEpisode.title,
      videoUrl: updatedEpisode.videoUrl,
    });
    setSubmitError('');
  };

  const handleRemoveEpisode = () => {
    const episodeNumber = Math.max(1, parseInt(episodeDraft.number, 10) || 1);
    const updatedEpisodes = (newMovie.episodes || []).filter((episode) => Number(episode.number) !== episodeNumber);

    setNewMovie((currentMovie) => ({
      ...currentMovie,
      episodes: updatedEpisodes,
    }));
    setEpisodeDraft({
      number: episodeNumber.toString(),
      title: '',
      videoUrl: '',
    });
    setSubmitError('');
  };

  const handleSaveMovie = async (event) => {
    event.preventDefault();
    setSubmitError('');

    if (!user?.token) {
      setSubmitError('Admin token not found.');
      return;
    }

    try {
      const normalizedVideoUrl = normalizeVideoUrl(newMovie.videoUrl);
      const normalizedPosterUrl = newMovie.posterUrl ? normalizeVideoUrl(newMovie.posterUrl) : '';
      const isYouTubeVideo = Boolean(getYouTubeVideoId(normalizedVideoUrl));
      const isDirectVideoFile = /\.(mp4|webm|ogg)(\?.*)?$/i.test(normalizedVideoUrl);

      if (!isYouTubeVideo && !isDirectVideoFile) {
        setSubmitError('Video URL must be a YouTube link or direct .mp4/.webm/.ogg file.');
        return;
      }

      const movieData = {
        ...newMovie,
        releaseYear: parseInt(newMovie.releaseYear, 10) || new Date().getFullYear(),
        rating: parseFloat(newMovie.rating) || 8.0,
        episodeCount: parseInt(newMovie.episodeCount, 10) || 0,
        episodes: (newMovie.episodes || []).map((episode, index) => ({
          id: episode.id || `episode-${index + 1}`,
          number: Number(episode.number) || index + 1,
          title: episode.title || `Episode ${index + 1}`,
          videoUrl: normalizeVideoUrl(episode.videoUrl || ''),
        })),
        posterUrl: normalizedPosterUrl,
        videoUrl: normalizedVideoUrl,
        description: newMovie.description.trim() || `${newMovie.title.trim()} official trailer and full story overview.`,
        genres: newMovie.genres.split(',').map((genre) => genre.trim()).filter(Boolean),
      };

      const config = { headers: { Authorization: `Bearer ${user.token}` } };

      if (editingMovieId) {
        saveDeletedMovieIds(readDeletedMovieIds().filter((id) => id !== editingMovieId));
        const currentMovie = movies.find((movie) => movie._id === editingMovieId);
        const isLocalMovie = typeof editingMovieId === 'string' && editingMovieId.startsWith('local-');
        const isMockMovie = typeof editingMovieId === 'string' && editingMovieId.length < 5;

        if (isLocalMovie || isMockMovie) {
          const updatedMovie = { ...(currentMovie || {}), ...movieData, _id: editingMovieId };
          const otherLocalMovies = readLocalAdminMovies().filter((movie) => movie._id !== editingMovieId);
          saveLocalAdminMovies([updatedMovie, ...otherLocalMovies]);
          setMovies((currentMovies) => currentMovies.map((movie) => (movie._id === editingMovieId ? updatedMovie : movie)));
        } else {
          const { data } = await axios.put(`${API_URL}/movies/${editingMovieId}`, movieData, config);
          const localMoviesWithoutCurrent = readLocalAdminMovies().filter((movie) => movie._id !== editingMovieId);
          saveLocalAdminMovies(localMoviesWithoutCurrent);
          setMovies((currentMovies) =>
            currentMovies.map((movie) => (movie._id === editingMovieId ? data : movie))
          );
        }
      } else {
        const { data } = await axios.post(`${API_URL}/movies`, movieData, config);
        saveDeletedMovieIds(readDeletedMovieIds().filter((id) => id !== data._id));
        setMovies((currentMovies) => [data, ...currentMovies]);
      }

      closeModal();
    } catch (error) {
      const fallbackMovie = {
        _id: editingMovieId || `local-${Date.now()}`,
        ...newMovie,
        releaseYear: parseInt(newMovie.releaseYear, 10) || new Date().getFullYear(),
        rating: parseFloat(newMovie.rating) || 8.0,
        episodeCount: parseInt(newMovie.episodeCount, 10) || 0,
        episodes: (newMovie.episodes || []).map((episode, index) => ({
          id: episode.id || `episode-${index + 1}`,
          number: Number(episode.number) || index + 1,
          title: episode.title || `Episode ${index + 1}`,
          videoUrl: normalizeVideoUrl(episode.videoUrl || ''),
        })),
        posterUrl: newMovie.posterUrl ? normalizeVideoUrl(newMovie.posterUrl) : '',
        videoUrl: normalizeVideoUrl(newMovie.videoUrl),
        description: newMovie.description.trim() || `${newMovie.title.trim()} official trailer and full story overview.`,
        genres: newMovie.genres.split(',').map((genre) => genre.trim()).filter(Boolean),
      };

      const otherLocalMovies = readLocalAdminMovies().filter((movie) => movie._id !== fallbackMovie._id);
      saveLocalAdminMovies([fallbackMovie, ...otherLocalMovies]);

      if (editingMovieId) {
        setMovies((currentMovies) =>
          currentMovies.map((movie) => (movie._id === editingMovieId ? fallbackMovie : movie))
        );
      } else {
        setMovies((currentMovies) => [fallbackMovie, ...currentMovies]);
      }

      closeModal();
    }
  };

  const handleDeleteMovie = async (id, isMock) => {
    if (isMock) {
      window.alert('Demo titles are locked and cannot be deleted.');
      return;
    }

    if (!window.confirm('Delete this movie from the catalog?')) return;

    if (typeof id === 'string' && id.startsWith('local-')) {
      const updatedLocalMovies = readLocalAdminMovies().filter((movie) => movie._id !== id);
      saveLocalAdminMovies(updatedLocalMovies);
      saveDeletedMovieIds(readDeletedMovieIds().filter((movieId) => movieId !== id));
      setMovies((currentMovies) => currentMovies.filter((movie) => movie._id !== id));
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`${API_URL}/movies/${id}`, config);
      saveLocalAdminMovies(readLocalAdminMovies().filter((movie) => movie._id !== id));
      saveDeletedMovieIds(readDeletedMovieIds().filter((movieId) => movieId !== id));
      setMovies((currentMovies) => currentMovies.filter((movie) => movie._id !== id));
    } catch (error) {
      if (!error.response) {
        saveDeletedMovieIds(Array.from(new Set([...readDeletedMovieIds(), id])));
        saveLocalAdminMovies(readLocalAdminMovies().filter((movie) => movie._id !== id));
        setMovies((currentMovies) => currentMovies.filter((movie) => movie._id !== id));
        return;
      }

      window.alert(error.response?.data?.message || 'Unable to delete this title.');
    }
  };

  if (!user || user.role !== 'admin') {
    return <div style={styles.deniedState}>Access denied. Admin role required.</div>;
  }

  const isAnimeDraft = isAnimeMovie({
    title: newMovie.title,
    genres: newMovie.genres.split(',').map((genre) => genre.trim()).filter(Boolean),
  });

  return (
    <div style={styles.page}>
      <section className="admin-hero-grid" style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.kicker}>
            <Activity size={16} />
            Streaming Operations
          </div>
          <h1 style={styles.heroTitle}>Admin Command Center</h1>
          <p style={styles.heroText}>
            Welcome back, {user.name}. Today&apos;s focus is release readiness, moderation quality, and keeping
            premium engagement steady across the catalog.
          </p>
        </div>
        <div className="glass-panel" style={styles.heroPanel}>
          <div style={styles.heroPanelLabel}>Shift snapshot</div>
          <div style={styles.heroPanelValue}>Stable</div>
          <div style={styles.heroPanelMeta}>No critical outages. Content ingestion is running on schedule.</div>
          <div style={styles.heroPills}>
            <span style={styles.livePill}>Live monitoring</span>
            <span style={styles.softPill}>24h overview</span>
          </div>
        </div>
      </section>

      <section className="admin-metrics-grid">
        {dashboardMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className="glass-panel" style={styles.metricCard}>
              <div style={styles.metricIconWrap}>
                <Icon size={20} />
              </div>
              <div style={styles.metricLabel}>{metric.label}</div>
              <div style={styles.metricValue}>{metric.value}</div>
              <div style={styles.metricNote}>{metric.note}</div>
            </article>
          );
        })}
      </section>

      <section className="admin-main-grid">
        <article className="glass-panel" style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.sectionEyebrow}>Risk watch</div>
              <h2 style={styles.sectionTitle}>Operational alerts</h2>
            </div>
            <AlertTriangle size={18} color="var(--gold-primary)" />
          </div>
          <div style={styles.stack}>
            {adminAlerts.map((alert) => (
              <div key={alert.title} style={{ ...styles.alertCard, ...getAlertTone(alert.tone) }}>
                <div style={styles.alertTitle}>{alert.title}</div>
                <div style={styles.alertText}>{alert.detail}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-panel" style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.sectionEyebrow}>Content pipeline</div>
              <h2 style={styles.sectionTitle}>Publishing workflow</h2>
            </div>
            <Clapperboard size={18} color="var(--gold-primary)" />
          </div>
          <div style={styles.stack}>
            {opsChecklist.map((item) => (
              <div key={item.title} style={styles.workflowRow}>
                <div>
                  <div style={styles.workflowTitle}>{item.title}</div>
                  <div style={styles.workflowText}>{item.detail}</div>
                </div>
                <div style={styles.workflowValue}>{item.value}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-panel" style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.sectionEyebrow}>Launch calendar</div>
              <h2 style={styles.sectionTitle}>Scheduled drops</h2>
            </div>
            <CalendarDays size={18} color="var(--gold-primary)" />
          </div>
          <div style={styles.stack}>
            {upcomingLaunches.map((launch) => (
              <div key={launch.id} style={styles.launchRow}>
                <div>
                  <div style={styles.workflowTitle}>{launch.title}</div>
                  <div style={styles.workflowText}>{launch.date}</div>
                </div>
                <span style={styles.tableBadge(getStatusTone(launch.tag))}>{launch.tag}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="admin-bottom-grid">
        <article className="glass-panel" style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.sectionEyebrow}>Quality index</div>
              <h2 style={styles.sectionTitle}>Catalog health</h2>
            </div>
            <Star size={18} color="var(--gold-primary)" />
          </div>
          <div style={styles.healthGrid}>
            <div style={styles.healthBlock}>
              <div style={styles.healthValue}>{movies.filter((movie) => movie.posterUrl).length}</div>
              <div style={styles.healthLabel}>Titles with artwork</div>
            </div>
            <div style={styles.healthBlock}>
              <div style={styles.healthValue}>{movies.filter((movie) => movie.videoUrl).length}</div>
              <div style={styles.healthLabel}>Titles with trailers</div>
            </div>
            <div style={styles.healthBlock}>
              <div style={styles.healthValue}>{movies.filter((movie) => (movie.rating || 0) >= 8).length}</div>
              <div style={styles.healthLabel}>High performing titles</div>
            </div>
            <div style={styles.healthBlock}>
              <div style={styles.healthValue}>{movies.filter((movie) => (movie.releaseYear || 0) >= 2020).length}</div>
              <div style={styles.healthLabel}>Modern releases</div>
            </div>
          </div>
        </article>

        <article className="glass-panel" style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.sectionEyebrow}>Team notes</div>
              <h2 style={styles.sectionTitle}>Recent activity</h2>
            </div>
            <Clock3 size={18} color="var(--gold-primary)" />
          </div>
          <div style={styles.timeline}>
            <div style={styles.timelineItem}>
              <CheckCircle2 size={16} color="#78d381" />
              <span>Localization batch for featured anime titles was approved 18 minutes ago.</span>
            </div>
            <div style={styles.timelineItem}>
              <Film size={16} color="var(--gold-primary)" />
              <span>Editorial team pinned 3 titles to the weekend hero carousel.</span>
            </div>
            <div style={styles.timelineItem}>
              <AlertTriangle size={16} color="#ffb86b" />
              <span>One trailer source returned a timeout and needs a manual retry.</span>
            </div>
          </div>
        </article>
      </section>

      <section className="glass-panel" style={styles.catalogCard}>
        <div className="admin-toolbar">
          <div>
            <div style={styles.sectionEyebrow}>Catalog manager</div>
            <h2 style={styles.sectionTitle}>Movies database</h2>
          </div>
          <button className="btn-primary" onClick={openCreateModal} style={styles.addButton}>
            <Plus size={16} />
            Add title
          </button>
        </div>

        <div className="admin-filters">
          <input
            type="text"
            className="input-field"
            placeholder="Search by title or genre"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <select
            className="input-field"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All statuses</option>
            <option value="Featured">Featured</option>
            <option value="New Release">New Release</option>
            <option value="Library">Library</option>
            <option value="Needs Trailer">Needs Trailer</option>
          </select>
        </div>

        {loading ? (
          <div style={styles.loadingState}>Loading dashboard data...</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Title</th>
                  <th style={styles.th}>Year</th>
                  <th style={styles.th}>Rating</th>
                  <th style={styles.th}>Genres</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovies.map((movie) => {
                  const isMock = typeof movie._id === 'string' && movie._id.length < 5;
                  const status = getMovieStatus(movie);

                  return (
                    <tr key={movie._id} style={styles.row}>
                      <td style={styles.td}>
                        <div style={styles.titleCell}>
                          <div style={styles.posterThumb}>
                            {movie.posterUrl ? (
                              <img src={movie.posterUrl} alt={movie.title} style={styles.posterImage} />
                            ) : (
                              <Film size={16} />
                            )}
                          </div>
                          <div>
                            <div style={styles.movieTitle}>{movie.title}</div>
                            <div style={styles.movieMeta}>
                              {movie.description ? `${movie.description.slice(0, 70)}...` : 'No description provided.'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>{movie.releaseYear}</td>
                      <td style={styles.td}>{movie.rating}</td>
                      <td style={styles.td}>{movie.genres?.join(', ')}</td>
                      <td style={styles.td}>
                        <span style={styles.tableBadge(getStatusTone(status))}>{status}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button
                            className="btn-outline"
                            onClick={() => openEditModal(movie)}
                            style={styles.editButton}
                          >
                            <Edit3 size={14} />
                            Edit
                          </button>
                          <button
                            className="btn-outline"
                            onClick={() => handleDeleteMovie(movie._id, isMock)}
                            style={{
                              ...styles.deleteButton,
                              ...(isMock ? styles.disabledDeleteButton : styles.activeDeleteButton),
                            }}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div className="glass-panel admin-modal-card" style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.sectionEyebrow}>New content</div>
                <h3 style={styles.modalTitle}>Add movie or anime title</h3>
                <div style={styles.modalModeText}>{editingMovieId ? 'Edit existing title' : 'Create new title'}</div>
              </div>
              <button className="btn-outline" onClick={closeModal} style={styles.closeButton}>
                Close
              </button>
            </div>

            {submitError && <div style={{ ...styles.alertCard, ...styles.alertWarning }}>{submitError}</div>}

            <form onSubmit={handleSaveMovie}>
              <div className="admin-form-grid">
                <div className="input-group">
                  <label>Title</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={newMovie.title}
                    onChange={(event) => setNewMovie({ ...newMovie, title: event.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label>Genres</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={newMovie.genres}
                    onChange={(event) => setNewMovie({ ...newMovie, genres: event.target.value })}
                    placeholder="Action, Drama, Anime"
                  />
                </div>
                <div className="input-group">
                  <label>Release year</label>
                  <input
                    type="number"
                    required
                    className="input-field"
                    value={newMovie.releaseYear}
                    onChange={(event) => setNewMovie({ ...newMovie, releaseYear: event.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label>Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    required
                    className="input-field"
                    value={newMovie.rating}
                    onChange={(event) => setNewMovie({ ...newMovie, rating: event.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label>Episode count</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={newMovie.episodeCount}
                    onChange={(event) => setNewMovie({ ...newMovie, episodeCount: event.target.value })}
                    placeholder="290 for Naruto, 24 for short anime"
                  />
                  <div style={styles.fieldHint}>
                    Optional. For anime titles, this controls how many episode cards appear on the details page.
                  </div>
                </div>
                <div className="input-group">
                  <label>Poster URL</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newMovie.posterUrl}
                    onChange={(event) => setNewMovie({ ...newMovie, posterUrl: event.target.value })}
                    placeholder="https://site.com/poster.jpg"
                  />
                  <div style={styles.fieldHint}>
                    Use a direct image link like `.jpg`, `.png`, or `.webp`. If the link is broken, catalog will show a
                    fallback poster.
                  </div>
                </div>
                <div className="input-group">
                  <label>Trailer or video URL</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={newMovie.videoUrl}
                    onChange={(event) => setNewMovie({ ...newMovie, videoUrl: event.target.value })}
                    placeholder="https://youtu.be/... or https://site.com/video.mp4"
                  />
                  <div style={styles.fieldHint}>
                    Supported: `youtu.be`, `youtube.com/watch?v=`, `youtube.com/shorts/`, `youtube.com/embed/`, or
                    direct `.mp4/.webm/.ogg` file.
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Description</label>
                <textarea
                  rows="4"
                  className="input-field"
                  value={newMovie.description}
                  onChange={(event) => setNewMovie({ ...newMovie, description: event.target.value })}
                  placeholder="Write a short synopsis for the editorial team."
                />
              </div>

              {isAnimeDraft && (
                <div className="glass-panel" style={styles.episodeEditorCard}>
                  <div style={styles.episodeEditorHeader}>
                    <div>
                      <div style={styles.sectionEyebrow}>Episode editor</div>
                      <div style={styles.episodeEditorTitle}>Save a separate link for each episode</div>
                    </div>
                    <div style={styles.episodeCounterBadge}>
                      {(newMovie.episodes || []).length} saved
                    </div>
                  </div>

                  <div className="admin-form-grid">
                    <div className="input-group">
                      <label>Episode number</label>
                      <input
                        type="number"
                        min="1"
                        className="input-field"
                        value={episodeDraft.number}
                        onChange={(event) => handleEpisodeNumberChange(event.target.value)}
                      />
                      <div style={styles.fieldHint}>
                        Switching to another episode number clears the previous link unless that episode was already saved.
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Episode title</label>
                      <input
                        type="text"
                        className="input-field"
                        value={episodeDraft.title}
                        onChange={(event) => setEpisodeDraft((current) => ({ ...current, title: event.target.value }))}
                        placeholder="Episode 2"
                      />
                    </div>
                    <div className="input-group" style={styles.episodeUrlField}>
                      <label>Episode video URL</label>
                      <input
                        type="text"
                        className="input-field"
                        value={episodeDraft.videoUrl}
                        onChange={(event) => setEpisodeDraft((current) => ({ ...current, videoUrl: event.target.value }))}
                        placeholder="https://youtu.be/... or https://site.com/video.mp4"
                      />
                    </div>
                  </div>

                  <div style={styles.episodeActions}>
                    <button type="button" className="btn-primary" onClick={handleSaveEpisode}>
                      Save episode link
                    </button>
                    <button type="button" className="btn-outline" onClick={handleRemoveEpisode}>
                      Remove episode
                    </button>
                  </div>

                  {(newMovie.episodes || []).length > 0 && (
                    <div style={styles.savedEpisodesList}>
                      {(newMovie.episodes || []).map((episode) => (
                        <button
                          key={episode.id}
                          type="button"
                          onClick={() => syncEpisodeDraft(episode.number, newMovie.episodes)}
                          style={styles.savedEpisodeChip}
                        >
                          Episode {episode.number}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div style={styles.modalFooter}>
                <button type="submit" className="btn-primary">
                  {editingMovieId ? 'Save changes' : 'Save title'}
                </button>
                <button type="button" className="btn-outline" onClick={closeModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: {
    padding: '32px 24px 56px',
    maxWidth: '1440px',
    margin: '0 auto',
  },
  deniedState: {
    minHeight: '70vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-main)',
    fontSize: '1.1rem',
    padding: '24px',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.7fr) minmax(280px, 0.9fr)',
    gap: '20px',
    marginBottom: '24px',
  },
  heroContent: {
    padding: '38px',
    borderRadius: '24px',
    background:
      'radial-gradient(circle at top left, rgba(212, 175, 55, 0.18), transparent 36%), linear-gradient(135deg, rgba(18, 18, 22, 0.96), rgba(11, 11, 14, 0.92))',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.28)',
  },
  kicker: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.05)',
    color: 'var(--gold-primary)',
    fontSize: '0.82rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '20px',
  },
  heroTitle: {
    fontSize: 'clamp(2rem, 4vw, 3.4rem)',
    lineHeight: 1.05,
    marginBottom: '14px',
  },
  heroText: {
    maxWidth: '700px',
    color: 'var(--text-muted)',
    fontSize: '1rem',
    lineHeight: 1.7,
  },
  heroPanel: {
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  heroPanelLabel: {
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontSize: '0.78rem',
  },
  heroPanelValue: {
    fontFamily: 'var(--font-serif)',
    fontSize: '2.4rem',
    color: 'var(--gold-primary)',
    margin: '12px 0',
  },
  heroPanelMeta: {
    color: 'var(--text-muted)',
    lineHeight: 1.6,
  },
  heroPills: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    marginTop: '24px',
  },
  livePill: {
    padding: '9px 12px',
    borderRadius: '999px',
    background: 'rgba(120, 211, 129, 0.12)',
    border: '1px solid rgba(120, 211, 129, 0.3)',
    color: '#9de6a2',
    fontSize: '0.85rem',
  },
  softPill: {
    padding: '9px 12px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.05)',
    color: 'var(--text-main)',
    fontSize: '0.85rem',
  },
  metricCard: {
    padding: '24px',
  },
  metricIconWrap: {
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    background: 'rgba(212, 175, 55, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--gold-primary)',
    marginBottom: '18px',
  },
  metricLabel: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    marginBottom: '10px',
  },
  metricValue: {
    fontSize: '2rem',
    fontWeight: 700,
    marginBottom: '8px',
  },
  metricNote: {
    color: 'var(--text-muted)',
    lineHeight: 1.55,
    fontSize: '0.92rem',
  },
  sectionCard: {
    padding: '24px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '20px',
  },
  sectionEyebrow: {
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontSize: '0.76rem',
    marginBottom: '8px',
  },
  sectionTitle: {
    fontSize: '1.5rem',
  },
  stack: {
    display: 'grid',
    gap: '12px',
  },
  alertCard: {
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid transparent',
  },
  alertNeutral: {
    background: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  alertWarning: {
    background: 'rgba(255, 184, 107, 0.08)',
    borderColor: 'rgba(255, 184, 107, 0.24)',
  },
  alertSuccess: {
    background: 'rgba(120, 211, 129, 0.08)',
    borderColor: 'rgba(120, 211, 129, 0.24)',
  },
  alertTitle: {
    fontWeight: 600,
    marginBottom: '6px',
  },
  alertText: {
    color: 'var(--text-muted)',
    lineHeight: 1.55,
    fontSize: '0.92rem',
  },
  workflowRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '18px',
    alignItems: 'center',
    padding: '14px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  workflowTitle: {
    fontWeight: 600,
    marginBottom: '4px',
  },
  workflowText: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    lineHeight: 1.5,
  },
  workflowValue: {
    whiteSpace: 'nowrap',
    color: 'var(--gold-primary)',
    fontWeight: 700,
  },
  launchRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  healthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '14px',
  },
  healthBlock: {
    padding: '18px',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  healthValue: {
    fontSize: '1.8rem',
    fontWeight: 700,
    marginBottom: '8px',
  },
  healthLabel: {
    color: 'var(--text-muted)',
    lineHeight: 1.5,
    fontSize: '0.9rem',
  },
  timeline: {
    display: 'grid',
    gap: '14px',
  },
  timelineItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    padding: '14px 0',
    color: 'var(--text-muted)',
    lineHeight: 1.55,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  catalogCard: {
    marginTop: '24px',
    padding: '24px',
  },
  addButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  loadingState: {
    padding: '28px 0 10px',
    color: 'var(--text-muted)',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '980px',
  },
  th: {
    textAlign: 'left',
    padding: '16px 14px',
    color: 'var(--text-muted)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    fontSize: '0.82rem',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
  },
  row: {
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  td: {
    padding: '16px 14px',
    verticalAlign: 'top',
  },
  titleCell: {
    display: 'flex',
    gap: '14px',
    minWidth: '320px',
  },
  posterThumb: {
    width: '52px',
    height: '74px',
    borderRadius: '12px',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--gold-primary)',
    flexShrink: 0,
  },
  posterImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  movieTitle: {
    fontWeight: 700,
    marginBottom: '6px',
  },
  movieMeta: {
    color: 'var(--text-muted)',
    fontSize: '0.88rem',
    lineHeight: 1.5,
    maxWidth: '360px',
  },
  tableBadge: (tone) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '7px 11px',
    borderRadius: '999px',
    fontSize: '0.78rem',
    whiteSpace: 'nowrap',
    border: '1px solid rgba(255,255,255,0.08)',
    background:
      tone === 'success'
        ? 'rgba(120, 211, 129, 0.1)'
        : tone === 'warning'
          ? 'rgba(255, 184, 107, 0.1)'
          : tone === 'info'
            ? 'rgba(111, 180, 255, 0.1)'
            : 'rgba(255,255,255,0.05)',
    color:
      tone === 'success'
        ? '#9de6a2'
        : tone === 'warning'
          ? '#ffcc8a'
          : tone === 'info'
            ? '#9dcbff'
            : 'var(--text-main)',
  }),
  deleteButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
  },
  editButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  activeDeleteButton: {
    color: '#ff8d8d',
    borderColor: 'rgba(255, 141, 141, 0.4)',
  },
  disabledDeleteButton: {
    color: 'var(--text-muted)',
    borderColor: 'rgba(255,255,255,0.12)',
    opacity: 0.6,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(6, 6, 8, 0.78)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 2000,
  },
  modalCard: {
    width: '100%',
    maxWidth: '860px',
    padding: '24px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '18px',
  },
  modalTitle: {
    fontSize: '1.6rem',
  },
  modalModeText: {
    color: 'var(--text-muted)',
    marginTop: '6px',
    fontSize: '0.9rem',
  },
  closeButton: {
    padding: '10px 16px',
  },
  modalFooter: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '18px',
    flexWrap: 'wrap',
  },
  fieldHint: {
    marginTop: '8px',
    color: 'var(--text-muted)',
    fontSize: '0.82rem',
    lineHeight: 1.5,
  },
  episodeEditorCard: {
    padding: '18px',
    marginTop: '18px',
  },
  episodeEditorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'flex-start',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  episodeEditorTitle: {
    fontWeight: 700,
    fontSize: '1rem',
  },
  episodeCounterBadge: {
    padding: '8px 12px',
    borderRadius: '999px',
    background: 'rgba(212, 175, 55, 0.12)',
    color: 'var(--gold-primary)',
    border: '1px solid rgba(212, 175, 55, 0.24)',
    fontSize: '0.85rem',
    fontWeight: 700,
  },
  episodeUrlField: {
    gridColumn: '1 / -1',
  },
  episodeActions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '4px',
  },
  savedEpisodesList: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    marginTop: '16px',
  },
  savedEpisodeChip: {
    padding: '9px 12px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--text-main)',
    border: '1px solid rgba(255,255,255,0.12)',
    cursor: 'pointer',
  },
};

export default AdminDashboard;
