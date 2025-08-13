'use client'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Heart, HomeIcon, LogOutIcon, MessageCircle, Search, SquarePlus } from 'lucide-react';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { logout } from '@/store/authSlice';
import axios from 'axios';
import { BASE_API_URL } from '@/server';
import { toast } from 'sonner';

interface LeftSidebarProps {
  onNavigate?: () => void; // For mobile sheet closing
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ onNavigate }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      await axios.post(`${BASE_API_URL}/users/logout`, {}, {
        withCredentials: true
      });
      
      dispatch(logout());
      toast.success('Logout successful');
      router.push('/auth/login');
      onNavigate?.(); // Close mobile menu if applicable
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNavigation = (label: string, path?: string) => {
    if (label === 'Logout') {
      handleLogout();
      return;
    }
    
    if (path) {
      router.push(path);
      onNavigate?.(); // Close mobile menu if applicable
    }
  };

  const sidebarLinks = [
    {
      icon: <HomeIcon className="w-6 h-6" />,
      label: "Home",
      path: "/",
      isActive: pathname === "/"
    },
    {
      icon: <Search className="w-6 h-6" />,
      label: "Search", 
      path: "/search",
      isActive: pathname === "/search"
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      label: "Messages",
      path: "/messages",
      isActive: pathname === "/messages"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      label: "Notifications",
      path: "/notifications", 
      isActive: pathname === "/notifications"
    },
    {
      icon: <SquarePlus className="w-6 h-6" />,
      label: "Create",
      path: "/create",
      isActive: pathname === "/create"
    },
    {
      icon: (
        <Avatar className='w-6 h-6'>
          <AvatarImage src={user?.profilePicture} className='object-cover' />
          <AvatarFallback className="text-xs">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      ),
      label: "Profile",
      path: `/profile/${user?._id}`,
      isActive: pathname?.startsWith('/profile')
    },
    {
      icon: <LogOutIcon className="w-6 h-6" />,
      label: "Logout",
      isLogout: true
    }
  ];

  return (
    <nav className="h-full flex flex-col" role="navigation" aria-label="Main navigation">
      {/* Logo Section */}
      <div className="p-4 lg:p-6">
        <button
          onClick={() => handleNavigation('Home', '/')}
          className="block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
          aria-label="Go to home"
        >
          <Image 
            src='/image/logo.jpg' 
            width={120} 
            height={40} 
            alt='App Logo' 
            className='h-10 w-auto object-contain'
            priority
          />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-2 lg:px-4">
        <ul className="space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = link.isActive;
            const isDisabled = link.isLogout && isLoggingOut;
            
            return (
              <li key={link.label}>
                <button
                  onClick={() => handleNavigation(link.label, link.path)}
                  disabled={isDisabled}
                  className={`
                    w-full flex items-center px-3 py-3 rounded-xl text-left transition-all duration-200 group
                    ${isActive 
                      ? 'bg-gray-100 text-gray-900 font-semibold' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  `}
                  aria-label={`${link.label}${isActive ? ' (current page)' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className={`
                    mr-4 transition-transform duration-200
                    ${isActive ? 'scale-110' : 'group-hover:scale-105'}
                  `}>
                    {link.icon}
                  </div>
                  <span className="text-base lg:text-lg font-medium">
                    {link.label}
                    {isDisabled && '...'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* User Info Section (Optional) */}
      <div className="p-4 border-t border-gray-200 hidden lg:block">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.profilePicture} className="object-cover" />
            <AvatarFallback className="text-sm">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.username || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LeftSidebar;