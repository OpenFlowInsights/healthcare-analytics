'use client';

import { SessionProvider } from 'next-auth/react';

/**
 * App Providers
 *
 * Note: React Query has been removed since all data is now fetched at build time (SSG).
 * Only SessionProvider remains for NextAuth authentication.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
