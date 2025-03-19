'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useCompanyData } from '@/hooks/useCompanyData';
import { COMPANY_ABI } from '@/constants/contracts';
import { 
    Calendar, Clock, CreditCard, ArrowUpRight, Filter, 
    CheckCircle2, AlertCircle, DollarSign, Banknote, 
    CreditCard as CreditCardIcon, Search, ArrowUpDown,
    Wallet, Info, X, FileText, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { ethers } from 'ethers';
import { GenerateStatement } from '@/components/PayrollStatement';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Define core interfaces for type safety
interface PaymentRecord {
    timestamp: bigint;
    amount: bigint;
    employee: `0x${string}`;
    success: boolean;
    notes: string;
}

interface SchedulePaymentFormData {
    date: string;
    time: string;
}

interface Feature {
    title: string;
    description: string;
    eta: string;
    features: string[];
}

// Define payment methods with detailed feature information
const PAYMENT_METHODS = [
    { 
        id: 'fiat',
        title: 'Pay in Fiat',
        icon: DollarSign,
        description: 'Pay in local currency with automatic conversion',
        eta: 'Q2 2025',
        features: [
            'Support for 150+ global currencies',
            'Real-time exchange rate conversion',
            'Automatic tax calculations',
            'Compliance documentation'
        ]
    },
    { 
        id: 'bank',
        title: 'Bank Transfer',
        icon: Banknote,
        description: 'Direct deposit to employee bank accounts worldwide',
        eta: 'Q3 2025',
        features: [
            'International wire transfers',
            'Local bank network integration',
            'Automated reconciliation',
            'Transaction tracking'
        ]
    },
    {
        id: 'crypto-card',
        title: 'Crypto Card',
        icon: CreditCardIcon,
        description: 'Issue virtual crypto cards for web3-native expenses',
        eta: 'Q4 2025',
        features: [
            'Instant crypto to fiat conversion',
            'Decentralized expense tracking',
            'Smart contract spending limits',
            'Multi-chain support'
        ]
    }
];

export default function PaymentsPage() {
    // State management
    const { address } = useAccount();
    const { companyContract, companyName, companyEmail, totalEmployees } = useCompanyData(address);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalPayroll, setTotalPayroll] = useState<bigint>(0n);
    const [balance, setBalance] = useState<bigint>(0n);
    const [nextPaymentDate, setNextPaymentDate] = useState<bigint>(0n);
    const [isClient, setIsClient] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [scheduleForm, setScheduleForm] = useState<SchedulePaymentFormData>({
        date: '',
        time: ''
    });

    // Initialize animations
    useEffect(() => {
        setIsClient(true);
        AOS.init({
            duration: 800,
            once: false,
        });
    }, []);

    // Contract initialization
    const initContract = () => {
        if (!companyContract) return null;
        const provider = new ethers.BrowserProvider(window.ethereum);
        return new ethers.Contract(companyContract, COMPANY_ABI, provider);
    };

    // Data fetching
    const fetchPaymentData = async () => {
        try {
            const contract = initContract();
            if (!contract) return;

            setIsLoading(true);

            // Fetch data in parallel for better performance
            const [paymentHistory, stats] = await Promise.all([
                contract.getPaymentHistory(),
                contract.getCompanyStats()
            ]);

            // Format payment history data
            const formattedHistory: PaymentRecord[] = paymentHistory.map((payment: any) => ({
                timestamp: BigInt(payment.timestamp.toString()),
                amount: BigInt(payment.amount.toString()),
                employee: payment.employee as `0x${string}`,
                success: payment.success,
                notes: payment.notes
            }));

            // Update all state values
            setPaymentHistory(formattedHistory);
            setTotalPayroll(BigInt(stats[1].toString()));
            setBalance(BigInt(stats[5].toString()));
            setNextPaymentDate(BigInt(stats[4].toString()));
        } catch (error) {
            console.error('Error fetching payment data:', error);
            toast.error('Failed to fetch payment data', {
                duration: 5000,
                className: 'bg-destructive text-white shadow-lg',
                position: 'top-center',
                closeButton: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch data when contract is available
    useEffect(() => {
        if (companyContract && isClient) {
            fetchPaymentData();
        }
    }, [companyContract, isClient]);

    // Execute payroll with loading state and error handling
    const executePayroll = async () => {
        if (!companyContract) {
            toast.error('Company contract not found');
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(companyContract, COMPANY_ABI, signer);

            toast.promise(
                (async () => {
                    const tx = await contract.executePayroll();
                    await tx.wait();
                    await fetchPaymentData();
                })(),
                {
                    loading: 'Executing payroll...',
                    success: 'Payroll executed successfully',
                    error: 'Failed to execute payroll'
                }
            );
        } catch (error: any) {
            let errorMessage = 'Failed to execute payroll';
            if (error?.code === 4001) {
                errorMessage = 'Transaction rejected by user';
            } else if (error?.message?.includes('insufficient funds')) {
                errorMessage = 'Insufficient funds for transaction';
            }
            console.error('Payroll error:', error);
            toast.error(errorMessage, {
                duration: 5000,
                className: 'bg-destructive text-white shadow-lg',
                position: 'top-center',
                closeButton: true,
            });
        }
    };

    // Schedule next payment with validation
    const schedulePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyContract) return;

        try {
            const timestamp = Math.floor(new Date(`${scheduleForm.date}T${scheduleForm.time}`).getTime() / 1000);
            
            if (timestamp <= Date.now() / 1000) {
                toast.error('Please select a future date and time');
                return;
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(companyContract, COMPANY_ABI, signer);

            toast.promise(
                (async () => {
                    const tx = await contract.scheduleNextPayment(BigInt(timestamp));
                    await tx.wait();
                    await fetchPaymentData();
                    setShowScheduleModal(false);
                })(),
                {
                    loading: 'Scheduling payment...',
                    success: 'Payment scheduled successfully',
                    error: 'Failed to schedule payment'
                }
            );
        } catch (error: any) {
            console.error('Schedule error:', error);
            toast.error('Failed to schedule payment', {
                duration: 5000,
                className: 'bg-destructive text-white shadow-lg',
                position: 'top-center',
                closeButton: true,
            });
        }
    };

    // Calculate time until next payment
    const getTimeUntilNextPayment = () => {
        if (nextPaymentDate === 0n) return 'Not scheduled';
        
        const now = Math.floor(Date.now() / 1000);
        const nextPaymentTime = Number(nextPaymentDate);
        
        if (nextPaymentTime <= now) return 'Due now';
        
        const diff = nextPaymentTime - now;
        const days = Math.floor(diff / (24 * 60 * 60));
        const hours = Math.floor((diff % (24 * 60 * 60)) / (60 * 60));
        
        return `${days}d ${hours}h`;
    };

    // Filter payments based on search
    const filteredPayments = paymentHistory.filter(payment =>
        payment.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.notes.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 px-6">
            {/* Header Section */}
            <div className="flex justify-between items-center" data-aos="fade-down">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Payments</h1>
                    <p className="text-muted-foreground">Manage and schedule payments</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowScheduleModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--muted))] text-foreground rounded-lg hover:bg-primary/10 transition-colors"
                        data-aos="fade-left"
                        data-aos-delay="100"
                    >
                        <Calendar className="w-4 h-4" />
                        Schedule
                    </button>
                    <button
                        onClick={executePayroll}
                        disabled={Number(balance) < Number(totalPayroll)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        data-aos="fade-left"
                        data-aos-delay="200"
                    >
                        <CreditCard className="w-4 h-4" />
                        Execute Payroll
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-aos="fade-up">
                {/* Monthly Payroll */}
                <div className="relative overflow-hidden bg-[hsl(var(--muted))] rounded-xl p-6 transition-transform duration-300 hover:scale-[1.02]">
                    <div className="flex justify-between items-start">
                        <div className="bg-primary/10 p-3 rounded-xl">
                            <CreditCard className="w-6 h-6 text-primary" />
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="mt-4">
                        <h3 className="text-lg text-muted-foreground">Monthly Payroll</h3>
                        <p className="text-3xl font-bold mt-1 text-foreground">
                            {formatEther(totalPayroll).substring(0, 8)} ETH
                        </p>
                    </div>
                </div>

                {/* Next Payment */}
                <div className="relative overflow-hidden bg-[hsl(var(--muted))] rounded-xl p-6 transition-transform duration-300 hover:scale-[1.02]">
                    <div className="flex justify-between items-start">
                        <div className="bg-primary/10 p-3 rounded-xl">
                            <Clock className="w-6 h-6 text-primary" />
                        </div>
                        <span className="flex items-center gap-1 text-sm text-emerald-500">
                            {nextPaymentDate > 0n ? 'Scheduled' : 'Not Scheduled'} 
                            <CheckCircle2 className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-lg text-muted-foreground">Next Payment</h3>
                        <p className="text-3xl font-bold mt-1 text-foreground">
                            {getTimeUntilNextPayment()}
                        </p>
                    </div>
                </div>

                {/* Balance */}
                <div className="relative overflow-hidden bg-[hsl(var(--muted))] rounded-xl p-6 transition-transform duration-300 hover:scale-[1.02]">
                    <div className="flex justify-between items-start">
                        <div className="bg-primary/10 p-3 rounded-xl">
                            <Wallet className="w-6 h-6 text-primary" />
                        </div>
                        <span className={`flex items-center gap-1 text-sm ${
                            Number(balance) >= Number(totalPayroll) ? 'text-emerald-500' : 'text-destructive'
                        }`}>
                            {Number(balance) >= Number(totalPayroll) ? (
                                <>Sufficient <CheckCircle2 className="w-4 h-4" /></>
                            ) : (
                                <>Insufficient <AlertCircle className="w-4 h-4" /></>
                            )}
                        </span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-lg text-muted-foreground">Available Balance</h3>
                        <p className="text-3xl font-bold mt-1 text-foreground">
                            {formatEther(balance).substring(0, 8)} ETH
                        </p>
                    </div>
                </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-[hsl(var(--card-bg))] rounded-xl p-6 border border-border/5" data-aos="fade-up">
            <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Payment Methods</h2>
                        <p className="text-muted-foreground">Choose how to pay your employees</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {PAYMENT_METHODS.map((method, index) => (
                            <div
                                key={method.id}
                                onClick={() => setSelectedFeature(method)}
                                data-aos="fade-up"
                                data-aos-delay={index * 100}
                                className="group cursor-pointer relative p-6 bg-[hsl(var(--muted))] rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-transparent hover:border-primary/10"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-primary/10 rounded-xl transition-transform duration-300 group-hover:scale-110">
                                        <method.icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-foreground">{method.title}</div>
                                        <p className="text-sm text-muted-foreground mt-1">{method.description}</p>
                                        <span className="inline-block mt-3 text-xs px-3 py-1 bg-primary/10 text-primary rounded-full">
                                            Coming {method.eta}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Transaction History Section */}
            <div className="bg-[hsl(var(--card-bg))] rounded-xl border border-border/5">
                <div className="p-6 border-b border-border">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">Transaction History</h2>
                            <p className="text-muted-foreground">View and track all payment transactions</p>
                        </div>
                        <div className="flex items-center gap-3">
                             {/* Render the GenerateStatement component only when companyContract is available */}
                            {companyContract && (
                                <GenerateStatement
                                    companyName={companyName}
                                    companyEmail={companyEmail}
                                    companyContract={companyContract}
                                    totalEmployees={totalEmployees}
                                    totalPayroll={formatEther(totalPayroll)}
                                    nextPayment={getTimeUntilNextPayment()}
                                    transactions={paymentHistory}
                                />
                            )}
                            <button 
                                onClick={() => setSelectedFeature({
                                    title: 'Advanced Filtering',
                                    description: 'Filter and analyze payment history',
                                    eta: 'Q2 2025',
                                    features: [
                                        'Filter by date range',
                                        'Search by employee',
                                        'Export filtered results',
                                        'Custom views and presets'
                                    ]
                                })}
                                className="p-2 hover:bg-primary/5 rounded-lg transition-colors"
                            >
                                <Filter className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>
                    </div>

                    {/* Search & Filter */}
                    <div className="flex gap-4 mt-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[hsl(var(--card-bg))] rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                            />
                        </div>
                        <button className="px-4 py-2 bg-[hsl(var(--card-bg))] rounded-lg border border-border hover:bg-primary/10 transition-colors">
                            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-left">Date</th>
                                <th className="px-6 py-4 text-sm font-semibold text-left">Employee</th>
                                <th className="px-6 py-4 text-sm font-semibold text-left">Amount</th>
                                <th className="px-6 py-4 text-sm font-semibold text-left">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-left">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredPayments.length > 0 ? (
                                filteredPayments.map((payment, index) => (
                                    <tr 
                                        key={index} 
                                        className="hover:bg-muted/30 transition-colors"
                                    >
                                        <td className="px-6 py-4 text-foreground">
                                            {new Date(Number(payment.timestamp) * 1000).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-sm text-foreground/80">
                                                {`${payment.employee.slice(0, 6)}...${payment.employee.slice(-4)}`}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4 text-foreground">
                                            {formatEther(payment.amount)} ETH
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                                                payment.success 
                                                    ? 'bg-emerald-500/10 text-emerald-500' 
                                                    : 'bg-destructive/10 text-destructive'
                                            }`}>
                                                {payment.success ? (
                                                    <>
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Success
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle className="w-3 h-3" />
                                                        Failed
                                                    </>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {payment.notes}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Activity className="w-8 h-8 text-muted-foreground/50" />
                                            <p className="text-muted-foreground font-medium">No transactions found</p>
                                            <p className="text-sm text-muted-foreground">
                                                {searchTerm 
                                                    ? 'No transactions match your search criteria' 
                                                    : 'Execute your first payroll to see transactions here'
                                                }
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Feature Preview Modal */}
            {selectedFeature && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div 
                        className="bg-[hsl(var(--card-bg))] p-8 rounded-xl w-full max-w-md border border-border/5"
                        data-aos="zoom-in"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-semibold text-foreground">{selectedFeature.title}</h2>
                                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                        Coming {selectedFeature.eta}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {selectedFeature.description}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedFeature(null)}
                                className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 text-destructive" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {selectedFeature.features.map((feature, index) => (
                                <div 
                                    key={index}
                                    className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg"
                                    data-aos="fade-up"
                                    data-aos-delay={index * 100}
                                >
                                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                                    <span className="text-sm text-foreground">{feature}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 mt-4 border-t border-border">
                            <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 text-primary mt-1" />
                                <p className="text-xs text-muted-foreground">
                                    We'll notify you when this feature becomes available for your account.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Payment Modal */}
            {showScheduleModal && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div 
                        className="bg-[hsl(var(--card-bg))] p-8 rounded-xl w-full max-w-md border border-border/5"
                        data-aos="zoom-in"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">Schedule Next Payment</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Select when you want the next payroll to execute
                                </p>
                            </div>
                            <button
                                onClick={() => setShowScheduleModal(false)}
                                className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 text-destructive" />
                            </button>
                        </div>

                        <form onSubmit={schedulePayment} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-foreground">
                                        Payment Date
                                    </label>
                                    <input
                                        type="date"
                                        value={scheduleForm.date}
                                        onChange={e => setScheduleForm(prev => ({ 
                                            ...prev, 
                                            date: e.target.value 
                                        }))}
                                        className="w-full p-3 bg-[hsl(var(--muted))] rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-foreground">
                                        Payment Time
                                    </label>
                                    <input
                                        type="time"
                                        value={scheduleForm.time}
                                        onChange={e => setScheduleForm(prev => ({ 
                                            ...prev, 
                                            time: e.target.value 
                                        }))}
                                        className="w-full p-3 bg-[hsl(var(--muted))] rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="bg-primary/5 p-4 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <Info className="w-4 h-4 text-primary mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Important Note</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Ensure sufficient funds are available in the contract before the scheduled time to prevent payment failures.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowScheduleModal(false)}
                                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-foreground"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    Schedule Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper function to generate error message based on error type
function getErrorMessage(error: any): string {
    if (error?.code === 4001) {
        return 'Transaction rejected by user';
    } else if (error?.message?.includes('insufficient funds')) {
        return 'Insufficient funds for transaction';
    }
    return 'Operation failed. Please try again.';
}