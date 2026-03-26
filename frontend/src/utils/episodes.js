const animeEpisodePresets = {
  '21': 290,
  '22': 89,
  '23': 55,
  '24': 26,
  '25': 1100,
  '26': 366,
  '27': 47,
  '28': 48,
  '29': 37,
  '30': 1,
  '31': 148,
  '32': 12,
  '33': 27,
  '34': 26,
  '35': 138,
  '36': 13,
  '37': 25,
  '38': 10,
  '39': 85,
  '40': 64,
};

const titleEpisodeHints = [
  { match: ['naruto', 'наруто', 'рќр°сђсѓс‚рѕ'], count: 290 },
  { match: ['attack on titan', 'атака титанов', 'рђс‚р°рєр° с‚рёс‚р°рѕрѕрІ'], count: 89 },
  { match: ['one piece', 'ван пис', 'р’р°рѕ рџрёсѓ'], count: 1100 },
  { match: ['bleach', 'блич', 'р‘р»рёс‡'], count: 366 },
  { match: ['hunter x hunter', 'охотник x охотник', 'рћс…рѕс‚рѕрёрє'], count: 148 },
];

const normalizeText = (value) => (value || '').toString().trim().toLowerCase();

export const isAnimeMovie = (movie) => {
  if (!movie) return false;

  const genres = Array.isArray(movie.genres) ? movie.genres : [];
  return genres.some((genre) => {
    const normalizedGenre = normalizeText(genre);
    return (
      normalizedGenre.includes('anime') ||
      normalizedGenre.includes('аниме') ||
      normalizedGenre.includes('рђрѕрёрјрµ')
    );
  });
};

const getPresetEpisodeCount = (movie) => {
  if (!movie) return 0;

  if (animeEpisodePresets[movie._id]) {
    return animeEpisodePresets[movie._id];
  }

  const normalizedTitle = normalizeText(movie.title);
  const titleHint = titleEpisodeHints.find((hint) =>
    hint.match.some((value) => normalizedTitle.includes(value))
  );

  return titleHint?.count || 0;
};

export const getEpisodeList = (movie) => {
  if (!movie) return [];

  if (Array.isArray(movie.episodes) && movie.episodes.length > 0) {
    return movie.episodes.map((episode, index) => ({
      id: episode.id || `episode-${index + 1}`,
      number: episode.number || index + 1,
      title: episode.title || `Episode ${index + 1}`,
      videoUrl: episode.videoUrl || movie.videoUrl || '',
    }));
  }

  const explicitCount = Number(movie.episodeCount) || 0;
  const presetCount = getPresetEpisodeCount(movie);
  const fallbackCount = isAnimeMovie(movie) ? 24 : 0;
  const totalEpisodes = explicitCount || presetCount || fallbackCount;

  return Array.from({ length: totalEpisodes }, (_, index) => ({
    id: `${movie._id || 'title'}-episode-${index + 1}`,
    number: index + 1,
    title: `Episode ${index + 1}`,
    videoUrl: movie.videoUrl || '',
  }));
};
