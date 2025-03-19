'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWatchContractEvent } from 'wagmi';
import { parseEther } from 'viem';
import { Building2, Coins, Mail, Text } from 'lucide-react';
import { toast } from 'sonner';
import { CheckCircle, Sparkles } from 'lucide-react';
import OktoVerification from '@/components/auth/OktoVerification';
import { FACTORY_ABI, FACTORY_CONTRACT_ADDRESS } from '@/constants/contracts';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Type definitions
interface RegisterFormData {
    companyName: string;
    email: string;
    esopTokens: string;
    esopTokenName: string;
    esopTokenSymbol: string;
}

interface OtpErrorState {
    count: number;
    message: string;
}

// Text wave effect component with hydration safety
const TextWaveEffect = ({ text }: { text: string }) => {
    const [isMounted, setIsMounted] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Initial render matches server-side
    if (!isMounted) {
        return (
            <span className="bg-gradient-to-r from-[#7042E6] to-[#A17FFF] bg-clip-text text-transparent">
                {text}
            </span>
        );
    }

    return (
        <span
            className="relative inline-block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {text.split('').map((letter, index) => (
                <span
                    key={index}
                    className="relative inline-block transition-transform duration-300"
                    style={{
                        transform: isHovered
                            ? `translateY(${Math.sin(index * 0.3) * 8}px)`
                            : 'none'
                    }}
                >
                    <span className="bg-gradient-to-r from-[#7042E6] to-[#A17FFF] bg-clip-text text-transparent">
                        {letter}
                    </span>
                </span>
            ))}
        </span>
    );
};


// Button component with safe hover effects
const AnimatedButton = ({
    children,
    primary = false
}: {
    children: React.ReactNode;
    primary?: boolean;
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Initial render matches server-side
    if (!isMounted) {
        return (
            <button
                className={`px-8 py-4 rounded-lg flex items-center gap-2 text-lg transition-colors
                    ${primary
                        ? 'bg-[#7042E6] text-white'
                        : 'border border-zinc-200 dark:border-zinc-700'
                    }`}
            >
                {children}
            </button>
        );
    }

    return (
        <button
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`relative px-8 py-4 rounded-lg flex items-center gap-2 text-lg overflow-hidden
                ${primary
                    ? 'bg-[#7042E6] text-white hover:bg-[#5c35c4]'
                    : 'border border-zinc-200 dark:border-zinc-700 hover:border-[#5c35c4] hover:text-[#5c35c4]'
                }`}
        >
            <div className="relative z-10 flex items-center gap-2">
                {children}
            </div>
            {isHovered && (
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 opacity-25 bg-gradient-to-r from-transparent via-white to-transparent animate-shine" />
                </div>
            )}
        </button>
    );
};


export default function RegisterPage() {
    const router = useRouter();
    const { address, isConnected } = useAccount();

    const [formData, setFormData] = useState<RegisterFormData>({
        companyName: '',
        email: '',
        esopTokens: '',
        esopTokenName: '',
        esopTokenSymbol: '',
    });

    const [showVerification, setShowVerification] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
    const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);
    const [isTransactionPending, setIsTransactionPending] = useState(false);
    const [transactionError, setTransactionError] = useState<string | null>(null);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

    const [otpError, setOtpError] = useState<OtpErrorState>({ count: 0, message: '' });
    const MAX_OTP_ATTEMPTS = 3;


    const {
        writeContract,
        isPending: isRegistering,
        isSuccess,
        data: hash,
        error: contractError,
    } = useWriteContract();

    useWatchContractEvent({
        address: FACTORY_CONTRACT_ADDRESS,
        abi: FACTORY_ABI,
        eventName: 'CompanyRegistered',
        onLogs: (logs) => {
             try {
                const relevantLog = logs.find(log =>
                    log.args && typeof log.args === 'object' && 'owner' in log.args && log.args.owner === address
                );

                if (relevantLog?.args && 'payrollContract' in relevantLog.args) {
                    toast.success(
                        `Company registered successfully!\nContract: ${relevantLog.args.payrollContract}`
                    );
                     setIsTransactionModalOpen(false);
                    router.push('/dashboard');
                }
            } catch (err) {
                console.error('Event listener error:', err);
               toast.error('Failed to process contract event');
            }
        },
    });


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.companyName || !formData.email || !formData.esopTokens) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (Number(formData.esopTokens) < 0) {
            toast.error('ESOP tokens cannot be negative');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        setShowVerification(true);
    };

    const handleOtpError = (error: any) => {
      setOtpError(prev => {
            const newCount = prev.count + 1;
            let message = '';

            if (error.message?.includes('invalid')) {
                message = 'Invalid OTP code. Please check and try again.';
            } else if (error.message?.includes('expired')) {
                message = 'OTP has expired. Please request a new code.';
            } else {
                message = 'Failed to verify OTP. Please try again.';
            }

            if (newCount >= MAX_OTP_ATTEMPTS) {
                message = 'Too many failed attempts. Please wait a moment and try again.';
            }
            return { count: newCount, message };
       });
        setTimeout(() => {
           setOtpError({ count: 0, message: '' });
        }, 60000);
    };

    const handleVerificationSuccess = async () => {
        setIsEmailVerified(true);
        setIsVerifyingEmail(true);
        setShowVerificationSuccess(true);
         setTransactionError(null);
        setIsTransactionModalOpen(true);
         setOtpError({ count: 0, message: '' });

        try {
            setIsTransactionPending(true);
            await writeContract({
                address: FACTORY_CONTRACT_ADDRESS,
                abi: FACTORY_ABI,
                functionName: 'registerCompany',
                args: [
                    formData.companyName,
                    formData.email,
                    parseEther(formData.esopTokens),
                    formData.esopTokenName,
                    formData.esopTokenSymbol,
                ],
            });
        } catch (error: any) {
            console.error('Contract Error:', error);
          const errorMessage = error.message || 'An unknown error occurred';
          if (errorMessage?.includes('User denied') || errorMessage?.includes('User rejected')) {
            setTransactionError('Transaction declined. Please try again.');
            toast.error('Transaction declined. Please try again.');
          }
            else {
              setTransactionError(`Failed to register company: ${errorMessage}`);
                 toast.error(`Failed to register company: ${errorMessage}`);
             }
            setShowVerificationSuccess(false);
            setIsTransactionPending(false);
        } finally {
             setIsVerifyingEmail(false);
        }
    };

    useEffect(() => {
        if (isSuccess && hash) {
            setIsTransactionPending(false);
            setTransactionError(null);
            toast.success('Transaction submitted! Waiting for confirmation...');
        }

         if (contractError) {
            setTransactionError(`Failed to register company: ${contractError.message}`);
             toast.error(`Failed to register company: ${contractError.message}`);
             setShowVerificationSuccess(false);
            setIsTransactionPending(false);
         }
    }, [isSuccess, hash, contractError]);

    useEffect(() => {
    AOS.init({
        duration: 800,
        once: false,
    });
    }, [])


    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0A051B]">
                <div className="text-center max-w-md px-4">
                    <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">
                        Connect Wallet
                    </h2>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Please connect your wallet to register your company with Peyroll.
                    </p>
                </div>
            </div>
        );
    }

   return (
        <div className="min-h-screen bg-white dark:bg-[#0A051B] relative">
            <div className="absolute inset-0 -z-10">
               <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#7042E6] rounded-full opacity-10 dark:opacity-20 blur-[120px]" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-[#7042E6] rounded-full opacity-5 dark:opacity-10 blur-[100px]" />
           </div>

            <div className="container mx-auto pt-24 px-4 py-16 relative z-10">
                <div className="max-w-2xl mx-auto">
                     {/* Header */}
                    <div className="text-center mb-8" data-aos="fade-down">
                    <div className="flex justify-center mb-8" >
                           <div className="px-4 py-1.5 rounded-full bg-purple-100/50 dark:bg-[#21164C] border border-purple-200 dark:border-[#352F44] flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-[#7042E6]" />
                                <span className="text-sm text-zinc-600 dark:text-[#A29FB1]">Web3 Payroll Solution</span>
                             </div>
                        </div>
                        <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white" data-aos="fade-up">
                           Register Your Company with <TextWaveEffect text=" Peyroll" />
                         </h1>
                        <p className="text-zinc-600 dark:text-zinc-400" data-aos="fade-up">
                             Enter your company details to get started
                           </p>
                      </div>

                    {/* Registration Form */}
                    <form onSubmit={handleSubmit} className="space-y-6" data-aos="fade-up" data-aos-delay="100">
                        {/* Company Name */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-zinc-900 dark:text-white">
                                Company Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Building2 className="h-5 w-5 text-zinc-400" />
                                </div>
                                <input
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    required
                                    className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-[#14141F] border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-zinc-900 dark:text-white"
                                    placeholder="Enter your company name"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-zinc-900 dark:text-white">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-zinc-400" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-[#14141F] border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-zinc-900 dark:text-white"
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>

                        {/* ESOP Tokens */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-zinc-900 dark:text-white">
                                ESOP Tokens Amount
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Coins className="h-5 w-5 text-zinc-400" />
                                </div>
                                <input
                                    type="number"
                                    name="esopTokens"
                                    value={formData.esopTokens}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    step="0.000000000000000001"
                                    className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-[#14141F] border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-zinc-900 dark:text-white"
                                    placeholder="Enter ESOP tokens amount"
                                />
                            </div>
                        </div>

                       {/* Token Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-zinc-900 dark:text-white">
                                    Token Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Text className="h-5 w-5 text-zinc-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="esopTokenName"
                                        value={formData.esopTokenName}
                                        onChange={handleChange}
                                        required
                                        className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-[#14141F] border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-zinc-900 dark:text-white"
                                        placeholder="Token name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-zinc-900 dark:text-white">
                                    Token Symbol
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Text className="h-5 w-5 text-zinc-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="esopTokenSymbol"
                                        value={formData.esopTokenSymbol}
                                        onChange={handleChange}
                                        required
                                        className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-[#14141F] border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-zinc-900 dark:text-white"
                                        placeholder="Token symbol"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isRegistering || isVerifyingEmail}
                            className="w-full py-3 px-4 bg-[#7042E6] hover:bg-[#6235d1] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isRegistering ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Registering...
                                </>
                            ) : isVerifyingEmail ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Verifying Email...
                                </>
                            ) : (
                                'Continue to Verification'
                            )}
                        </button>
                    </form>

                     {/* Verification Modal */}
                    {showVerification && (
                      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                          <div className="bg-white dark:bg-[#14141F] p-8 rounded-xl relative max-w-md w-full mx-4">
                             {otpError.count >= MAX_OTP_ATTEMPTS ? (
                                <div className="text-center">
                                  <div className="flex justify-center mb-4">
                                    <svg className="w-16 h-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                      </svg>
                                   </div>
                                  <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">
                                       Too Many Attempts
                                    </h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                                        Please wait a moment before trying again.
                                    </p>
                                    <button
                                         onClick={() => {
                                            setShowVerification(false);
                                            setOtpError({ count: 0, message: '' });
                                        }}
                                       className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                                       >
                                    Close
                                  </button>
                                 </div>
                            ) : (
                              <OktoVerification
                               email={formData.email}
                                onSuccess={handleVerificationSuccess}
                                onError={handleOtpError}
                                onClose={() => {
                                   setShowVerification(false);
                                   setOtpError({ count: 0, message: '' });
                                  }}
                                   errorMessage={otpError.message}
                             />
                         )}
                      </div>
                   </div>
                 )}

                    {/* Transaction Status Modal */}
                   {isTransactionModalOpen && (
                       <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="bg-white dark:bg-[#14141F] p-8 rounded-xl relative flex flex-col items-center justify-center">
                                {isTransactionPending ? (
                                    <>
                                        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
                                        <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">
                                            Waiting for Confirmation
                                        </h3>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                            Please approve the transaction in your wallet
                                        </p>
                                    </>
                                ) : transactionError ? (
                                    <>
                                        <div className="text-red-500 mb-4">
                                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">
                                            Transaction Declined
                                        </h3>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 text-center">
                                            The transaction was not approved in your wallet.
                                            Would you like to try again?
                                        </p>
                                       <div className="flex gap-3 justify-center">
                                            <button
                                               onClick={() => {
                                                    setIsTransactionModalOpen(false);
                                                    setTransactionError(null);
                                                }}
                                                className="px-4 py-2 border border-purple-500 text-purple-500 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                                               >
                                                Cancel
                                          </button>
                                          <button
                                            onClick={() => {
                                              setTransactionError(null);
                                                 handleVerificationSuccess();
                                              }}
                                              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                                             >
                                           Try Again
                                        </button>
                                      </div>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-16 w-16 mb-4 text-emerald-500 mx-auto" />
                                        <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">
                                            Transaction Submitted
                                        </h3>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                            Your registration is being processed...
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Success Animation Overlay */}
                    {showVerificationSuccess && !isTransactionModalOpen && (
                       <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40">
                           <div className="bg-white dark:bg-[#14141F] p-10 rounded-xl relative flex flex-col items-center justify-center transform transition-all duration-500 ease-in-out">
                                <CheckCircle className="h-16 w-16 mb-4 text-emerald-500" />
                                <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">
                                    Email Verified!
                                </h3>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                   Proceeding to registration...
                                </p>
                           </div>
                      </div>
                    )}

                </div>
            </div>
             <style jsx global>{`
                @keyframes shine {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(100%); }
                }
                
                .animate-shine {
                    animation: shine 1.5s infinite;
                }
            `}</style>
        </div>
    );
}