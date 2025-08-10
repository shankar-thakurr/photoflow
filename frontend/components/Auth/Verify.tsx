// 'use client';
// import { Loader, MailCheck } from 'lucide-react';
// import React, { useEffect, useRef, useState } from 'react';
// import LoadingButton from '../Helper/LoadingButton';
// import { useSearchParams } from 'next/navigation';
// import { useDispatch, useSelector } from 'react-redux';
// import { User } from '../../types'; // Fixed: removed dot from .types
// import { handleAuthRequest } from '../utils/apiRequest';
// import { login } from '../../store/authSlice';
// import { toast } from 'sonner';
// import { useRouter } from 'next/navigation';
// import axios, { AxiosResponse } from 'axios';

// // Fixed: Proper RootState type definition
// interface RootState {
//   auth: {
//     user: User | null;
//   };
// }

// // Local axios instance to avoid module resolution issues
// const apiRequest = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_URL,
//   withCredentials: true,
// });

// interface ApiResponse {
//   message: string;
//   user: User;
// }

// const Verify = () => {
//   const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
//   const [error, setError] = useState<string>('');
//   const [loading, setLoading] = useState<boolean>(false);
//   const [resendLoading, setResendLoading] = useState<boolean>(false);
//   const inputRefs = useRef<HTMLInputElement[]>([]);
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const dispatch = useDispatch();
  
//   // Fixed: Proper typing for useSelector
//   const { user } = useSelector((state: RootState) => state.auth);
//   const [isPageLoading, setIsPageLoading] = useState(true); // Fixed: camelCase naming

//   // Fixed: Corrected the logic for user verification status
//   useEffect(() => {
//     const email = searchParams.get('email');
    
//     // If no email parameter and no user, redirect to login
//     if (!email && !user) {
//       router.replace('/auth/login');
//       return;
//     }

//     // If user is already verified, redirect to home page
//     if (user?.isVerified) {
//       router.replace('/');
//       return;
//     }

//     // If we have email parameter or unverified user, stay on verification page
//     setIsPageLoading(false);
//   }, [user, router, searchParams]);

//   useEffect(() => {
//     if (inputRefs.current[0]) {
//       inputRefs.current[0].focus();
//     }
//   }, []);

//   const handleChange = (
//     index: number,
//     e: React.ChangeEvent<HTMLInputElement>
//   ) => {
//     const value = e.target.value;
//     if (isNaN(Number(value))) return;

//     const newOtp = [...otp];
//     newOtp[index] = value.substring(value.length - 1);
//     setOtp(newOtp);

//     if (value && index < 5 && inputRefs.current[index + 1]) {
//       inputRefs.current[index + 1].focus();
//     }
//   };

//   const handleKeyDown = (
//     index: number,
//     e: React.KeyboardEvent<HTMLInputElement>
//   ) => {
//     if (e.key === 'Backspace') {
//       e.preventDefault();
//       const newOtp = [...otp];
//       if (newOtp[index]) {
//         newOtp[index] = '';
//         setOtp(newOtp);
//       } else if (index > 0) {
//         newOtp[index - 1] = '';
//         setOtp(newOtp);
//         inputRefs.current[index - 1].focus();
//       }
//     } else if (e.key === 'ArrowLeft' && index > 0) {
//       inputRefs.current[index - 1].focus();
//     } else if (
//       e.key === 'ArrowRight' &&
//       index < 5 &&
//       inputRefs.current[index + 1]
//     ) {
//       inputRefs.current[index + 1].focus();
//     }
//   };

//   const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
//     e.preventDefault();
//     const paste = e.clipboardData.getData('text');
//     if (paste.length === 6 && !isNaN(Number(paste))) {
//       const newOtp = paste.split('');
//       setOtp(newOtp);
//       inputRefs.current[5].focus();
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setError('');
//     const otpValue = otp.join('');
    
//     if (otpValue.length < 6) {
//       setError('Please fill all the fields');
//       return;
//     }
    
//     const email = searchParams.get('email') || user?.email;
//     if (!email) {
//       setError('Email not found. Please go back to the signup page.');
//       return;
//     }

//     try {
//       const res = await handleAuthRequest(
//         () =>
//           apiRequest.post<ApiResponse>('/users/verify', {
//             email,
//             otp: otpValue,
//           }),
//         setLoading
//       );
      
//       if (res) {
//         toast.success(res.data.message);
//         dispatch(login(res.data.user));
//         // After successful verification, redirect to home page
//         router.push('/');
//       }
//     } catch (err) {
//       console.error('Verification error:', err);
//       setError('Verification failed. Please try again.');
//     }
//   };

//   const handleResendOtp = async () => {
//     setError('');
//     const email = searchParams.get('email') || user?.email;
//     if (!email) {
//       setError('Email not found. Please go back to the signup page.');
//       return;
//     }

//     try {
//       const res = await handleAuthRequest(
//         () => apiRequest.post<ApiResponse>('/users/resend-otp', { email }),
//         setResendLoading
//       );
//       if (res) {
//         toast.success(res.data.message);
//       }
//     } catch (err) {
//       console.error('Resend OTP error:', err);
//       setError('Failed to resend OTP. Please try again.');
//     }
//   };

//   if (isPageLoading) {
//     return (
//       <div className='h-screen flex justify-center items-center'>
//         <Loader className='w-20 h-20 animate-spin' />
//       </div>
//     );
//   }

//   return (
//     <div className="h-screen flex items-center flex-col justify-center">
//       <MailCheck className="w-20 h-20 sm:w-32 sm:h-32 text-red-600 mb-16" />
//       <h1 className="text-2xl sm:text-3xl font-bold mb-2">OTP Verification</h1>
//       <p className="mb-6 text-sm sm:text-base text-gray-600 font-medium">
//         We have sent a code to {user?.email || searchParams.get('email')}
//       </p>
//       <form onSubmit={handleSubmit} className="text-center">
//         <div className="flex space-x-4">
//           {otp.map((value, index) => (
//             <input
//               key={index}
//               type="text"
//               maxLength={1}
//               value={value}
//               aria-label={`OTP input ${index + 1}`}
//               ref={(el) => {
//                 if (el) {
//                   inputRefs.current[index] = el;
//                 }
//               }}
//               onChange={(e) => handleChange(index, e)}
//               onKeyDown={(e) => handleKeyDown(index, e)}
//               onPaste={handlePaste}
//               className="sm:w-20 sm:h-20 w-10 h-10 rounded-lg bg-gray-200 text-lg sm:text-3xl font-bold outline-gray-500 text-center"
//             />
//           ))}
//         </div>
//         {error && <p className="text-red-500 mt-4">{error}</p>}
//         <div className="flex items-center mt-4 space-x-2 justify-center">
//           <p className="text-sm sm:text-lg font-medium text-gray-700">
//             Did not get the OTP?
//           </p>
//           <button
//             type="button"
//             disabled={resendLoading}
//             onClick={handleResendOtp}
//             className="text-sm sm:text-lg font-medium text-blue-900 underline cursor-pointer disabled:text-gray-500 disabled:cursor-not-allowed"
//           >
//             {resendLoading ? 'Sending...' : 'Resend Code'}
//           </button>
//         </div>
//         <LoadingButton
//           isLoading={loading}
//           className="w-full mt-6"
//           type="submit"
//         >
//           Verify
//         </LoadingButton>
//       </form>
//     </div>
//   );
// };

// export default Verify;


'use client';
import { Loader, MailCheck } from 'lucide-react';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import LoadingButton from '../Helper/LoadingButton';
import { useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { User } from '../../types';
import { handleAuthRequest } from '../utils/apiRequest';
import { login } from '../../store/authSlice';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import axios, { AxiosResponse } from 'axios';
import { BASE_API_URL } from '@/server';

interface RootState {
  auth: {
    user: User | null;
  };
}

interface ApiResponse {
  message: string;
  data: {
    user: User;
  };
}

const Verify = () => {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state: RootState) => state.auth);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    
    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [countdown]);

  // Page loading and redirect logic
  useEffect(() => {
    const email = searchParams.get('email');
    
    // If no email parameter and no user, redirect to login
    if (!email && !user) {
      router.replace('/auth/login');
      return;
    }

    // If user is already verified, redirect to home page
    if (user?.isVerified) {
      router.replace('/');
      return;
    }

    // Valid case: stay on verification page
    setIsPageLoading(false);
  }, [user, router, searchParams]);

  // Auto-focus first input
  useEffect(() => {
    if (!isPageLoading && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isPageLoading]);

  // Clear error when user starts typing
  useEffect(() => {
    if (otp.some(digit => digit !== '')) {
      setError('');
    }
  }, [otp]);

  const validateOtp = (): boolean => {
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      setError('Please enter all 6 digits');
      return false;
    }
    
    if (!/^\d{6}$/.test(otpValue)) {
      setError('OTP must contain only numbers');
      return false;
    }
    
    return true;
  };

  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    
    // Only allow single digit numbers
    if (value && (isNaN(Number(value)) || value.length > 1)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input if value is entered
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...otp];
      
      if (newOtp[index]) {
        // Clear current field
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        // Move to previous field and clear it
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Submit form if all fields are filled
      if (otp.every(digit => digit !== '')) {
        handleSubmit(e as any);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, ''); // Remove non-digits
    
    if (paste.length === 6) {
      const newOtp = paste.split('').slice(0, 6);
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const getEmail = (): string | null => {
    return searchParams.get('email') || user?.email || null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateOtp()) {
      return;
    }
    
    const email = getEmail();
    if (!email) {
      setError('Email not found. Please go back to the signup page.');
      return;
    }

    const otpValue = otp.join('');
    
    try {
      const verifyApiRequest = async () => {
        return await axios.post<ApiResponse>(`${BASE_API_URL}/users/verify`, {
          email,
          otp: otpValue,
        }, {
          withCredentials: true,
          timeout: 10000,
        });
      };

      const result = await handleAuthRequest(verifyApiRequest, setLoading);
      
      if (result?.data?.data?.user) {
        toast.success(result.data.message || 'Email verified successfully!');
        dispatch(login(result.data.data.user));
        router.push('/');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Verification failed. Please check your OTP and try again.');
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    setError('');
    const email = getEmail();
    
    if (!email) {
      setError('Email not found. Please go back to the signup page.');
      return;
    }

    try {
      const resendApiRequest = async () => {
        return await axios.post<ApiResponse>(`${BASE_API_URL}/users/resend-otp`, {
          email
        }, {
          withCredentials: true,
          timeout: 10000,
        });
      };

      const result = await handleAuthRequest(resendApiRequest, setResendLoading);
      
      if (result) {
        toast.success(result.data.message || 'OTP sent successfully!');
        setCountdown(60); // 60 second cooldown
        setOtp(new Array(6).fill('')); // Clear current OTP
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Failed to resend OTP. Please try again.');
    }
  };

  if (isPageLoading) {
    return (
      <div className="h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading verification page...</p>
        </div>
      </div>
    );
  }

  const displayEmail = getEmail();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <MailCheck className="w-16 h-16 sm:w-20 sm:h-20 text-blue-600 mx-auto mb-6" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Verify Your Email
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            We've sent a 6-digit code to
          </p>
          <p className="text-sm sm:text-base font-semibold text-gray-900 break-all">
            {displayEmail}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2 sm:gap-3">
            {otp.map((value, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                pattern="\d{1}"
                maxLength={1}
                value={value}
                aria-label={`OTP digit ${index + 1}`}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                onChange={(e) => handleChange(index, e)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={loading}
                className={`w-12 h-12 sm:w-16 sm:h-16 text-center text-xl sm:text-2xl font-bold border-2 rounded-lg transition-colors outline-none ${
                  error 
                    ? 'border-red-500 bg-red-50' 
                    : value 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 bg-white focus:border-blue-500'
                } disabled:bg-gray-100 disabled:cursor-not-allowed`}
              />
            ))}
          </div>

          {error && (
            <div className="text-center">
              <p className="text-red-500 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-1 text-sm sm:text-base">
              <span className="text-gray-700">Didn't receive the code?</span>
              <button
                type="button"
                disabled={countdown > 0 || resendLoading}
                onClick={handleResendOtp}
                className={`font-medium underline transition-colors ${
                  countdown > 0 || resendLoading
                    ? 'text-gray-400 cursor-not-allowed no-underline'
                    : 'text-blue-600 hover:text-blue-800'
                }`}
              >
                {resendLoading 
                  ? 'Sending...' 
                  : countdown > 0 
                  ? `Resend in ${countdown}s`
                  : 'Resend Code'
                }
              </button>
            </div>

            <LoadingButton
              isLoading={loading}
              disabled={loading || otp.some(digit => digit === '')}
              className="w-full"
              type="submit"
              size="lg"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </LoadingButton>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => router.push('/auth/login')}
            className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Verify;