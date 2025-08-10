"use client"
import Image from 'next/image';
import React, { useState, FormEvent, useCallback } from 'react';
import PasswordInput from './PasswordInput';
import LoadingButton from '../Helper/LoadingButton';
import Link from 'next/link';
import { BASE_API_URL } from '@/server';
import axios from 'axios';
import { handleAuthRequest } from '../utils/apiRequest';
import { toast } from 'sonner';
import { useDispatch } from 'react-redux';
import { login } from '@/store/authSlice';
import { useRouter } from 'next/navigation';

interface FormData {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
  general?: string; // Added for general API errors
}

const SignupPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters long';
    } else if (formData.username.trim().length > 30) {
      newErrors.username = 'Username must not exceed 30 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation - comprehensive
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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    console.log('Form submission started');

    // Clear any previous general errors
    setErrors(prev => ({ ...prev, general: undefined }));

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    console.log('Form validation passed, sending API request...');
    setIsLoading(true);

    try {
      // Direct API call instead of using handleAuthRequest wrapper
      const response = await axios.post(`${BASE_API_URL}/users/signup`, {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
      }, {
        withCredentials: true,
        timeout: 15000,
      });

      console.log('Signup successful:', response.data);

      // Handle successful response
      if (response.data && response.data.data && response.data.data.user) {
        dispatch(login(response.data.data.user));
        toast.success(response.data.message || 'Account created successfully!');
        router.push('/auth/verify');
      } else {
        console.error('Unexpected response structure:', response.data);
        toast.error('Something went wrong. Please try again.');
      }

    } catch (error) {
      console.error('Signup error:', error);
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorMessage = error.response?.data?.message;
        const errorData = error.response?.data;
        
        console.log('Error details:', { status, errorMessage, errorData });

        if (status === 400) {
          // Handle validation errors from backend
          if (errorMessage) {
            if (errorMessage.toLowerCase().includes('username')) {
              setErrors(prev => ({ ...prev, username: 'This username is already taken' }));
            } else if (errorMessage.toLowerCase().includes('email')) {
              setErrors(prev => ({ ...prev, email: 'This email is already registered' }));
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
        } else if (status === 409) {
          // Conflict - user already exists
          setErrors(prev => ({ ...prev, general: 'User already exists with this email or username' }));
          toast.error('User already exists with this email or username');
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
  }, [validateForm, formData, dispatch, router]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  }, [handleSubmit]);

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
    const valid = formData.username.trim().length >= 3 && 
           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()) &&
           formData.password.length >= 8 && 
           formData.passwordConfirm.length >= 8 &&
           formData.password === formData.passwordConfirm &&
           Object.keys(errors).filter(key => key !== 'general').length === 0;
    
    console.log('Form validity check:', {
      username: formData.username.trim().length >= 3,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()),
      password: formData.password.length >= 8,
      passwordConfirm: formData.passwordConfirm.length >= 8,
      passwordsMatch: formData.password === formData.passwordConfirm,
      noErrors: Object.keys(errors).filter(key => key !== 'general').length === 0,
      isValid: valid
    });
    
    return valid;
  }, [formData, errors]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
      <div className="hidden lg:block">
        <Image
          src="/image/signup.jpg"
          alt="signup image"
          width={800}
          height={800}
          className="h-full w-full object-cover"
          priority
        />
      </div>
      <div className="bg-gray-100 flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Sign Up to PhotoFlow
          </h1>
          
          {/* General error message */}
          {errors.general && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm" role="alert">
                {errors.general}
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label htmlFor="username" className="font-semibold mb-2 block text-gray-700">
                Username
              </label>
              <input
                id="username"
                type="text"
                name="username"
                placeholder="Username"
                className={`px-4 py-3 border rounded-lg block w-full outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.username 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-300 bg-white hover:border-gray-400'
                } disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60`}
                value={formData.username}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                required
                aria-invalid={!!errors.username}
                aria-describedby={errors.username ? 'username-error' : undefined}
              />
              {errors.username && (
                <p id="username-error" className="text-red-500 text-sm mt-1" role="alert">
                  {errors.username}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="font-semibold mb-2 block text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Email Address"
                className={`px-4 py-3 border rounded-lg block w-full outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.email 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-300 bg-white hover:border-gray-400'
                } disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60`}
                value={formData.email}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                required
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
                placeholder="Enter Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                error={errors.password}
                required
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1" role="alert">
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

            <div className="mb-6">
              <PasswordInput
                label="Confirm Password"
                placeholder="Confirm Password"
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                error={errors.passwordConfirm}
                required
                autoComplete="new-password"
              />
              {errors.passwordConfirm && (
                <p className="text-red-500 text-sm mt-1" role="alert">
                  {errors.passwordConfirm}
                </p>
              )}
              {formData.passwordConfirm && formData.password === formData.passwordConfirm && (
                <p className="text-green-600 text-sm mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Passwords match
                </p>
              )}
            </div>

            <LoadingButton 
              size="lg" 
              className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" 
              type="submit" 
              isLoading={isLoading}
              disabled={isLoading || !isFormValid()}
            >
              {isLoading ? 'Creating Account...' : 'Sign Up Now'}
            </LoadingButton>
          </form>
          
          <p className="mt-6 text-base text-gray-600 text-center">
            Already have an account?{' '}
            <Link 
              href="/auth/login"
              className="text-blue-600 font-medium hover:text-blue-700 underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
