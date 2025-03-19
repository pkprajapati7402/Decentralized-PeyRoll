'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { useCompanyData } from '@/hooks/useCompanyData';
import { COMPANY_ABI } from '@/constants/contracts';
import {
    Coins, Users, ArrowUpRight, Filter, PieChart, LineChart,
    Search, Plus, AlertCircle, CheckCircle2, X, User, Info, Calendar, Clock, Activity,
    LucideIcon
} from 'lucide-react';
import { toast } from 'sonner';
import Aos from 'aos';
import 'aos/dist/aos.css';
import { ethers } from 'ethers';

interface ESOPDetails {
    name: string;
    symbol: string;
    totalSupply: bigint;
    distributed: bigint;
}

interface ESOPDistributionFormData {
    employeeAddress: string;
    amount: string;
}

interface DistributionHistoryItem {
    employee: string;
    amount: string;
    grantDate: string;
    vested: string;
    status: string;
}

interface Employee {
    name: string;
    email: string;
    wallet: `0x${string}`;
    salary: bigint;
    lastPaid: bigint;
    joinedAt: bigint;
    esopTokens: bigint;
    active: boolean;
    totalPaid: bigint;
}

interface StatCardProps {
    icon: LucideIcon;
    title: string;
    value: string | number;
    subValue?: string;
    change?: string;
    chartValue?: number;
}

// Stats card component with proper typing
function StatCard({ icon: Icon, title, value, subValue, change, chartValue }: StatCardProps) {
    return (
        <div
            className="relative overflow-hidden bg-[hsl(var(--muted))] rounded-xl p-6 transition-transform duration-300 hover:scale-[1.02]"
            data-aos="fade-up"
        >
            <div className="flex justify-between items-start">
                <div className="bg-primary/10 p-3 rounded-xl">
                    <Icon className="w-6 h-6 text-primary" />
                </div>
                {change && (
                    <span className="text-emerald-500 flex items-center text-sm">
                        {change} <ArrowUpRight className="w-4 h-4" />
                    </span>
                )}
            </div>
            <div className="mt-4">
                <h3 className="text-lg text-muted-foreground">{title}</h3>
                <p className="text-3xl font-bold mt-1 text-foreground">{value}</p>
                {subValue && <p className="text-sm text-muted-foreground mt-1">{subValue}</p>}
                {chartValue !== undefined && (
                    <div className="w-full bg-[hsl(var(--card-bg))] rounded-full h-2 mt-2">
                        <div
                            className="bg-primary h-2 rounded-full transition-all duration-500"
                            style={{ width: `${chartValue}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}


export default function ESOPSPage() {
    const { address } = useAccount();
    const { companyContract, totalEmployees } = useCompanyData(address);
    const [showDistributeModal, setShowDistributeModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [distributionForm, setDistributionForm] = useState<ESOPDistributionFormData>({
        employeeAddress: '',
        amount: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [distributionHistory, setDistributionHistory] = useState<DistributionHistoryItem[]>([]);
    const [showCustomAddress, setShowCustomAddress] = useState(false);
    const [employeesData, setEmployeesData] = useState<Employee[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [modalLoading, setModalLoading] = useState(false)


    // Initialize animations
    useEffect(() => {
        Aos.init({
            duration: 800,
            once: false,
            easing: 'ease-in-out',
            mirror: false,
            offset: 50
        });
        setIsClient(true)
    }, []);

    // Initialize ethers contract
    const initContract = () => {
        if (!companyContract) return null;
        const provider = new ethers.BrowserProvider(window.ethereum);
        return new ethers.Contract(companyContract, COMPANY_ABI, provider);
    };

    // Fetch employee data
    const fetchEmployees = async () => {
        try {
            const contract = initContract();
            if (!contract) return;

            setIsLoading(true);

            // Get all employee addresses
            const addresses = await contract.getAllEmployees();

            // Fetch details for each employee
            const employeePromises = addresses.map(async (addr: string) => {
                try {
                    const emp = await contract.employees(addr);
                    return {
                        name: emp[0],
                        email: emp[1],
                        wallet: addr as `0x${string}`,
                        salary: BigInt(emp[3].toString()),
                        lastPaid: BigInt(emp[4].toString()),
                        joinedAt: BigInt(emp[5].toString()),
                        esopTokens: BigInt(emp[6].toString()),
                        active: emp[7],
                        totalPaid: BigInt(emp[8].toString())
                    };
                } catch (error) {
                    console.error('Error fetching employee details:', error);
                    return null;
                }
            });

            const employees = await Promise.all(employeePromises);
            const activeEmployees = employees.filter((emp): emp is Employee =>
                emp !== null && emp.active
            );

            setEmployeesData(activeEmployees);
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error('Failed to fetch employees', {
                duration: 5000,
                className: 'bg-destructive text-white shadow-lg',
                position: 'top-center',
                closeButton: true,

            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (companyContract && isClient) {
            fetchEmployees();
        }
    }, [companyContract, isClient]);


    // Contract read hooks at component level
    const { data: esopDetails, isError: esopDetailsError, isLoading: esopDetailsLoading } = useReadContract({
        address: companyContract || undefined,
        abi: COMPANY_ABI,
        functionName: 'esopTokens',
    } as const) as { data: ESOPDetails | undefined, isError: boolean, isLoading: boolean };

    const { data: totalEsopDistributed, isError: totalEsopError, isLoading: totalEsopLoading } = useReadContract({
        address: companyContract,
        abi: COMPANY_ABI,
        functionName: 'totalEsopDistributed',
    } as const) as { data: bigint | undefined, isError: boolean, isLoading: boolean };

    // Update loading state based on contract data loading states
    useEffect(() => {
        setIsLoading(esopDetailsLoading || totalEsopLoading);
    }, [esopDetailsLoading, totalEsopLoading]);

    const handleDistributeTokens = (e: React.FormEvent) => {
        e.preventDefault();
        if (!distributionForm.employeeAddress || !distributionForm.amount) {
            toast.error('Please fill all the required fields.');
            return;
        }

        const newDistributionItem: DistributionHistoryItem = {
            employee: distributionForm.employeeAddress,
            amount: distributionForm.amount,
            grantDate: new Date().toISOString().split('T')[0],
            vested: '0',
            status: 'Pending',
        };

        setDistributionHistory(prev => [...prev, newDistributionItem]);
        setDistributionForm({ employeeAddress: '', amount: '' });
        setShowDistributeModal(false);
        toast.success('Tokens distributed successfully');
    };

    // Filter ESOP distribution history
    const filteredDistributionHistory = distributionHistory.filter(item =>
        item.employee.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Helper function to get error message
    function getErrorMessage(error: any): string {
        if (error?.code === 4001) {
            return 'Transaction rejected by user';
        } else if (error?.message?.includes('insufficient funds')) {
            return 'Insufficient funds for transaction';
        }
        return 'Operation failed. Please try again.';
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (esopDetailsError || totalEsopError) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl font-semibold text-red-500">
                    Failed to Load ESOP Data. Please try again later
                </div>
            </div>
        );
    }

    const handleOpenModal = () => {
        setModalLoading(true);
        setShowDistributeModal(true);
        // Simulate loading time to make sure esopDetails have been retrieved
        setTimeout(() => {
            setModalLoading(false)
        }, 500);
    }

    return (
        <div className="space-y-6 px-6">
            {/* Header Section */}
            <div className="flex justify-between items-center" data-aos="fade-down">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">ESOP Management</h1>
                    <p className="text-muted-foreground">Manage employee stock options</p>
                </div>
                <button
                    onClick={handleOpenModal}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    data-aos="fade-left"
                    data-aos-delay="100"
                >
                    <Plus className="w-4 h-4" />
                    Distribute Tokens
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-aos="fade-up">
                <StatCard
                    icon={Coins}
                    title="Total ESOP Supply"
                    value={esopDetails && esopDetails.totalSupply ? formatEther(esopDetails.totalSupply) : '0'}
                    subValue={esopDetails?.symbol || 'ESOP'}
                    change="+5.2%"
                    chartValue={0}
                />
                <StatCard
                    icon={PieChart}
                    title="Tokens Distributed"
                    value={totalEsopDistributed ? formatEther(totalEsopDistributed) : '0'}
                    subValue="Tokens"
                    change="+2.1%"
                    chartValue={esopDetails && totalEsopDistributed ?
                        Number(totalEsopDistributed) / Number(esopDetails.totalSupply) * 100 : 0}
                />
                <StatCard
                    icon={Users}
                    title="Participating Employees"
                    value={totalEmployees || 0}
                    subValue="Employees"
                    change="+1.2%"
                    chartValue={0}
                />
            </div>

            {/* ESOP Distribution Table */}
            <div className="bg-[hsl(var(--card-bg))] rounded-xl border border-border/5" data-aos="fade-up">
                <div className="p-6 border-b border-border">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">Distribution History</h2>
                            <p className="text-muted-foreground">Track ESOP allocations and vesting progress</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search employee..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-[hsl(var(--card-bg))] rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                                />
                            </div>
                            <button
                                onClick={() => toast.info('Advanced filtering coming soon')}
                                className="p-2 hover:bg-primary/5 rounded-lg transition-colors"
                            >
                                <Filter className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-left">Employee</th>
                                <th className="px-6 py-4 text-sm font-semibold text-left">Allocation</th>
                                <th className="px-6 py-4 text-sm font-semibold text-left">Grant Date</th>
                                <th className="px-6 py-4 text-sm font-semibold text-left">Vested</th>
                                <th className="px-6 py-4 text-sm font-semibold text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredDistributionHistory.length > 0 ? (
                                filteredDistributionHistory.map((item, index) => (
                                    <tr key={index} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 text-foreground">
                                            <code className="text-sm text-foreground/80">
                                                {`${item.employee.slice(0, 6)}...${item.employee.slice(-4)}`}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4 text-foreground">{item.amount}</td>
                                        <td className="px-6 py-4 text-foreground">{item.grantDate}</td>
                                        <td className="px-6 py-4 text-foreground">{item.vested}</td>
                                        <td className="px-6 py-4 text-foreground">{item.status}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Activity className="w-8 h-8 text-muted-foreground/50" />
                                            <p className="text-muted-foreground font-medium">No distribution history found</p>
                                            <p className="text-sm text-muted-foreground">
                                                No ESOP tokens have been distributed yet
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Distribute Tokens Modal */}
            {showDistributeModal && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div
                        className="bg-[hsl(var(--card-bg))] p-8 rounded-xl w-full max-w-md border border-border/5 shadow-xl"
                        data-aos="zoom-in"
                        data-aos-duration="300"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">Distribute ESOP Tokens</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Grant tokens to an employee
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDistributeModal(false)}
                                className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 text-destructive" />
                            </button>
                        </div>

                        {modalLoading ? (
                            <div className="flex justify-center items-center py-12">
                                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                            ) : (
                                <form onSubmit={handleDistributeTokens} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="employeeAddress" className="block text-sm font-medium text-foreground">
                                            Employee Address
                                        </label>

                                        <div className='relative'>
                                            <select
                                                id="employeeAddress"
                                                className="w-full p-3 bg-[hsl(var(--muted))] rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                                                value={distributionForm.employeeAddress}
                                                onChange={(e) => {
                                                    setDistributionForm(prev => ({
                                                        ...prev,
                                                        employeeAddress: e.target.value
                                                    }));
                                                    setShowCustomAddress(e.target.value === 'custom');
                                                }}
                                            >
                                                <option value="">Select Employee</option>
                                                {employeesData && employeesData.map((employee) => (
                                                    <option key={employee.wallet} value={employee.wallet}>
                                                        {`${employee.wallet.slice(0, 6)}...${employee.wallet.slice(-4)}`}
                                                    </option>
                                                ))}
                                                <option value='custom'>Custom address</option>
                                            </select>
                                            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                        </div>
                                    </div>
                                    {showCustomAddress && (
                                        <div className="space-y-2">
                                            <label htmlFor="customEmployeeAddress" className="block text-sm font-medium text-foreground">
                                                Custom Employee Address
                                            </label>
                                            <div className="relative">
                                                <input
                                                    id="customEmployeeAddress"
                                                    type="text"
                                                    value={distributionForm.employeeAddress}
                                                    onChange={e => setDistributionForm(prev => ({
                                                        ...prev,
                                                        employeeAddress: e.target.value
                                                    }))}
                                                    className="w-full p-3 bg-[hsl(var(--muted))] rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                                                    placeholder="0x..."
                                                    required
                                                />
                                                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label htmlFor="tokenAmount" className="block text-sm font-medium text-foreground">
                                            Token Amount
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="tokenAmount"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={distributionForm.amount}
                                                onChange={e => setDistributionForm(prev => ({
                                                    ...prev,
                                                    amount: e.target.value
                                                }))}
                                                className="w-full p-3 bg-[hsl(var(--muted))] rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                                                required
                                            />
                                            <Coins className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                        </div>
                                        {esopDetails && esopDetails.totalSupply && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Info className="w-3 h-3" />
                                            Available: {formatEther(esopDetails.totalSupply)} tokens
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowDistributeModal(false)}
                                        className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-foreground"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                                    >
                                        <Coins className="w-4 h-4" />
                                        Distribute Tokens
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}