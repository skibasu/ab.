import type { IconName } from './icons';

export const ROOT_STACK_OPTIONS = {
  headerShown: false,
  animation: 'fade',
  animationDuration: 250,
  animationTypeForReplace: 'push',
} as const;

export const APP_HEADERS: Record<
  'library' | 'playing' | 'search',
  { title: string; iconList: IconName[] }
> = {
  library: { title: 'Library', iconList: ['search', 'settings'] },
  playing: { title: 'Now Playing', iconList: ['settings'] },
  search: { title: 'Search', iconList: ['close'] },
};

export const HEADER_ICON_SIZES: Partial<Record<IconName, { width: number; height: number }>> = {
  close: { width: 14, height: 14 },
};
