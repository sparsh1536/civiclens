import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CivicLens — See beyond the promises',
  description: 'Evidence-led political accountability and governance intelligence for India.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
