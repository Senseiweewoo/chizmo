import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/navigation/Navbar';
import { BottomNav } from '@/components/navigation/BottomNav';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';

export const viewport: Viewport = {
  themeColor: '#6366F1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Chizmo ⚡ | Make Studying Feel Like A Game',
  description:
    'Turn raw study material into high-yield flashcards, quizzes, and summaries with FSRS-4.5 spaced repetition and live multiplayer arenas.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/icon-192.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Chizmo',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased pb-20 md:pb-6">
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        <BottomNav />
        <OfflineIndicator />
      </body>
    </html>
  );
}
