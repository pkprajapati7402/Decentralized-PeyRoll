'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Wallet, ClipboardList, Coins, Settings, Home, Building2 } from 'lucide-react';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useTheme } from 'next-themes';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { ThemeToggle } from '@/components/theme-toggle';

const navigationItems = [
    { label: 'Dashboard', icon: Building2, href: '/dashboard/employee' },
    { label: 'Payment History', icon: ClipboardList, href: '/dashboard/employee/payments' },
    { label: 'ESOP Status', icon: Coins, href: '/dashboard/employee/esops' },
    { label: 'Settings', icon: Settings, href: '/dashboard/employee/settings' }
];

export default function EmployeeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { address, isConnected } = useAccount();
    const { companyName, companyContract } = useCompanyData(address);
    const { theme } = useTheme();

    useEffect(() => {
        AOS.init({
            duration: 800,
            once: false,
        });
    }, []);

    useEffect(() => {
        if (!isConnected) {
            router.push('/');
            return;
        }

        if (isConnected && !companyContract) {
            router.push('/register');
        }
    }, [isConnected, companyContract, router]);

    if (!isConnected || !companyContract) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[hsl(var(--dashboard-bg))] overflow-hidden">
            <div className="flex h-screen">
                {/* Sidebar */}
                <aside className="fixed left-0 top-0 h-screen w-72 bg-[hsl(var(--sidebar-bg))] backdrop-blur-xl border-r border-border/40 flex flex-col">
                    <div className="flex justify-between items-center p-6">
                        {/* Company Name & Employee Status */}
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] bg-clip-text text-transparent">
                                {companyName || 'Loading...'}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">Employee Portal</p>
                        </div>
                        <ThemeToggle />
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
                        {navigationItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                                        ${isActive 
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                                            : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'
                                        }
                                    `}
                                >
                                    <div className={`
                                        ${isActive ? 'bg-white/20' : 'bg-[hsl(var(--card-bg))]'} 
                                        p-2 rounded-lg
                                    `}>
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Connected Wallet */}
                    <div className="p-4 mx-3 mb-3 bg-[hsl(var(--card-bg))] rounded-xl">
                        <div className="text-xs text-muted-foreground mb-1">Connected Wallet</div>
                        <code className="text-sm text-foreground/80 break-all">{address}</code>
                    </div>

                    {/* Back to Home Button */}
                    <Link 
                        href="/"
                        className="mx-3 mb-6 p-4 flex items-center gap-3 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-xl transition-all"
                    >
                        <div className="bg-[hsl(var(--card-bg))] p-2 rounded-lg">
                            <Home className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Back to Home</span>
                    </Link>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 ml-72 p-8 bg-gradient-to-b from-[hsl(var(--dashboard-bg))] to-[hsl(var(--card-bg))] overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}