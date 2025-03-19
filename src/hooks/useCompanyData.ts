// src/hooks/useCompanyData.ts
'use client';

import { useReadContract } from 'wagmi';
import { FACTORY_ABI, FACTORY_CONTRACT_ADDRESS, COMPANY_ABI } from '@/constants/contracts';

// Define types for our contract responses
interface CompanyInfo {
    companyName: string;
    email: string;
    isVerified: boolean;
    esopTokens: bigint;
    esopTokenName: string;
    esopTokenSymbol: string;
    payrollContract: `0x${string}`;
    createdAt: bigint;
}

type CompanyStats = readonly [
    totalEmployees: bigint,
    totalPayroll: bigint,
    totalEsopDistributed: bigint,
    lastPayrollTimestamp: bigint,
    nextPaymentDate: bigint,
    balance: bigint
];

export function useCompanyData(address: `0x${string}` | undefined) {
    // Get company info from factory
    const { data: companyInfo, isLoading: isLoadingCompany } = useReadContract({
        address: FACTORY_CONTRACT_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'getCompanyInfo',
        args: address ? [address] : undefined,
    });

    // Get company stats from company contract
    const { data: companyStats, isLoading: isLoadingStats } = useReadContract({
        address: companyInfo?.payrollContract,
        abi: COMPANY_ABI,
        functionName: 'getCompanyStats',
    });

    const stats = companyStats as CompanyStats | undefined;

    return {
        companyName: companyInfo?.companyName || '',
        companyEmail: companyInfo?.email || '',
        isVerified: companyInfo?.isVerified || false,
        companyContract: companyInfo?.payrollContract,
        totalEmployees: Number(stats?.[0] || 0n),
        totalPayroll: stats?.[1] || 0n,
        lastPayrollTimestamp: stats?.[3] || 0n,
        nextPaymentDate: stats?.[4] || 0n,
        balance: stats?.[5] || 0n,
        isLoading: isLoadingCompany || isLoadingStats,
    };
}