'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { ethers } from 'ethers';
import { COMPANY_ABI } from '@/constants/contracts';
import { 
    Wallet, 
    Coins, 
    Clock,
    CalendarDays,
    Building2,
    ArrowUpRight,
    CircleDollarSign,
    TrendingUp
} from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';

interface EmployeeData {
    name: string;
    email: string;
    wallet: string;
    salary: bigint;
    lastPaid: bigint;
    joinedAt: bigint;
    esopTokens: bigint;
    active: boolean;
    totalPaid: bigint;
}

interface PaymentRecord {
    timestamp: bigint;
    amount: bigint;
    employee: string;
    success: boolean;
    notes: string;
}

export default function EmployeeDashboardPage() {
    const { address } = useAccount();
    const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
    const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        AOS.init({
            duration: 800,
            once: false,
        });
    }, []);

    // Initialize ethers contract
    const initContract = () => {
        // This would need to be implemented to find which company the employee belongs to
        if (!address) return null;
        const provider = new ethers.BrowserProvider(window.ethereum);
        // We need to implement a way to find the employee's company contract
        return provider;
    };

    const fetchEmployeeData = async () => {
        if (!address || !isClient) return;

        try {
            setIsLoading(true);
            const contract = initContract();
            if (!contract) return;

            // TODO: Implement actual contract calls to get employee data
            // For now using mock data
            const mockData: EmployeeData = {
                name: "John Doe",
                email: "john@example.com",
                wallet: address,
                salary: BigInt(2000000000000000000n), // 2 ETH
                lastPaid: BigInt(Date.now() / 1000 - 86400 * 7), // 7 days ago
                joinedAt: BigInt(Date.now() / 1000 - 86400 * 30), // 30 days ago
                esopTokens: BigInt(1000000000000000000n), // 1 ESOP token
                active: true,
                totalPaid: BigInt(6000000000000000000n) // 6 ETH total
            };

            setEmployeeData(mockData);

            // Mock recent payments
            const mockPayments: PaymentRecord[] = [
                {
                    timestamp: BigInt(Date.now() / 1000 - 86400 * 7),
                    amount: BigInt(2000000000000000000n),
                    employee: address,
                    success: true,
                    notes: "Monthly salary"
                },
                {
                    timestamp: BigInt(Date.now() / 1000 - 86400 * 37),
                    amount: BigInt(2000000000000000000n),
                    employee: address,
                    success: true,
                    notes: "Monthly salary"
                }
            ];

            setRecentPayments(mockPayments);

        } catch (error) {
            console.error('Error fetching employee data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (address && isClient) {
            fetchEmployeeData();
        }
    }, [address, isClient]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const formatDate = (timestamp: bigint) => {
        return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center" data-aos="fade-down">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">
                        Welcome Back{employeeData?.name ? `, ${employeeData.name}` : ''}!
                    </h1>
                    <p className="text-muted-foreground">Here's your employment overview</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="w-5 h-5 text-primary" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-aos="fade-up">
                {/* Current Salary */}
                <div className="bg-[hsl(var(--card-bg))] rounded-xl border border-border/5 p-6">
                    <div className="flex justify-between">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Wallet className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-emerald-500 flex items-center gap-1 text-sm">
                            Active <ArrowUpRight className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-muted-foreground">Monthly Salary</h3>
                        <p className="text-2xl font-semibold mt-1">
                            {employeeData?.salary ? formatEther(employeeData.salary) : '0'} ETH
                        </p>
                    </div>
                </div>

                {/* ESOP Balance */}
                <div className="bg-[hsl(var(--card-bg))] rounded-xl border border-border/5 p-6">
                    <div className="flex justify-between">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Coins className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-emerald-500 flex items-center gap-1 text-sm">
                            Vested <TrendingUp className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-muted-foreground">ESOP Balance</h3>
                        <p className="text-2xl font-semibold mt-1">
                            {employeeData?.esopTokens ? formatEther(employeeData.esopTokens) : '0'} Tokens
                        </p>
                    </div>
                </div>

                {/* Total Earned */}
                <div className="bg-[hsl(var(--card-bg))] rounded-xl border border-border/5 p-6">
                    <div className="flex justify-between">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <CircleDollarSign className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-muted-foreground">Total Earned</h3>
                        <p className="text-2xl font-semibold mt-1">
                            {employeeData?.totalPaid ? formatEther(employeeData.totalPaid) : '0'} ETH
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent Payments */}
            <div className="bg-[hsl(var(--card-bg))] rounded-xl border border-border/5" data-aos="fade-up">
                <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground">Recent Payments</h2>
                    </div>
                </div>

                <div className="p-6">
                    <div className="space-y-4">
                        {recentPayments.map((payment, index) => (
                            <div 
                                key={index}
                                className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                                data-aos="fade-up"
                                data-aos-delay={100 * index}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Wallet className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">Salary Payment</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDate(payment.timestamp)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-medium text-foreground">
                                        {formatEther(payment.amount)} ETH
                                    </span>
                                    {payment.success ? (
                                        <div className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-xs rounded-full">
                                            Success
                                        </div>
                                    ) : (
                                        <div className="px-2 py-1 bg-destructive/10 text-destructive text-xs rounded-full">
                                            Failed
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        
                        {recentPayments.length === 0 && (
                            <div className="text-center py-8">
                                <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-3">
                                    <Clock className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="font-medium text-foreground">No Recent Payments</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Your payment history will appear here
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Work History */}
            <div className="bg-[hsl(var(--card-bg))] rounded-xl border border-border/5" data-aos="fade-up">
                <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <CalendarDays className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground">Work History</h2>
                    </div>
                </div>

                <div className="p-6">
                    <div className="relative flex items-center gap-4 pl-4">
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
                        <div className="w-2 h-2 rounded-full bg-primary absolute left-[-3px]" />
                        <div>
                            <h3 className="font-medium text-foreground">Joined Company</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {employeeData?.joinedAt ? formatDate(employeeData.joinedAt) : 'Unknown'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}