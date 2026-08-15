import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IELTS Computer-Delivered Mock Exam Platform',
  description: 'Authentic CDI IELTS Exam Simulation and Preparation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased overflow-hidden">{children}</body>
    </html>
  );
}
