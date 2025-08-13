'use client'
import { User } from '@/.types';
import { BASE_API_URL } from '@/server';
import { RootState } from '@/store/store';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { handleAuthRequest } from '../utils/apiRequest';
import { Bookmark, Grid, Loader, MenuIcon, X } from 'lucide-react';
import LeftSidebar from '../Home/LeftSidebar';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Link from 'next/link';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import Post from './Post';
import Save from './Save';

type Props ={
    id: string
}
const Profile = ({id}: Props) => {
    console.log('COMPONENT CALLED',id)
    const router = useRouter()

    const user = useSelector((state: RootState) => state.auth.user)
    const [postOrSave, setpostOrSave] = useState<string>('POST')
    const [isLoading, setisLoading] = useState(false)
    const [userProfile, setUserProfile] = useState<User>()
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const handleSheetClose = () => setIsSheetOpen(false);

    const isOwnProfile = user?._id === id
    const isFollowing = user?.followings?.includes(id)

    console.log("IS OWN PROFILE",isOwnProfile)
    console.log("User",userProfile)

    useEffect(() => {
        if(!user){
            router.push('/auth/login')
        }
        const getUser=async() =>{
            const getUserRequest = async () => await axios.get(`${BASE_API_URL}/users/profile/${id}`, { withCredentials: true });
            const result = await handleAuthRequest(getUserRequest,setisLoading);
            if(result){
                setUserProfile(result?.data.data.user)
            }
        }
        getUser()
    },[user,router,id])

    if (isLoading) {
        return (
            <div className="w-full h-screen flex items-center justify-center">
                <Loader className="w-12 h-12 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!userProfile) {
        return (
            <div className="w-full h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold mb-2">User Not Found</h2>
                    <p className="text-gray-600">
                        Sorry, the profile you are looking for does not exist.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
      <div className="w-1/5 hidden md:block border-r-2 h-screen fixed">
        <LeftSidebar />
      </div>
      <div className="flex-1 md:ml-[20%]">
        <header className="flex items-center justify-between p-4 border-b md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <button
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Open navigation menu"
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
        </header>
        <main className="p-4 sm:p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:space-x-8 pb-8 border-b">
              <Avatar className="w-32 h-32 md:w-40 md:h-40 mb-6 md:mb-0">
                <AvatarImage src={userProfile?.profilePicture} className="object-cover" />
                <AvatarFallback className="text-4xl">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start space-x-4 mb-4">
                  <h1 className="text-2xl md:text-3xl font-bold">{userProfile.username}</h1>
                  {isOwnProfile && (
                    <Link href="/edit-profile">
                      <Button variant="secondary">Edit Profile</Button>
                    </Link>
                  )}
                  {!isOwnProfile && (
                    <div className="flex items-center space-x-2">
                      <Button variant={isFollowing ? 'destructive' : 'secondary'}>
                        {isFollowing ? 'Unfollow' : 'Follow'}
                      </Button>
                      <Button variant="secondary">Message</Button>
                    </div>
                  )}
                </div>
                <div className="flex justify-center md:justify-start space-x-6 mb-4">
                  <div>
                    <span className="font-bold">{userProfile.posts?.length}</span>
                    <span className="text-gray-600 ml-1">Posts</span>
                  </div>
                  <div>
                    <span className="font-bold">{userProfile.followers?.length}</span>
                    <span className="text-gray-600 ml-1">Followers</span>
                  </div>
                  <div>
                    <span className="font-bold">{userProfile.followings?.length}</span>
                    <span className="text-gray-600 ml-1">Following</span>
                  </div>
                </div>
                <p className="text-gray-800 max-w-md mx-auto md:mx-0">{userProfile?.bio || 'No bio yet.'}</p>
              </div>
            </div>

            {/* Post/Saved Tabs */}
            <div className="mt-8">
              <div className="flex items-center justify-center space-x-8 border-b">
                <div
                  className={cn(
                    'flex items-center space-x-2 cursor-pointer py-2 border-b-2',
                    postOrSave === 'POST'
                      ? 'border-blue-500 text-blue-500'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  )}
                  onClick={() => setpostOrSave('POST')}
                >
                  <Grid />
                  <span className="font-semibold">Posts</span>
                </div>
                <div
                  className={cn(
                    'flex items-center space-x-2 cursor-pointer py-2 border-b-2',
                    postOrSave === 'SAVE'
                      ? 'border-blue-500 text-blue-500'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  )}
                  onClick={() => setpostOrSave('SAVE')}
                >
                  <Bookmark/>
                  <span className="font-semibold">Saved Posts</span>
                </div>
              </div>
            </div>
            {postOrSave === "POST" && <Post userProfile={userProfile} />}
           {postOrSave === "SAVE" && <Save userProfile={userProfile} />}

          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
