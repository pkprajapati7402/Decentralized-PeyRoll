'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useCompanyData } from '@/hooks/useCompanyData';
import DashboardStats from '@/components/dashboard/Stats';
import PayrollChart from '@/components/dashboard/PayrollChart';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { ethers } from 'ethers';
import { COMPANY_ABI } from '@/constants/contracts';

// Mock data for chart and activities
const mockPayrollData = [
    { month: 'Jan', amount: 30 },
    { month: 'Feb', amount: 35 },
    { month: 'Mar', amount: 32 },
    { month: 'Apr', amount: 40 },
    { month: 'May', amount: 38 },
    { month: 'Jun', amount: 45 },
];

const mockActivities = [
    {
        id: '1',
        type: 'payroll' as const,
        title: 'Monthly Payroll Executed',
        description: 'Successfully processed payments for 12 employees',
        timestamp: '2 hours ago'
    },
    {
        id: '2',
        type: 'employee' as const,
        title: 'New Employee Added',
        description: 'John Doe joined as Senior Developer',
        timestamp: '1 day ago'
    },
    {
        id: '3',
        type: 'deposit' as const,
        title: 'Funds Deposited',
        description: 'Added 5 ETH to contract balance',
        timestamp: '2 days ago'
    },
];

interface CompanyStats {
    totalEmployees: bigint;
    totalPayroll: bigint;
    totalEsopDistributed: bigint;
    lastPayrollTimestamp: bigint;
    nextPaymentDate: bigint;
    balance: bigint;
}

interface PaymentRecord {
    timestamp: bigint;
    amount: bigint;
    employee: string;
    success: boolean;
    notes: string;
}

export default function EmployerDashboardPage() {
    const { address } = useAccount();
    const { companyContract, isLoading: isLoadingCompanyData } = useCompanyData(address);
    const [isLoading, setIsLoading] = useState(true);
    const [companyStats, setCompanyStats] = useState<CompanyStats | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Initialize ethers contract
    const initContract = () => {
        if (!companyContract) return null;
        const provider = new ethers.BrowserProvider(window.ethereum);
        return new ethers.Contract(companyContract, COMPANY_ABI, provider);
    };

    const fetchDashboardData = async () => {
        if (!companyContract || !isClient) return;

        try {
            setIsLoading(true);
            const contract = initContract();
            if (!contract) return;

            // Fetch company stats
            const stats = await contract.getCompanyStats();
            
            setCompanyStats({
                totalEmployees: BigInt(stats[0].toString()),
                totalPayroll: BigInt(stats[1].toString()),
                totalEsopDistributed: BigInt(stats[2].toString()),
                lastPayrollTimestamp: BigInt(stats[3].toString()),
                nextPaymentDate: BigInt(stats[4].toString()),
                balance: BigInt(stats[5].toString())
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if(companyContract && isClient){
            fetchDashboardData();
        }
    }, [companyContract, isClient]);

    if (isLoading || !companyStats) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <DashboardStats 
                totalEmployees={Number(companyStats.totalEmployees)}
                totalPayroll={companyStats.totalPayroll}
                balance={companyStats.balance}
                nextPaymentDate={companyStats.nextPaymentDate}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <PayrollChart data={mockPayrollData} />
                <QuickActions 
                    companyContract={companyContract as `0x${string}`} 
                    onActionComplete={fetchDashboardData}
                />
            </div>

            <RecentActivity activities={mockActivities} />
        </div>
    );
}