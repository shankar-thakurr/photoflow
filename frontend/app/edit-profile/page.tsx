'use client'
import PasswordInput from '@/components/Auth/PasswordInput';
import LoadingButton from '@/components/Helper/LoadingButton';
import LeftSidebar from '@/components/Home/LeftSidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { handleAuthRequest } from '@/components/utils/apiRequest';
import { BASE_API_URL } from '@/server';
import { RootState } from '@/store/store';
import { login } from '@/store/authSlice';
import axios from 'axios';
import { MenuIcon, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';

const EditProfilePage = () => {
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.auth.user);

    const [selectedImage, setSelectedImage] = useState<string | null>(user?.profilePicture || null);
    const [bio, setBio] = useState(user?.bio || "");
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [isBioLoading, setIsBioLoading] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Add file validation
            if (!file.type.startsWith('image/')) {
                toast.error('Please select a valid image file');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error('Image size must be less than 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                setSelectedImage(reader.result as string);
            };
            reader.onerror = () => {
                toast.error('Failed to read image file');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateProfile = async () => {
        if (!fileInputRef.current?.files?.[0]) {
            toast.error("Please select an image first");
            return;
        }

        try {
            const formdata = new FormData();
            formdata.append('profilePicture', fileInputRef.current.files[0]);
            
            const updateProfileRequest = () => axios.post(`${BASE_API_URL}/users/edit-profile`, formdata, { 
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            
            const result = await handleAuthRequest(updateProfileRequest, setIsProfileLoading);
            
            if (result?.data?.data?.user) {
                dispatch(login(result.data.data.user));
                toast.success('Profile picture updated successfully');
                
                // Reset file input after successful update
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                setSelectedImage(result.data.data.user.profilePicture);
            } else {
                toast.error('Failed to update profile picture');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            toast.error('An unexpected error occurred');
        }
    };

    const handleUpdateBio = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (bio.length > 150) {
            toast.error("Bio cannot be more than 150 characters.");
            return;
        }

        try {
            const formdata = new FormData();
            formdata.append('bio', bio.trim());
            
            const updateBioRequest = () => axios.post(`${BASE_API_URL}/users/edit-profile`, formdata, { 
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            
            const result = await handleAuthRequest(updateBioRequest, setIsBioLoading);
            
            if (result?.data?.data?.user) {
                dispatch(login(result.data.data.user));
                toast.success('Bio updated successfully');
            } else {
                toast.error('Failed to update bio');
            }
        } catch (error) {
            console.error('Bio update error:', error);
            toast.error('An unexpected error occurred');
        }
    };

    const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        // Enhanced validation
        if (!currentPassword.trim()) {
            toast.error('Current password is required');
            return;
        }
        
        if (newPassword !== newPasswordConfirm) {
            toast.error("New passwords do not match.");
            return;
        }
        
        if (!newPassword || newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long.");
            return;
        }
        
        if (currentPassword === newPassword) {
            toast.error("New password must be different from current password.");
            return;
        }

        try {
            const data = {
                currentPassword: currentPassword.trim(),
                newPassword: newPassword.trim(),
                newPasswordConfirm: newPasswordConfirm.trim()
            };
            
            const updatePasswordRequest = () => axios.post(`${BASE_API_URL}/users/change-password`, data, { 
                withCredentials: true 
            });
            
            const result = await handleAuthRequest(updatePasswordRequest, setIsPasswordLoading);
            
            if (result?.data?.data?.user) {
                dispatch(login(result.data.data.user));
                toast.success('Password updated successfully');
                
                // Clear form after successful update
                setCurrentPassword('');
                setNewPassword('');
                setNewPasswordConfirm('');
            } else {
                toast.error('Failed to update password');
            }
        } catch (error) {
            console.error('Password update error:', error);
            toast.error('An unexpected error occurred');
        }
    };

    const handleSheetClose = () => {
        setIsSheetOpen(false);
    };

    const getUserInitials = () => {
        if (!user?.name && !user?.username && !user?.email) return 'U';
        const name = user?.name || user?.username || user?.email || 'User';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className='flex'>
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                            <button
                                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                                aria-label="Open navigation menu"
                                type="button"
                            >
                                <MenuIcon className="h-6 w-6" />
                            </button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-80 p-0">
                            <div className="flex items-center justify-between p-4 border-b">
                                <SheetTitle className="text-lg font-semibold">Navigation</SheetTitle>
                                <button
                                    onClick={handleSheetClose}
                                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                                    aria-label="Close navigation menu"
                                    type="button"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <SheetDescription className="sr-only">
                                Main navigation menu for the application
                            </SheetDescription>
                            <div className="overflow-y-auto">
                                <LeftSidebar />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Desktop Left Sidebar */}
            <aside className="hidden md:block w-64 lg:w-80 fixed left-0 top-0 h-screen border-r border-gray-200 bg-white overflow-y-auto z-10">
                <div className="p-4">
                    <LeftSidebar />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 lg:ml-80 p-6 mt-16 md:mt-0">
                <div className='max-w-2xl mx-auto'>
                    <div className='pb-10 border-b-2'>
                        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>
                        <div className='flex flex-col items-center'>
                            <label htmlFor="profilePictureInput" className='cursor-pointer'>
                                <Avatar className='w-40 h-40'>
                                    <AvatarImage src={selectedImage || ""} alt="Profile picture" />
                                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                                </Avatar>
                            </label>
                            <input 
                                id="profilePictureInput" 
                                type="file" 
                                accept='image/jpeg,image/jpg,image/png,image/webp' 
                                className='hidden' 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                            />
                            <span className="text-sm text-gray-500 mt-2">Click avatar to change image</span>
                            
                            {/* Profile Picture Button */}
                            <div className='mt-4'>
                                <LoadingButton 
                                    isLoading={isProfileLoading} 
                                    onClick={handleUpdateProfile}
                                    type="button"
                                    size={"lg"} 
                                    className="bg-green-600 hover:bg-green-700"
                                    disabled={isProfileLoading || !fileInputRef.current?.files?.[0]}
                                >
                                    Change Profile Picture
                                </LoadingButton>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateBio} className="mt-8">
                            <label htmlFor='bio' className="block text-lg font-bold mb-2">
                                Bio
                            </label>
                            <textarea
                                id='bio'
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className='w-full h-28 bg-gray-100 outline-none p-4 rounded-md'
                                placeholder='Write something about yourself...'
                                maxLength={150}
                            />
                            <p className="text-sm text-gray-500 mt-1 text-right">{bio.length}/150</p>
                            
                            {/* Bio Update Button */}
                            <div className='mt-6'>
                                <LoadingButton 
                                    isLoading={isBioLoading} 
                                    type='submit' 
                                    size={"lg"} 
                                    className="bg-blue-700"
                                    disabled={isBioLoading}
                                >
                                    Update Bio
                                </LoadingButton>
                            </div>
                        </form>
                    </div>

                    <form className="mt-10" onSubmit={handlePasswordChange}>
                        <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
                        <div className="space-y-6 mt-6">
                            <PasswordInput
                                name='currentPassword'
                                label='Current Password'
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder='Enter your current password'
                                aria-label="Current Password"
                                required
                            />
                            <PasswordInput
                                name='newPassword'
                                label='New Password'
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder='Enter your new password'
                                aria-label="New Password"
                                required
                            />
                            <PasswordInput
                                name='confirmNewPassword'
                                label='Confirm New Password'
                                value={newPasswordConfirm}
                                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                                placeholder='Confirm your new password'
                                aria-label="Confirm New Password"
                                required
                            />
                        </div>
                        <div className='mt-6'>
                            <LoadingButton 
                                isLoading={isPasswordLoading} 
                                type='submit' 
                                className="bg-red-700"
                                disabled={isPasswordLoading}
                            >
                                Change Password
                            </LoadingButton>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default EditProfilePage;