'use client';
import { KeySquare, ArrowLeft } from 'lucide-react';
import React, { useState, FormEvent, useCallback } from 'react';
import LoadingButton from '../Helper/LoadingButton';
import Link from 'next/link';
import axios from 'axios';
import { handleAuthRequest } from '../utils/apiRequest';
import { toast } from 'sonner';
import { BASE_API_URL } from '@/server';
import { useRouter } from 'next/navigation';

interface FormErrors {
  email?: string;
}

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  
  const router = useRouter();

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Email validation with more comprehensive regex
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    // Clear error when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  }, [errors.email]);

  const handleSubmit = useCallback(async (e?: FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!validateForm()) {
      return;
    }

    try {
      const forgotPasswordRequest = async () => {
        return await axios.post(`${BASE_API_URL}/users/forgot-password`, {
          email: email.trim().toLowerCase(),
        }, {
          withCredentials: true,
          timeout: 15000, // Increased timeout for better reliability
        });
      };

      const result = await handleAuthRequest(forgotPasswordRequest, setIsLoading);
      
      if (result?.data) {
        const successMessage = result.data.message || 'Password reset link sent successfully!';
        toast.success(successMessage);
        
        // Navigate to reset password page with email parameter
        router.push(`/auth/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      // Error handling is managed by handleAuthRequest, but we can add fallback
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Failed to send reset email. Please try again.';
        toast.error(errorMessage);
      }
    }
  }, [validateForm, email, router]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <KeySquare className="w-16 h-16 sm:w-20 sm:h-20 text-blue-600 mx-auto mb-6" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Forgot Your Password?
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-medium px-4">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email address"
              value={email}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              required
              autoComplete="email"
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={`w-full px-4 py-3 border rounded-lg outline-none transition-all duration-200 ${
                errors.email 
                  ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                  : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              } disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60`}
            />
            {errors.email && (
              <p id="email-error" className="text-red-500 text-sm mt-2" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <LoadingButton
            onClick={handleSubmit}
            className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            size="lg"
            isLoading={isLoading}
            disabled={isLoading || !email.trim()}
            type="submit"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </LoadingButton>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200 focus:outline-none focus:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Remember your password?{' '}
            <Link
              href="/auth/login"
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 focus:outline-none focus:underline"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;