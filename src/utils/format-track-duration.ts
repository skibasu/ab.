import { formatDuration } from './format-duration';

export function formatTrackDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return '—';

  const duration = formatDuration(seconds);
  return seconds < 3600 ? duration.slice(3) : duration;
}
