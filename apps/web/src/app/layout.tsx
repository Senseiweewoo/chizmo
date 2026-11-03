import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navigation/Navbar';
import { BottomNav } from '@/components/navigation/BottomNav';

export const metadata: Metadata = {
  title: 'Chizmo ⚡ | Make Studying Feel Like A Game',
  description:
    'Turn raw study material into high-yield flashcards, quizzes, and summaries with FSRS-4.5 spaced repetition and live multiplayer arenas.',
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
      </body>
    </html>
  );
}
