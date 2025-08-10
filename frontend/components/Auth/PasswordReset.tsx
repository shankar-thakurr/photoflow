'use client';
import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import PasswordInput from './PasswordInput';
import LoadingButton from '../Helper/LoadingButton';
import Link from 'next/link';
import { Button } from '../ui/button';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { KeySquare, ArrowLeft, Loader } from 'lucide-react';
import axios from 'axios';
import { handleAuthRequest } from '../utils/apiRequest';
import { toast } from 'sonner';
import { login } from '../../store/authSlice';
import { BASE_API_URL } from '@/server';

interface FormData {
  otp: string;
  password: string;
  passwordConfirm: string;
}

interface FormErrors {
  otp?: string;
  password?: string;
  passwordConfirm?: string;
  general?: string; // Added for general API errors
}

const PasswordReset = () => {
  const searchParams = useSearchParams();
  const email = searchParams?.get('email');
  
  const [formData, setFormData] = useState<FormData>({
    otp: '',
    password: '',
    passwordConfirm: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  const dispatch = useDispatch();
  const router = useRouter();

  // Redirect if no email parameter
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!email) {
        toast.error('Email parameter missing. Redirecting to forgot password page.');
        router.replace('/auth/forgot-password');
        return;
      }
      setIsPageLoading(false);
    }, 100); // Small delay to ensure proper mounting

    return () => clearTimeout(timer);
  }, [email, router]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // OTP validation
    if (!formData.otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (!/^\d{6}$/.test(formData.otp.trim())) {
      newErrors.otp = 'OTP must be exactly 6 digits';
    }

    // Password validation - comprehensive (matching signup exactly)
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (formData.password.length > 128) {
      newErrors.password = 'Password must not exceed 128 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    } else if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character';
    } else if (/(.)\1{2,}/.test(formData.password)) {
      newErrors.password = 'Password cannot contain more than 2 consecutive identical characters';
    } else if (/\s/.test(formData.password)) {
      newErrors.password = 'Password cannot contain spaces';
    }

    // Password confirmation validation
    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Please confirm your password';
    } else if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleChange = useCallback((field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    
    // Special handling for OTP field - only allow numbers and limit to 6 digits
    if (field === 'otp') {
      if (value && !/^\d*$/.test(value)) return;
      if (value.length > 6) return;
    }

    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e?: FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    console.log('Password reset form submission started');

    // Clear any previous general errors
    setErrors(prev => ({ ...prev, general: undefined }));

    if (!validateForm()) {
      console.log('Password reset form validation failed');
      return;
    }

    if (!email) {
      toast.error('Email not found. Please start over from forgot password.');
      router.push('/auth/forgot-password');
      return;
    }

    console.log('Password reset form validation passed, sending API request...');
    setIsLoading(true);

    try {
      // Direct API call instead of using handleAuthRequest wrapper
      const response = await axios.post(`${BASE_API_URL}/users/reset-password`, {
        email: email.toLowerCase(),
        otp: formData.otp.trim(),
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
      }, {
        withCredentials: true,
        timeout: 15000,
      });

      console.log('Password reset successful:', response.data);

      // Handle successful response
      if (response.data && response.data.data && response.data.data.user) {
        dispatch(login(response.data.data.user));
        toast.success(response.data.message || 'Password reset successfully!');
        
        // Clear form data for security
        setFormData({
          otp: '',
          password: '',
          passwordConfirm: '',
        });
        
        router.push('/auth/login');
      } else {
        console.error('Unexpected response structure:', response.data);
        toast.error('Something went wrong. Please try again.');
      }

    } catch (error) {
      console.error('Password reset error:', error);
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorMessage = error.response?.data?.message;
        const errorData = error.response?.data;
        
        console.log('Error details:', { status, errorMessage, errorData });

        if (status === 400) {
          // Handle validation errors from backend
          if (errorMessage) {
            if (errorMessage.toLowerCase().includes('otp')) {
              setErrors(prev => ({ ...prev, otp: 'Invalid or expired OTP' }));
            } else if (errorMessage.toLowerCase().includes('password')) {
              setErrors(prev => ({ ...prev, password: errorMessage }));
            } else {
              setErrors(prev => ({ ...prev, general: errorMessage }));
              toast.error(errorMessage);
            }
          } else {
            setErrors(prev => ({ ...prev, general: 'Invalid form data. Please check your inputs.' }));
            toast.error('Invalid form data. Please check your inputs.');
          }
        } else if (status === 401) {
          // Unauthorized - invalid OTP
          setErrors(prev => ({ ...prev, otp: 'Invalid or expired OTP' }));
          toast.error('Invalid or expired OTP');
        } else if (status === 404) {
          // Not found - user not found
          setErrors(prev => ({ ...prev, general: 'User not found or reset request expired' }));
          toast.error('User not found or reset request expired');
        } else if (status === 500) {
          setErrors(prev => ({ ...prev, general: 'Server error. Please try again later.' }));
          toast.error('Server error. Please try again later.');
        } else if (error.code === 'ECONNABORTED') {
          setErrors(prev => ({ ...prev, general: 'Request timeout. Please try again.' }));
          toast.error('Request timeout. Please try again.');
        } else if (error.code === 'ERR_NETWORK') {
          setErrors(prev => ({ ...prev, general: 'Network error. Please check your connection.' }));
          toast.error('Network error. Please check your connection.');
        } else {
          setErrors(prev => ({ ...prev, general: 'Something went wrong. Please try again.' }));
          toast.error('Something went wrong. Please try again.');
        }
      } else {
        console.error('Non-axios error:', error);
        setErrors(prev => ({ ...prev, general: 'An unexpected error occurred.' }));
        toast.error('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [validateForm, email, formData, dispatch, router]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleBackToForgotPassword = useCallback(() => {
    router.push('/auth/forget-password');
  }, [router]);

  const getPasswordStrength = useCallback(() => {
    const password = formData.password;
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/(?=.*[a-z])/.test(password)) strength += 1;
    if (/(?=.*[A-Z])/.test(password)) strength += 1;
    if (/(?=.*\d)/.test(password)) strength += 1;
    if (/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) strength += 1;
    
    return strength;
  }, [formData.password]);

  const passwordStrength = getPasswordStrength();
  
  const getStrengthLabel = useCallback(() => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 4) return 'Medium';
    return 'Strong';
  }, [passwordStrength]);

  const getStrengthColor = useCallback(() => {
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  }, [passwordStrength]);

  const isFormValid = useCallback(() => {
    const valid = formData.otp.length === 6 && 
           formData.password.length >= 8 && 
           formData.passwordConfirm.length >= 8 &&
           formData.password === formData.passwordConfirm &&
           Object.keys(errors).filter(key => key !== 'general').length === 0;
    
    console.log('Password reset form validity check:', {
      otp: formData.otp.length === 6,
      password: formData.password.length >= 8,
      passwordConfirm: formData.passwordConfirm.length >= 8,
      passwordsMatch: formData.password === formData.passwordConfirm,
      noErrors: Object.keys(errors).filter(key => key !== 'general').length === 0,
      isValid: valid
    });
    
    return valid;
  }, [formData, errors]);

  if (isPageLoading) {
    return (
      <div className="h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <KeySquare className="w-16 h-16 sm:w-20 sm:h-20 text-blue-600 mx-auto mb-6" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Reset Your Password
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-medium px-4">
            Enter the OTP sent to your email and create a new password
          </p>
          {email && (
            <p className="text-sm font-medium text-gray-800 mt-2 break-all bg-gray-100 px-3 py-1 rounded-md">
              {email}
            </p>
          )}
        </div>

        {/* General error message */}
        {errors.general && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm" role="alert">
              {errors.general}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              value={formData.otp}
              onChange={handleChange('otp')}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              required
              aria-describedby={errors.otp ? 'otp-error' : undefined}
              className={`w-full px-4 py-3 border rounded-lg outline-none transition-all duration-200 text-center text-lg font-mono tracking-wider ${
                errors.otp 
                  ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                  : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              } disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60`}
            />
            {errors.otp && (
              <p id="otp-error" className="text-red-500 text-sm mt-2" role="alert">
                {errors.otp}
              </p>
            )}
          </div>

          <div>
            <PasswordInput
              label="New Password"
              placeholder="Enter new password"
              name="password"
              value={formData.password}
              onChange={handleChange('password')}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              error={errors.password}
              required
              autoComplete="new-password"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-2" role="alert">
                {errors.password}
              </p>
            )}
            {formData.password && (
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Password strength:</span>
                  <span className={`text-sm font-medium ${
                    passwordStrength <= 2 ? 'text-red-600' : 
                    passwordStrength <= 4 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {getStrengthLabel()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                    style={{ width: `${(passwordStrength / 6) * 100}%` }}
                  />
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`px-2 py-1 rounded ${formData.password.length >= 8 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      8+ chars
                    </span>
                    <span className={`px-2 py-1 rounded ${/(?=.*[A-Z])/.test(formData.password) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      Uppercase
                    </span>
                    <span className={`px-2 py-1 rounded ${/(?=.*[a-z])/.test(formData.password) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      Lowercase
                    </span>
                    <span className={`px-2 py-1 rounded ${/(?=.*\d)/.test(formData.password) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      Number
                    </span>
                    <span className={`px-2 py-1 rounded ${/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(formData.password) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      Special
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <PasswordInput
              label="Confirm New Password"
              placeholder="Confirm new password"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange('passwordConfirm')}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              error={errors.passwordConfirm}
              required
              autoComplete="new-password"
            />
            {errors.passwordConfirm && (
              <p className="text-red-500 text-sm mt-2" role="alert">
                {errors.passwordConfirm}
              </p>
            )}
            {formData.passwordConfirm && formData.password === formData.passwordConfirm && (
              <p className="text-green-600 text-sm mt-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Passwords match
              </p>
            )}
          </div>

          <div className="space-y-3">
            <LoadingButton
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={isLoading || !isFormValid()}
              className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              size="lg"
              type="submit"
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </LoadingButton>

            <Button 
              type="button"
              variant="ghost" 
              className="w-full focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              disabled={isLoading}
              onClick={handleBackToForgotPassword}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Forgot Password
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
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

export default PasswordReset;
