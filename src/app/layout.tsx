import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bug Hunt Arena — AI Creates the Crime, You Solve It',
  description:
    'A gamified debugging platform where AI generates buggy code challenges and you race to squash the bugs. Level up your debugging skills!',
  keywords: ['debugging', 'coding', 'game', 'python', 'learn', 'bug', 'AI'],
};

import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-arena antialiased">{children}</body>
      <Script src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js" strategy="beforeInteractive" />
    </html>
  );
}
