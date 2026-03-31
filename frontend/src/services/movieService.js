import axios from 'axios';
import { mockMoviesData } from '../data/moviesData';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import {
  mergeMovieCollections,
  readDeletedMovieIds,
  readLocalAdminMovies,
  saveDeletedMovieIds,
  saveLocalAdminMovies,
} from '../utils/localMovies';

const API_URL = 'http://localhost:5000/api';

const normalizeMovie = (movie) => ({
  _id: movie._id || movie.id,
  title: movie.title || '',
  releaseYear: Number(movie.releaseYear ?? movie.release_year) || new Date().getFullYear(),
  rating: Number(movie.rating) || 0,
  genres: Array.isArray(movie.genres) ? movie.genres : [],
  posterUrl: movie.posterUrl ?? movie.poster_url ?? '',
  videoUrl: movie.videoUrl ?? movie.video_url ?? '',
  episodeCount: Number(movie.episodeCount ?? movie.episode_count) || 0,
  episodes: Array.isArray(movie.episodes) ? movie.episodes : [],
  description: movie.description || '',
  createdBy: movie.createdBy ?? movie.created_by ?? null,
});

const toSupabaseMovie = (movie, userId) => ({
  title: movie.title,
  release_year: Number(movie.releaseYear) || new Date().getFullYear(),
  rating: Number(movie.rating) || 0,
  genres: Array.isArray(movie.genres) ? movie.genres : [],
  poster_url: movie.posterUrl || '',
  video_url: movie.videoUrl || '',
  episode_count: Number(movie.episodeCount) || 0,
  episodes: Array.isArray(movie.episodes) ? movie.episodes : [],
  description: movie.description || '',
  created_by: userId || null,
  is_deleted: false,
});

export const fetchCatalogMovies = async () => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(normalizeMovie);
  }

  const localAdminMovies = readLocalAdminMovies();

  try {
    const { data } = await axios.get(`${API_URL}/movies`);
    return mergeMovieCollections(localAdminMovies, data, mockMoviesData).map(normalizeMovie);
  } catch {
    return mergeMovieCollections(localAdminMovies, mockMoviesData).map(normalizeMovie);
  }
};

export const fetchMovieById = async (id, token) => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) throw error;
    return data ? normalizeMovie(data) : null;
  }

  const localMovie = mergeMovieCollections(readLocalAdminMovies(), mockMoviesData).find((movie) => movie._id === id);
  if (localMovie) return normalizeMovie(localMovie);

  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const { data } = await axios.get(`${API_URL}/movies/${id}`, config);
  return normalizeMovie(data);
};

export const saveMovieRecord = async ({ movie, movieId, userToken, userId }) => {
  if (isSupabaseConfigured && supabase) {
    if (movieId) {
      const { data, error } = await supabase
        .from('movies')
        .update(toSupabaseMovie(movie, userId))
        .eq('id', movieId)
        .select()
        .single();

      if (error) throw error;
      return normalizeMovie(data);
    }

    const { data, error } = await supabase
      .from('movies')
      .insert(toSupabaseMovie(movie, userId))
      .select()
      .single();

    if (error) throw error;
    return normalizeMovie(data);
  }

  const config = userToken ? { headers: { Authorization: `Bearer ${userToken}` } } : {};

  if (movieId) {
    const currentLocal = readLocalAdminMovies().find((item) => item._id === movieId);
    const isLocalMovie = typeof movieId === 'string' && movieId.startsWith('local-');
    const isMockMovie = typeof movieId === 'string' && movieId.length < 5;

    if (isLocalMovie || isMockMovie) {
      const updatedMovie = normalizeMovie({ ...(currentLocal || {}), ...movie, _id: movieId });
      const otherMovies = readLocalAdminMovies().filter((item) => item._id !== movieId);
      saveLocalAdminMovies([updatedMovie, ...otherMovies]);
      saveDeletedMovieIds(readDeletedMovieIds().filter((id) => id !== movieId));
      return updatedMovie;
    }

    try {
      const { data } = await axios.put(`${API_URL}/movies/${movieId}`, movie, config);
      saveLocalAdminMovies(readLocalAdminMovies().filter((item) => item._id !== movieId));
      saveDeletedMovieIds(readDeletedMovieIds().filter((id) => id !== movieId));
      return normalizeMovie(data);
    } catch (error) {
      if (!error.response) {
        const fallbackMovie = normalizeMovie({ ...(currentLocal || {}), ...movie, _id: movieId });
        const otherMovies = readLocalAdminMovies().filter((item) => item._id !== movieId);
        saveLocalAdminMovies([fallbackMovie, ...otherMovies]);
        saveDeletedMovieIds(readDeletedMovieIds().filter((id) => id !== movieId));
        return fallbackMovie;
      }

      throw error;
    }
  }

  try {
    const { data } = await axios.post(`${API_URL}/movies`, movie, config);
    saveDeletedMovieIds(readDeletedMovieIds().filter((id) => id !== data._id));
    return normalizeMovie(data);
  } catch {
    const fallbackMovie = normalizeMovie({
      ...movie,
      _id: `local-${Date.now()}`,
    });
    saveLocalAdminMovies([fallbackMovie, ...readLocalAdminMovies()]);
    return fallbackMovie;
  }
};

export const deleteMovieRecord = async ({ movieId, userToken, isMock }) => {
  if (isMock) {
    throw new Error('Demo titles are locked and cannot be deleted.');
  }

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('movies').update({ is_deleted: true }).eq('id', movieId);
    if (error) throw error;
    return;
  }

  if (typeof movieId === 'string' && movieId.startsWith('local-')) {
    saveLocalAdminMovies(readLocalAdminMovies().filter((movie) => movie._id !== movieId));
    saveDeletedMovieIds(readDeletedMovieIds().filter((id) => id !== movieId));
    return;
  }

  try {
    const config = userToken ? { headers: { Authorization: `Bearer ${userToken}` } } : {};
    await axios.delete(`${API_URL}/movies/${movieId}`, config);
    saveLocalAdminMovies(readLocalAdminMovies().filter((movie) => movie._id !== movieId));
    saveDeletedMovieIds(readDeletedMovieIds().filter((id) => id !== movieId));
  } catch (error) {
    if (!error.response) {
      saveDeletedMovieIds(Array.from(new Set([...readDeletedMovieIds(), movieId])));
      saveLocalAdminMovies(readLocalAdminMovies().filter((movie) => movie._id !== movieId));
      return;
    }

    throw error;
  }
};
