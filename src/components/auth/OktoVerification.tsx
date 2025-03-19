'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useOkto, OktoContextType } from 'okto-sdk-react';


interface OktoVerificationProps {

    email: string;

    onSuccess: () => Promise<void>;

    onError: (error: any) => void;

    onClose: () => void;

    errorMessage: string;

}

export default function OktoVerification({ 
  email, 
  onSuccess, 
  onClose 
}: OktoVerificationProps) {
  // State management for our verification flow
  const [otp, setOtp] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

    const { sendEmailOTP, verifyEmailOTP } = useOkto() as OktoContextType;

  // Handle sending the OTP via Okto
    const handleSendOTP = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await sendEmailOTP(email);
            console.log('OTP Sent:', response);
            // Store the token for verification
            const otpToken = response.token;
            setVerificationToken(otpToken);
            setOtpSent(true);
        } catch (err) {
            console.error('Error sending Email OTP:', err);
            setError('Failed to send OTP. Please try again.');
        }
        setIsLoading(false);
    };


    // Handle OTP verification via Okto
    const handleVerifyOTP = async () => {
      if (!verificationToken) {
        setError('Please request OTP first');
        return;
      }
      setIsLoading(true);
      setError('');
      try {
            const verified = await verifyEmailOTP(email, otp, verificationToken);
            if (verified) {
                console.log('Email OTP verified successfully');
                onSuccess();
            } else {
                console.error('OTP verification failed');
                setError('Please Enter a correct OTP');
            }
        } catch (err) {
            console.error('Error verifying Email OTP:', err);
             setError(err instanceof Error ? err.message : 'Verification failed');
        }
        setIsLoading(false);
    };


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#14141F] p-6 rounded-xl w-full max-w-md m-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">
            Verify Your Email
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {otpSent ? 'Enter the verification code' : 'Please verify your email address'}
          </p>
        </div>

        {!otpSent ? (
          <div className="space-y-4">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              We'll send a verification code to:
              <div className="font-medium text-black dark:text-white mt-1">{email}</div>
            </div>
            <button
              onClick={handleSendOTP}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#7042E6] hover:bg-[#6235d1] text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="block w-full px-4 py-3 bg-white dark:bg-[#14141F] border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg tracking-widest"
              maxLength={6}
            />
            <button
              onClick={handleVerifyOTP}
              disabled={isLoading || otp.length !== 6}
              className="w-full py-3 px-4 bg-[#7042E6] hover:bg-[#6235d1] text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button
              onClick={handleSendOTP}
              disabled={isLoading}
              className="w-full py-2 text-sm text-[#7042E6] hover:text-[#6235d1]"
            >
              Resend Code
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 text-sm text-red-500 text-center">
            {error}
          </div>
        )}

      </div>
    </div>
  );
}