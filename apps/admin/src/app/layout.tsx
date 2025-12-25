import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientProviders from '@/components/ClientProviders';
// import AdminLayout from './AdminLayout'; // Removed unused import

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'LifePartner AI - Admin Panel',
    description: 'Administration Dashboard',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <ClientProviders>
                    {children}
                </ClientProviders>
            </body>
        </html>
    );
}
