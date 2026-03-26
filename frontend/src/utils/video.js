const ensureProtocol = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^data:/i.test(trimmed)) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return `https://${trimmed}`;
};

export const normalizeVideoUrl = (value) => ensureProtocol(value || '');

export const getYouTubeVideoId = (value) => {
  if (!value) return '';

  try {
    const normalized = ensureProtocol(value);
    const url = new URL(normalized);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      return url.pathname.split('/').filter(Boolean)[0] || '';
    }

    if (host.includes('youtube.com')) {
      if (url.searchParams.get('v')) return url.searchParams.get('v');

      const parts = url.pathname.split('/').filter(Boolean);
      const supportedPrefixes = ['embed', 'shorts', 'live', 'v'];
      if (supportedPrefixes.includes(parts[0])) {
        return parts[1] || '';
      }
    }
  } catch {
    return '';
  }

  return '';
};

export const getPlayableVideoSource = (value) => {
  const normalizedUrl = normalizeVideoUrl(value);
  if (!normalizedUrl) return { type: 'empty', src: '' };

  const youtubeId = getYouTubeVideoId(normalizedUrl);
  if (youtubeId) {
    return {
      type: 'youtube',
      src: `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`,
    };
  }

  return {
    type: 'file',
    src: normalizedUrl,
  };
};
