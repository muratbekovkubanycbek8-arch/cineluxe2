export const LOCAL_ADMIN_MOVIES_KEY = 'localAdminMovies';
export const LOCAL_DELETED_MOVIES_KEY = 'localDeletedMovieIds';

export const readLocalAdminMovies = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ADMIN_MOVIES_KEY) || '[]');
  } catch {
    return [];
  }
};

export const saveLocalAdminMovies = (movies) => {
  localStorage.setItem(LOCAL_ADMIN_MOVIES_KEY, JSON.stringify(movies));
};

export const readDeletedMovieIds = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_DELETED_MOVIES_KEY) || '[]');
  } catch {
    return [];
  }
};

export const saveDeletedMovieIds = (movieIds) => {
  localStorage.setItem(LOCAL_DELETED_MOVIES_KEY, JSON.stringify(movieIds));
};

export const mergeMovieCollections = (...collections) => {
  const deletedIds = new Set(readDeletedMovieIds());
  const merged = [];
  const seen = new Set();

  collections.flat().forEach((movie) => {
    if (!movie?._id || deletedIds.has(movie._id) || seen.has(movie._id)) return;
    seen.add(movie._id);
    merged.push(movie);
  });

  return merged;
};
