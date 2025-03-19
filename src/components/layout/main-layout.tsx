'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/navbar';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith('/dashboard');

    return (
        <div className="relative flex min-h-screen flex-col">
            {!isDashboard && <Navbar />}
            <main className="flex-1">{children}</main>
        </div>
    );
}