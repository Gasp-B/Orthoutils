export const dynamic = 'force-dynamic';

import type { ReactNode } from 'react';
import './globals.css';

type RootLayoutProps = {
  children: ReactNode;
};

function RootLayout({ children }: RootLayoutProps) {
  return children;
}

export default RootLayout;
