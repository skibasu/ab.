export const icons = {
  alert: require('@/assets/svg/alert.svg'),
  arrowDown: require('@/assets/svg/arrow-down.svg'),
  back: require('@/assets/svg/back.svg'),
  books: require('@/assets/svg/books.svg'),
  check: require('@/assets/svg/check.svg'),
  close: require('@/assets/svg/close.svg'),
  filters: require('@/assets/svg/filters.svg'),
  import: require('@/assets/svg/import.svg'),
  next: require('@/assets/svg/next.svg'),
  pause: require('@/assets/svg/pause.svg'),
  play: require('@/assets/svg/play.svg'),
  recentlyListened: require('@/assets/svg/recenty-listened.svg'),
  search: require('@/assets/svg/search.svg'),
  settings: require('@/assets/svg/settings.svg'),
  sleep: require('@/assets/svg/sleep.svg'),
  timeBack: require('@/assets/svg/time-back.svg'),
  timeNext: require('@/assets/svg/time-next.svg'),
  unfinished: require('@/assets/svg/unfinished.svg'),
} as const;

export type IconName = keyof typeof icons;
