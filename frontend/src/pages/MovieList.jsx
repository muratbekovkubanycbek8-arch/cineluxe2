import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import MovieCard from '../components/MovieCard';
import { mockMoviesData } from '../data/moviesData';
import { mergeMovieCollections, readLocalAdminMovies } from '../utils/localMovies';

const GENRE_ALL = 'all';

const genreOptions = [
  { key: GENRE_ALL, label: 'Все', aliases: [] },
  { key: 'fantasy', label: 'Фэнтези', aliases: ['fantasy', 'фэнтези', 'fantastika', 'фантастика', 'р¤р°рѕс‚р°сѓс‚рёрєр°'] },
  { key: 'horror', label: 'Ужасы', aliases: ['horror', 'ужасы', 'ужас', 'триллер', 'мистика', 'рЈр¶р°сѓс‹', 'рњрёсѓс‚рёрєр°'] },
  { key: 'action', label: 'Бой', aliases: ['action', 'боевик', 'бой', 'р‘рѕрµрірёрє'] },
  { key: 'adventure', label: 'Приключения', aliases: ['adventure', 'приключения', 'рџсђрёрєр»сћс‡рµрѕрёрї'] },
  { key: 'drama', label: 'Драма', aliases: ['drama', 'драма', 'р”сђр°рјр°'] },
  { key: 'anime', label: 'Аниме', aliases: ['anime', 'аниме', 'рђрѕрёрјрµ'] },
];

const normalizeText = (value) =>
  (value || '')
    .toString()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const matchesGenre = (movie, genreKey) => {
  if (genreKey === GENRE_ALL) return true;

  const genreConfig = genreOptions.find((genre) => genre.key === genreKey);
  if (!genreConfig) return true;

  const movieGenres = Array.isArray(movie.genres) ? movie.genres : [];

  return movieGenres.some((genre) => {
    const normalizedGenre = normalizeText(genre);
    return genreConfig.aliases.some((alias) => normalizedGenre.includes(normalizeText(alias)));
  });
};

const matchesSearch = (movie, searchTerm) => {
  if (!searchTerm) return true;

  const normalizedSearch = normalizeText(searchTerm);
  const haystack = [
    movie.title,
    movie.description,
    ...(Array.isArray(movie.genres) ? movie.genres : []),
    movie.releaseYear,
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalizedSearch);
};

const MovieList = () => {
  const [allMovies, setAllMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState(GENRE_ALL);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMovies = async () => {
      const localAdminMovies = readLocalAdminMovies();

      try {
        const { data } = await axios.get('http://localhost:5000/api/movies');
        setAllMovies(mergeMovieCollections(localAdminMovies, data, mockMoviesData));
      } catch (error) {
        console.error('Error fetching movies from backend', error);
        setAllMovies(mergeMovieCollections(localAdminMovies, mockMoviesData));
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const filteredMovies = useMemo(() => {
    return allMovies.filter((movie) => matchesGenre(movie, selectedGenre) && matchesSearch(movie, searchTerm));
  }, [allMovies, searchTerm, selectedGenre]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Каталог фильмов</h1>
        <p style={styles.subtitle}>Выберите жанр для фильтрации каталога.</p>
      </div>

      <div style={styles.controls}>
        <input
          type="text"
          className="input-field"
          placeholder="Поиск по названию, жанру или описанию"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          style={styles.searchInput}
        />

        <div style={styles.filterRow}>
          {genreOptions.map((genre) => (
            <button
              key={genre.key}
              style={{
                ...styles.filterBtn,
                backgroundColor: selectedGenre === genre.key ? 'var(--gold-primary)' : 'rgba(255,255,255,0.05)',
                color: selectedGenre === genre.key ? '#000' : '#fff',
              }}
              onClick={() => setSelectedGenre(genre.key)}
            >
              {genre.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={styles.loader}>Загрузка каталога...</div>
      ) : filteredMovies.length === 0 ? (
        <div style={styles.empty}>Ничего не найдено. Попробуйте другой жанр или другой запрос.</div>
      ) : (
        <div style={styles.grid}>
          {filteredMovies.map((movie) => (
            <MovieCard key={movie._id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '40px',
    minHeight: '80vh',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '20px',
    borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
    paddingBottom: '20px',
  },
  title: {
    color: 'var(--text-main)',
    fontSize: '2.5rem',
  },
  subtitle: {
    color: 'var(--text-muted)',
    marginTop: '10px',
  },
  controls: {
    marginBottom: '32px',
  },
  searchInput: {
    marginBottom: '18px',
  },
  filterRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '8px 20px',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.2)',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.2s',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '30px',
  },
  loader: {
    color: 'var(--gold-primary)',
    textAlign: 'center',
    fontSize: '1.2rem',
    marginTop: '50px',
  },
  empty: {
    color: 'var(--text-muted)',
    textAlign: 'center',
    fontSize: '1.2rem',
    marginTop: '50px',
    padding: '40px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: '10px',
  },
};

export default MovieList;
