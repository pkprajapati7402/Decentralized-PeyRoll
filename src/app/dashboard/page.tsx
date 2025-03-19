'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useReadContract } from 'wagmi';
import { FACTORY_ABI, FACTORY_CONTRACT_ADDRESS, COMPANY_ABI } from '@/constants/contracts';
import { ethers } from 'ethers';

export default function DashboardPage() {
    const router = useRouter();
    const { address, isConnected } = useAccount();
    const [isClient, setIsClient] = useState(false);
    const [redirected, setRedirected] = useState(false);
    const [employeeStatus, setEmployeeStatus] = useState<boolean | null>(null);
    
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Check if address is a company owner
    const { data: isCompanyOwner, isLoading: isLoadingCompany } = useReadContract({
        address: FACTORY_CONTRACT_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'isCompany',
        args: address ? [address] : undefined, // Fix: Only provide args when address exists
        query: {
            enabled: !!address && isClient, // Fix: Use query.enabled instead of enabled
        },
    });

    // Get all companies
    const { data: allCompanies, isLoading: isLoadingAllCompanies } = useReadContract({
        address: FACTORY_CONTRACT_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'getAllCompanies',
        query: {
            enabled: isClient, // Fix: Use query.enabled
        },
    });

    // Get company info
    const { data: companyInfo, isLoading: isLoadingCompanyInfo } = useReadContract({
        address: FACTORY_CONTRACT_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'getCompanyInfo',
        args: address ? [address] : undefined, // Fix: Only provide args when address exists
        query: {
            enabled: !!address && isClient, // Fix: Use query.enabled
        },
    });

    // Check employee status
    useEffect(() => {
        const checkEmployeeStatus = async () => {
            if (!address || !isClient || !companyInfo?.payrollContract) return;

            try {
                // Make sure ethereum is defined in window
                if (!window.ethereum) {
                    console.error('Ethereum object not found');
                    return;
                }
                
                const provider = new ethers.BrowserProvider(window.ethereum);
                const contract = new ethers.Contract(
                    companyInfo.payrollContract,
                    COMPANY_ABI,
                    provider
                );

                const isEmployee = await contract.isEmployee(address);
                console.log('Employee status:', isEmployee);
                setEmployeeStatus(isEmployee);
            } catch (error) {
                console.error('Error checking employee status:', error);
                setEmployeeStatus(false);
            }
        };

        checkEmployeeStatus();
    }, [address, isClient, companyInfo]);

    // Handle redirections
    useEffect(() => {
        const handleRedirect = async () => {
            if (redirected || !isClient) return;

            console.log('Debug Info:', {
                isConnected,
                address,
                isCompanyOwner,
                employeeStatus,
                isLoadingCompany,
                isLoadingCompanyInfo,
                companyInfo
            });

            // Wait for loading states
            if (isLoadingCompany || isLoadingCompanyInfo) {
                return;
            }

            // Not connected -> Register
            if (!isConnected) {
                console.log('Not connected, redirecting to register');
                router.push('/register');
                setRedirected(true);
                return;
            }

            // Employee -> Employee Dashboard
            if (employeeStatus === true) {
                console.log('User is an employee, redirecting to employee dashboard');
                router.push('/dashboard/employee');
                setRedirected(true);
                return;
            }

            // Company Owner -> Employer Dashboard
            if (isCompanyOwner === true) {
                console.log('User is a company owner, redirecting to employer dashboard');
                router.push('/dashboard/employer');
                setRedirected(true);
                return;
            }

            // Neither -> Register
            console.log('User is not registered, redirecting to register');
            router.push('/register');
            setRedirected(true);
        };

        handleRedirect();
    }, [
        isConnected,
        router,
        isLoadingCompany,
        isClient,
        redirected,
        address,
        employeeStatus,
        isCompanyOwner,
        isLoadingCompanyInfo
    ]);

    return (
        <div className="fixed inset-0 bg-[hsl(var(--background))]">
            <div className="relative flex min-h-screen flex-col items-center justify-center">
                {/* Gradient blur effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-[40vh] left-[50%] h-[80vh] w-[80vh] -translate-x-[50%] rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 blur-[100px]" />
                </div>

                {/* Loading content */}
                <div className="relative flex flex-col items-center gap-6" data-aos="fade-up">
                    {/* Logo animation */}
                    <div className="relative h-24 w-24">
                        <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
                        <div className="absolute inset-[6px] rounded-full border-t-2 border-primary/80 animate-spin" style={{ animationDuration: '2s' }} />
                        <div className="absolute inset-[12px] rounded-full border-t-2 border-primary/60 animate-spin" style={{ animationDuration: '3s' }} />
                        
                        {/* Center logo or icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg" />
                        </div>
                    </div>

                    {/* Loading text */}
                    <div className="flex flex-col items-center gap-2">
                        <h2 className="text-xl font-semibold text-foreground">
                            Peyroll
                        </h2>
                        <p className="text-muted-foreground animate-pulse">
                            Initializing your dashboard...
                        </p>
                    </div>

                    {/* Debug info */}
                    <div className="text-xs text-muted-foreground mt-4">
                    </div>
                </div>
            </div>
        </div>
    );
}