import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'greek'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Secret Wall',
  description: 'Σύγχρονος, ανώνυμος τοίχος σκέψεων & εξομολογήσεων.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="el">
      <body
        className={`${inter.variable} font-sans min-h-screen flex flex-col antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

