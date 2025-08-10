"use client"
import { Eye, EyeClosed } from 'lucide-react';
import React, { useState } from 'react';

interface PasswordInputProps {
    name:string,
    label?:string,
    placeholder?:string,
    value?:string,
    onChange?:(e:React.ChangeEvent<HTMLInputElement>)=>void,
    onKeyPress?:(e:React.KeyboardEvent<HTMLInputElement>)=>void,
    disabled?:boolean,
    error?:string,
    required?:boolean,
    autoComplete?:string,
    inputClassName?:string
    lableClassName?:string
    iconClassName?:string
}
const PasswordInput = ({
    name,
    label,
    placeholder="Enter Password",
    value,
    onChange,
    inputClassName='',
    lableClassName='', 
    iconClassName=''
    }:PasswordInputProps) => {

        const [showPassword, setShowPassword] = useState(false);
        const togglePasswordVisibility = () => {
            setShowPassword(!showPassword);
        }
    
    return (
        <>
        {label && (
        <label htmlFor={name}
         className={`font-semibold mb-2 block ${lableClassName}`}>
            {label}
            </label>
        )}
        <div className='relative'>
            <input type={showPassword ? 'text' : 'password'}
            placeholder={placeholder}
             value={value}
              onChange={onChange}
              name={name} 
              className={`px-4 py-3 border bg-gray-200 rounded-lg w-full block outline-none ${inputClassName}`}/>
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
