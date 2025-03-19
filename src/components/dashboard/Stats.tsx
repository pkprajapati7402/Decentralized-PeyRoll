'use client';

import { formatEther } from 'viem';
import { ArrowUpRight, Users, Coins, Wallet, Clock } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';

interface StatsProps {
    totalEmployees: number;
    totalPayroll: bigint;
    balance: bigint;
    nextPaymentDate: bigint | undefined;
}

export default function DashboardStats({
    totalEmployees,
    totalPayroll,
    balance,
    nextPaymentDate
}: StatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" >
            <div className="bg-[hsl(var(--card-bg))] rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/10 transition-all border border-border/5" data-aos="fade-up">
                <div className="flex justify-between items-start">
                    <div className="bg-primary/10 p-3 rounded-xl">
                        <Users className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-emerald-500 flex items-center text-sm">
                        +12.5% <ArrowUpRight className="w-4 h-4" />
                    </span>
                </div>
                <div className="mt-4">
                    <h3 className="text-lg text-muted-foreground">Total Employees</h3>
                    <p className="text-3xl font-bold mt-1 text-foreground">{totalEmployees}</p>
                </div>
            </div>

            <div className="bg-[hsl(var(--card-bg))] rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/10 transition-all border border-border/5" data-aos="fade-up" data-aos-delay="100">
                <div className="flex justify-between items-start">
                    <div className="bg-primary/10 p-3 rounded-xl">
                        <Coins className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-emerald-500 flex items-center text-sm">
                        +5.2% <ArrowUpRight className="w-4 h-4" />
                    </span>
                </div>
                <div className="mt-4">
                    <h3 className="text-lg text-muted-foreground">Monthly Payroll</h3>
                    <p className="text-3xl font-bold mt-1 text-foreground">
                        {formatEther(totalPayroll || 0n).substring(0, 8)} ETH
                    </p>
                </div>
            </div>

            <div className="bg-[hsl(var(--card-bg))] rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/10 transition-all border border-border/5" data-aos="fade-up" data-aos-delay="200">
                <div className="flex justify-between items-start">
                    <div className="bg-primary/10 p-3 rounded-xl">
                        <Wallet className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-red-500 flex items-center text-sm">
                        -2.4% <ArrowUpRight className="w-4 h-4" />
                    </span>
                </div>
                <div className="mt-4">
                    <h3 className="text-lg text-muted-foreground">Contract Balance</h3>
                    <p className="text-3xl font-bold mt-1 text-foreground">
                        {formatEther(balance || 0n).substring(0, 8)} ETH
                    </p>
                </div>
            </div>

             <div className="bg-[hsl(var(--card-bg))] rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/10 transition-all border border-border/5" data-aos="fade-up" data-aos-delay="300">
                 <div className="flex justify-between items-start">
                     <div className="bg-primary/10 p-3 rounded-xl">
                         <Clock className="w-6 h-6 text-primary" />
                     </div>
                 </div>
                 <div className="mt-4">
                     <h3 className="text-lg text-muted-foreground">Next Payment</h3>
                    <p className="text-3xl font-bold mt-1 text-foreground">
                        {nextPaymentDate ? new Date(Number(nextPaymentDate) * 1000).toLocaleDateString() : 'Not Set'}
                     </p>
                 </div>
             </div>
        </div>
    );
}