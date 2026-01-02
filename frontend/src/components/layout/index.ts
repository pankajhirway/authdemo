/**
 * Layout components index.
 *
 * Exports all layout components for convenient importing.
 *
 * @example
 * import { MainLayout, Header, Footer, Navigation } from '@/components/layout';
 */

export { Header, HeaderSkeleton } from "./Header";
export type { HeaderProps } from "./Header";

export { Navigation, NavigationSkeleton } from "./Navigation";
export type { NavigationProps } from "./Navigation";

export { Footer, FooterSkeleton, CompactFooter } from "./Footer";
export type { FooterProps } from "./Footer";

export {
  MainLayout,
  MainLayoutSkeleton,
  CompactLayout,
  CenteredLayout,
} from "./MainLayout";
export type { MainLayoutProps } from "./MainLayout";
