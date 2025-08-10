"use client"
import Image from 'next/image';
import React, { useState, FormEvent, useCallback, useEffect } from 'react';
import PasswordInput from './PasswordInput';
import LoadingButton from '../Helper/LoadingButton';
import Link from 'next/link';
import { BASE_API_URL } from '@/server';
import axios from 'axios';
import { handleAuthRequest } from '../utils/apiRequest';
import { toast } from 'sonner';
import { useDispatch } from 'react-redux';
import { login } from '@/store/authSlice';
import { useRouter, useSearchParams } from 'next/navigation';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const Login = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);

  // Handle redirect messages from other pages
  useEffect(() => {
    const message = searchParams?.get('message');
    const type = searchParams?.get('type');
    
    if (message) {
      if (type === 'success') {
        toast.success(decodeURIComponent(message));
      } else if (type === 'error') {
        toast.error(decodeURIComponent(message));
      } else if (type === 'info') {
        toast.info(decodeURIComponent(message));
      }
      
      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
    
    // Check for session expiry
    const sessionExpired = searchParams?.get('sessionExpired');
    if (sessionExpired === 'true') {
      toast.error('Your session has expired. Please log in again.');
    }
  }, [searchParams]);

  // Handle rate limiting / account lockout
  useEffect(() => {
    const storedAttempts = localStorage.getItem('loginAttempts');
    const storedBlockTime = localStorage.getItem('blockTime');
    
    if (storedAttempts) {
      setLoginAttempts(parseInt(storedAttempts));
    }
    
    if (storedBlockTime) {
      const blockTime = parseInt(storedBlockTime);
      const now = Date.now();
      
      if (now < blockTime) {
        setIsBlocked(true);
        setBlockTimeRemaining(Math.ceil((blockTime - now) / 1000));
        
        const interval = setInterval(() => {
          const remaining = Math.ceil((blockTime - Date.now()) / 1000);
          if (remaining <= 0) {
            setIsBlocked(false);
            setBlockTimeRemaining(0);
            setLoginAttempts(0);
            localStorage.removeItem('loginAttempts');
            localStorage.removeItem('blockTime');
            clearInterval(interval);
          } else {
            setBlockTimeRemaining(remaining);
          }
        }, 1000);
        
        return () => clearInterval(interval);
      } else {
        // Block time has expired
        setLoginAttempts(0);
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('blockTime');
      }
    }
  }, []);

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Email validation with more comprehensive checks
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    } else if (formData.email.trim().length > 254) {
      newErrors.email = 'Email address is too long';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 1) {
      newErrors.password = 'Password cannot be empty';
    } else if (formData.password.length > 128) {
      newErrors.password = 'Password is too long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    // Clear general error when user modifies form
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }));
    }
  }, [errors]);

  const handleFailedLogin = useCallback(() => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    localStorage.setItem('loginAttempts', newAttempts.toString());
    
    if (newAttempts >= 5) {
      // Block for 15 minutes after 5 failed attempts
      const blockUntil = Date.now() + (15 * 60 * 1000);
      localStorage.setItem('blockTime', blockUntil.toString());
      setIsBlocked(true);
      setBlockTimeRemaining(15 * 60);
      toast.error('Too many failed attempts. Account temporarily locked for 15 minutes.');
    } else {
      const remaining = 5 - newAttempts;
      toast.error(`Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
    }
  }, [loginAttempts]);

  const handleSuccessfulLogin = useCallback(() => {
    // Clear login attempts on successful login
    setLoginAttempts(0);
    localStorage.removeItem('loginAttempts');
    localStorage.removeItem('blockTime');
    
    // Handle remember me functionality
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', formData.email.trim().toLowerCase());
    } else {
      localStorage.removeItem('rememberedEmail');
    }
  }, [rememberMe, formData.email]);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    
    // Clear previous general errors
    setErrors(prev => ({ ...prev, general: undefined }));
    
    if (isBlocked) {
      toast.error(`Account is temporarily locked. Try again in ${Math.ceil(blockTimeRemaining / 60)} minutes.`);
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    console.log('Login attempt started');
    setIsLoading(true);

    try {
      // Direct API call with comprehensive error handling
      const response = await axios.post(`${BASE_API_URL}/users/login`, {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        rememberMe: rememberMe,
      }, {
        withCredentials: true,
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Login successful:', response.data);

      if (response.data && response.data.data && response.data.data.user) {
        handleSuccessfulLogin();
        dispatch(login(response.data.data.user));
        
        const successMessage = response.data.message || 'Login successful!';
        toast.success(successMessage);
        
        // Handle redirect
        const redirectTo = searchParams?.get('redirect') || '/';
        const decodedRedirect = decodeURIComponent(redirectTo);
        
        // Validate redirect URL for security
        if (decodedRedirect.startsWith('/') && !decodedRedirect.startsWith('//')) {
          router.push(decodedRedirect);
        } else {
          router.push('/');
        }
      } else {
        console.error('Unexpected response structure:', response.data);
        setErrors(prev => ({ ...prev, general: 'Login failed. Please try again.' }));
        toast.error('Login failed. Please try again.');
      }

    } catch (error) {
      console.error('Login error:', error);
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorMessage = error.response?.data?.message;
        const errorData = error.response?.data;
        
        console.log('Error details:', { status, errorMessage, errorData });

        if (status === 400) {
          setErrors(prev => ({ ...prev, general: errorMessage || 'Invalid login credentials' }));
          toast.error(errorMessage || 'Invalid login credentials');
        } else if (status === 401) {
          // Unauthorized - wrong credentials
          handleFailedLogin();
          setErrors(prev => ({ ...prev, general: 'Invalid email or password' }));
        } else if (status === 403) {
          // Account might be locked or unverified
          const message = errorMessage || 'Access denied. Please check your account status.';
          setErrors(prev => ({ ...prev, general: message }));
          toast.error(message);
          
          // Check if account needs verification
          if (errorMessage?.toLowerCase().includes('verify')) {
            setTimeout(() => {
              router.push('/auth/verify');
            }, 2000);
          }
        } else if (status === 404) {
          setErrors(prev => ({ ...prev, general: 'Account not found. Please check your email address.' }));
          toast.error('Account not found. Please check your email address.');
        } else if (status === 429) {
          // Rate limited
          setErrors(prev => ({ ...prev, general: 'Too many requests. Please try again later.' }));
          toast.error('Too many requests. Please try again later.');
        } else if (status === 500) {
          setErrors(prev => ({ ...prev, general: 'Server error. Please try again later.' }));
          toast.error('Server error. Please try again later.');
        } else if (error.code === 'ECONNABORTED') {
          setErrors(prev => ({ ...prev, general: 'Request timeout. Please check your connection.' }));
          toast.error('Request timeout. Please check your connection.');
        } else if (error.code === 'ERR_NETWORK') {
          setErrors(prev => ({ ...prev, general: 'Network error. Please check your internet connection.' }));
          toast.error('Network error. Please check your internet connection.');
        } else {
          setErrors(prev => ({ ...prev, general: 'Login failed. Please try again.' }));
          toast.error('Login failed. Please try again.');
        }
      } else {
        console.error('Non-axios error:', error);
        setErrors(prev => ({ ...prev, general: 'An unexpected error occurred.' }));
        toast.error('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [validateForm, formData, rememberMe, isBlocked, blockTimeRemaining, handleFailedLogin, handleSuccessfulLogin, dispatch, router, searchParams]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  }, [handleSubmit]);

  const isFormValid = useCallback(() => {
    return formData.email.trim().length > 0 && 
           formData.password.length > 0 && 
           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()) &&
           !isBlocked &&
           Object.keys(errors).filter(key => key !== 'general').length === 0;
  }, [formData, errors, isBlocked]);

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
      <div className="hidden lg:block">
        <Image
          src="/image/signup.jpg"
          alt="login image"
          width={800}
          height={800}
          className="h-full w-full object-cover"
          priority
        />
      </div>
      <div className="bg-gray-100 flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Login to PhotoFlow
          </h1>
          
          {/* Account lockout warning */}
          {isBlocked && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-red-800 font-medium">Account Temporarily Locked</p>
                  <p className="text-red-600 text-sm">
                    Too many failed attempts. Try again in {formatTime(blockTimeRemaining)}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* General error message */}
          {errors.general && !isBlocked && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm flex items-center" role="alert">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.general}
              </p>
            </div>
          )}

          {/* Login attempts warning */}
          {loginAttempts > 0 && loginAttempts < 5 && !isBlocked && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                {loginAttempts} failed attempt{loginAttempts !== 1 ? 's' : ''}. 
                {5 - loginAttempts} attempt{5 - loginAttempts !== 1 ? 's' : ''} remaining.
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label htmlFor="email" className="font-semibold mb-2 block text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter email address"
                className={`px-4 py-3 border rounded-lg block w-full outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.email 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-300 bg-white hover:border-gray-400'
                } disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60`}
                value={formData.email}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                disabled={isLoading || isBlocked}
                required
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-red-500 text-sm mt-1" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="mb-4">
              <PasswordInput
                label="Password"
                placeholder="Enter password"
                name="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                disabled={isLoading || isBlocked}
                error={errors.password}
                required
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me checkbox */}
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading || isBlocked}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Remember me</span>
              </label>
              
              <Link 
                href="/auth/forget-password"
                className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                Forgot Password?
              </Link>
            </div>

            <LoadingButton 
              size="lg" 
              className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" 
              type="submit" 
              isLoading={isLoading}
              disabled={isLoading || isBlocked || !isFormValid()}
            >
              {isLoading ? 'Logging in...' : isBlocked ? `Locked (${formatTime(blockTimeRemaining)})` : 'Login Now'}
            </LoadingButton>
          </form>
          
          <p className="mt-6 text-base text-gray-600 text-center">
            Don&apos;t have an account?{' '}
            <Link 
              href="/auth/signup"
              className="text-blue-600 font-medium hover:text-blue-700 underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              Sign up here
            </Link>
          </p>

          {/* Additional help links */}
          <div className="mt-4 text-center text-sm text-gray-500">
            <Link 
              href="/auth/resend-verification"
              className="hover:text-gray-700 underline transition-colors"
            >
              Need to verify your account?
            </Link>
            {' • '}
            <Link 
              href="/support"
              className="hover:text-gray-700 underline transition-colors"
            >
              Get Help
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;