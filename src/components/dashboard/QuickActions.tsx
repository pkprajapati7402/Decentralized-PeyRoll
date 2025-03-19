'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Coins, Wallet, Clock } from 'lucide-react';
import { useWriteContract, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { COMPANY_ABI } from '@/constants/contracts';
import { toast } from 'sonner';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { ethers } from 'ethers';

interface QuickActionsProps {
    companyContract: `0x${string}` | undefined;
    onActionComplete: () => Promise<void>;
}

export default function QuickActions({ companyContract, onActionComplete }: QuickActionsProps) {
    const router = useRouter();
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');

    const { writeContract } = useWriteContract();
    const { sendTransaction } = useSendTransaction();


    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!depositAmount || !companyContract) {
            toast.error('Invalid deposit amount or contract not found');
            return;
        }

         try {
            const provider = new ethers.BrowserProvider(window.ethereum);
             const signer = await provider.getSigner();
           
          
          const tx = await signer.sendTransaction({
                to: companyContract,
                value: parseEther(depositAmount)
          });
           
            await tx.wait();
            toast.success('Deposit initiated!');
            setShowDepositModal(false);
            setDepositAmount('');
           if (onActionComplete) {
                 await onActionComplete();
             }
        } catch (error: any) {
            toast.error('Failed to deposit funds');
           console.error('Deposit error:', error);
        }
    };


    const executePayroll = async () => {
        if (!companyContract) {
            toast.error('Company contract not found');
            return;
        }

        try {
             const provider = new ethers.BrowserProvider(window.ethereum);
             const signer = await provider.getSigner();
             const contract = new ethers.Contract(companyContract, COMPANY_ABI, signer);
          
           const tx = await contract.executePayroll();
            await tx.wait();
            toast.success('Payroll execution initiated');
         if (onActionComplete) {
              await onActionComplete();
          }
        } catch (error: any) {
            toast.error('Failed to execute payroll');
            console.error('Payroll error:', error);
        }
    };

    return (
        <>
            <div className="bg-[hsl(var(--card-bg))] rounded-2xl p-6 border border-border/5" data-aos="fade-up">
                <h3 className="text-xl font-semibold mb-6 text-foreground">Quick Actions</h3>
                <div className="space-y-4">
                    <button
                        onClick={() => setShowDepositModal(true)}
                        className="w-full p-4 bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <Wallet className="w-5 h-5 text-primary" />
                            <div>
                                <div className="font-medium text-foreground">Deposit Funds</div>
                                <div className="text-sm text-muted-foreground">Add funds to contract</div>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={executePayroll}
                        className="w-full p-4 bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <Coins className="w-5 h-5 text-primary" />
                            <div>
                                <div className="font-medium text-foreground">Execute Payroll</div>
                                <div className="text-sm text-muted-foreground">Process monthly payments</div>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => router.push('/dashboard/employer/employees')}
                        className="w-full p-4 bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-primary" />
                            <div>
                                <div className="font-medium text-foreground">Add Employee</div>
                                <div className="text-sm text-muted-foreground">Add new team member</div>
                            </div>
                        </div>
                    </button>

                    <button
                         onClick={() => router.push('/dashboard/employer/payments')}
                        className="w-full p-4 bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-primary" />
                            <div>
                                <div className="font-medium text-foreground">Schedule Payment</div>
                                <div className="text-sm text-muted-foreground">Set future payments</div>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Deposit Modal */}
            {showDepositModal && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[hsl(var(--card-bg))] p-6 rounded-xl w-full max-w-md border border-border/5">
                        <h2 className="text-xl font-semibold mb-4 text-foreground">Deposit Funds</h2>
                        <form onSubmit={handleDeposit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Amount (ETH)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    className="w-full p-3 bg-[hsl(var(--muted))] rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-foreground border border-border/5"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDepositModal(false)}
                                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted/50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                                >
                                    Deposit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}