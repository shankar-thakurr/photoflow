"use client"
import { Eye, EyeClosed } from 'lucide-react';
import React, { InputHTMLAttributes, useState } from 'react';

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?:string,
    error?:string,
    inputClassName?:string
    lableClassName?:string
    iconClassName?:string
}
const PasswordInput = ({
    label,
    inputClassName='',
    lableClassName='', 
    iconClassName='',
    ...props
    }:PasswordInputProps) => {

        const [showPassword, setShowPassword] = useState(false);
        const togglePasswordVisibility = () => {
            setShowPassword(!showPassword);
        }
    
    return (
        <>
        {label && (
        <label htmlFor={props.name}
         className={`font-semibold mb-2 block ${lableClassName}`}>
            {label}
            </label>
        )}
        <div className='relative'>
            <input type={showPassword ? 'text' : 'password'}
              className={`px-4 py-3 border bg-gray-200 rounded-lg w-full block outline-none ${inputClassName}`}
              {...props}
              />
              <button type='button' onClick={togglePasswordVisibility} 
              className={`absolute outline-none right-4 top-3 p-0 ${iconClassName}`}
              >{showPassword? (
                <Eye className='h-5 w-5' />
              ):(
                <EyeClosed className='h-5 w-5' />
              )}
                </button>    
        </div>
        </>
    );
};

export default PasswordInput;
