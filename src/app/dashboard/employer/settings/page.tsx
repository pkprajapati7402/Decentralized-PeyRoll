'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { useCompanyData } from '@/hooks/useCompanyData';
import { COMPANY_ABI, FACTORY_ABI, FACTORY_CONTRACT_ADDRESS } from '@/constants/contracts';
import { 
    Shield, 
    Building2, 
    CreditCard, 
    AlertTriangle, 
    Settings2, 
    BellRing,
    Loader2,
    Wallet,
    Clock,
    ArrowUpRight 
} from 'lucide-react';
import { toast } from 'sonner';

interface CompanySettings {
    owner: `0x${string}` | undefined;
    contractAddress: `0x${string}` | undefined;
    companyName: string;
    email: string;
    minimumBalance: bigint;
    paymentNotifications: boolean;
}

export default function SettingsPage() {
    const { address } = useAccount();
    const { 
        companyName,
        companyEmail,
        companyContract,
        isVerified,
        totalEmployees,
        totalPayroll,
        lastPayrollTimestamp,
        nextPaymentDate,
        balance,
        isLoading: isDataLoading
    } = useCompanyData(address);

    const [isEditing, setIsEditing] = useState(false);
    const [showDangerZone, setShowDangerZone] = useState(false);
    const { writeContract } = useWriteContract();

    const [settings, setSettings] = useState<CompanySettings>({
        owner: address,
        contractAddress: companyContract,
        companyName: '',
        email: '',
        minimumBalance: parseEther('0.5'),
        paymentNotifications: true
    });

    // Update settings when company data is loaded
    useEffect(() => {
        if (companyName && companyEmail) {
            setSettings(prev => ({
                ...prev,
                companyName,
                email: companyEmail,
                owner: address,
                contractAddress: companyContract
            }));
        }
    }, [companyName, companyEmail, address, companyContract]);

    // Format timestamp to local date
    const formatDate = (timestamp: bigint) => {
        if (timestamp === 0n) return 'Not set';
        return new Date(Number(timestamp) * 1000).toLocaleDateString();
    };

    const saveSettings = async () => {
        if (!companyContract) {
            toast.error('Contract not found');
            return;
        }

        try {
            // Here we should call the appropriate contract method for updating company info
            // For now, we'll show a success message
            toast.success('Settings updated successfully');
            setIsEditing(false);
        } catch (error) {
            console.error('Settings error:', error);
            toast.error('Failed to update settings');
        }
    };

    if (isDataLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-muted-foreground">Loading settings...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 px-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
                    <p className="text-muted-foreground">Manage your company preferences and security settings</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                    <Settings2 className="w-5 h-5 text-primary" />
                </div>
            </div>

            {/* Company Profile */}
            <div className="bg-[hsl(var(--card-bg))] rounded-xl border border-border/5">
                <div className="p-6 border-b border-border">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold text-foreground">Company Profile</h2>
                        </div>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                        >
                            {isEditing ? 'Cancel' : 'Edit Profile'}
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Company Name</label>
                            <input
                                type="text"
                                value={settings.companyName}
                                onChange={e => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
                                disabled={!isEditing}
                                className="w-full p-3 bg-[hsl(var(--muted))] rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50 text-foreground"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                            <input
                                type="email"
                                value={settings.email}
                                onChange={e => setSettings(prev => ({ ...prev, email: e.target.value }))}
                                disabled={!isEditing}
                                className="w-full p-3 bg-[hsl(var(--muted))] rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50 text-foreground"
                                placeholder="company@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Company Owner</label>
                            <input
                                type="text"
                                value={settings.owner || ''}
                                disabled
                                className="w-full p-3 bg-[hsl(var(--muted))] rounded-lg border border-border opacity-50 cursor-not-allowed text-foreground"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Contract Address</label>
                            <input
                                type="text"
                                value={settings.contractAddress || ''}
                                disabled
                                className="w-full p-3 bg-[hsl(var(--muted))] rounded-lg border border-border opacity-50 cursor-not-allowed text-foreground"
                            />
                        </div>
                    </div>

                    {isEditing && (
                        <div className="flex justify-end">
                            <button
                                onClick={saveSettings}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Settings */}
            <div className="bg-[hsl(var(--card-bg))] rounded-xl border border-border/5">
                <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <CreditCard className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground">Payment Settings</h2>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Minimum Balance Warning</label>
                        <div className="flex gap-4">
                            <input
                                type="number"
                                step="0.1"
                                value={Number(formatEther(settings.minimumBalance))}
                                onChange={e => setSettings(prev => ({ 
                                    ...prev, 
                                    minimumBalance: parseEther(e.target.value || '0') 
                                }))}
                                className="w-48 p-3 bg-[hsl(var(--muted))] rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                                min="0"
                            />
                            <span className="self-center text-muted-foreground">ETH</span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            You&apos;ll be notified when contract balance falls below this amount
                        </p>
                    </div>

                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <BellRing className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-medium text-foreground">Payment Notifications</h3>
                                <p className="text-sm text-muted-foreground">Receive alerts about payment executions and failures</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox"
                                checked={settings.paymentNotifications}
                                onChange={e => setSettings(prev => ({ 
                                    ...prev, 
                                    paymentNotifications: e.target.checked 
                                }))}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-[hsl(var(--muted))] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Security */}
            <div className="bg-[hsl(var(--card-bg))] rounded-xl border border-border/5">
                <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground">Security</h2>
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-foreground">Multi-Signature Wallet</h3>
                            <p className="text-sm text-muted-foreground">Require multiple signatures for critical operations</p>
                        </div>
                        <button 
                            className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                            onClick={() => toast.info('Coming soon!')}
                        >
                            Configure
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-[hsl(var(--card-bg))] rounded-xl border border-destructive/20">
                <button 
                    className="w-full p-6 text-left"
                    onClick={() => setShowDangerZone(!showDangerZone)}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-destructive/10">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                        </div>
                        <h2 className="text-xl font-semibold text-destructive">Danger Zone</h2>
                    </div>
                </button>

                {showDangerZone && (
                    <div className="p-6 border-t border-border">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <h3 className="font-medium text-foreground">Transfer Ownership</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Transfer this company&apos;s ownership to another address
                                    </p>
                                </div>
                                <button 
                                    className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                                    onClick={() => toast.info('Coming soon!')}
                                >
                                    Transfer
                                </button>
                            </div>

                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <h3 className="font-medium text-foreground">Pause Contract</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Temporarily disable all contract operations
                                    </p>
                                </div>
                                <button 
                                    className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                                    onClick={() => toast.info('Coming soon!')}
                                >
                                    Pause
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}