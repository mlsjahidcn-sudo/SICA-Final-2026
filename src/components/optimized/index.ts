// Optimized Components - Memoized for performance

export { UniversityCard, UniversityCardSkeleton } from './university-card';
export type { UniversityCardData } from './university-card';

export { ProgramCard, ProgramCardSkeleton } from './program-card';
export type { ProgramCardData } from './program-card';

export { ApplicationCard, ApplicationCardSkeleton } from './application-card';
export type { ApplicationCardData } from './application-card';

export { VirtualList, VirtualGrid } from './virtual-list';

// Lazy loading utilities
export {
  LazyLoad,
  LazyComponent,
  LazyPlaceholder,
  LazyCardPlaceholder,
  LazyListPlaceholder,
  useLazyLoad,
  usePreloadOnHover,
} from './lazy-load';

export {
  createDynamicComponent,
  LazySection,
  LazyGrid,
} from './lazy-components';
