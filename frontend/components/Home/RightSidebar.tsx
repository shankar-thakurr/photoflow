'use client'
import { User } from '@/.types';
import { BASE_API_URL } from '@/server';
import { RootState } from '@/store/store';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { handleAuthRequest } from '../utils/apiRequest';
import { Loader, UserPlus, UserCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { toast } from 'sonner';

interface FollowingState {
  [userId: string]: boolean;
}

const RightSidebar = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followingUsers, setFollowingUsers] = useState<FollowingState>({});
  const [processingFollow, setProcessingFollow] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getSuggestedUsers = async () => {
      try {
        const getSuggestedUsersRequest = async () => 
          await axios.get(`${BASE_API_URL}/users/suggested-users`, { withCredentials: true });

        const result = await handleAuthRequest(getSuggestedUsersRequest, setIsLoading);
        
        if (result) {
          setSuggestedUsers(result.data.data.users || []);
          setError(null);
          
          // Initialize following state
          const initialFollowState: FollowingState = {};
          result.data.data.users?.forEach((suggestedUser: User) => {
            initialFollowState[suggestedUser._id] = false;
          });
          setFollowingUsers(initialFollowState);
        }
      } catch (err) {
        setError('Failed to load suggested users');
        console.error('Error fetching suggested users:', err);
      }
    };
    
    getSuggestedUsers();
  }, []);

  const handleFollowToggle = async (userId: string, username: string) => {
    if (processingFollow === userId) return;

    try {
      setProcessingFollow(userId);
      const isCurrentlyFollowing = followingUsers[userId];
      
      const endpoint = isCurrentlyFollowing 
        ? `${BASE_API_URL}/users/unfollow/${userId}`
        : `${BASE_API_URL}/users/follow/${userId}`;
      
      const followRequest = async () => await axios.post(endpoint, {}, { withCredentials: true });
      const result = await handleAuthRequest(followRequest, () => {});
      
      if (result) {
        setFollowingUsers(prev => ({
          ...prev,
          [userId]: !isCurrentlyFollowing
        }));
        
        toast.success(
          isCurrentlyFollowing 
            ? `Unfollowed ${username}` 
            : `Following ${username}`
        );
      }
    } catch (err) {
      console.error('Follow/unfollow error:', err);
      toast.error('Failed to update follow status');
    } finally {
      setProcessingFollow(null);
    }
  };

  const handleUserClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const handleSwitchAccount = () => {
    // Implement switch account logic or show account switcher modal
    toast.info('Account switching feature coming soon!');
  };

  const handleSeeAllUsers = () => {
    router.push('/discover');
  };

  if (isLoading) {
    return (
      <div className='w-full h-screen flex items-center justify-center'>
        <Loader className="animate-spin h-6 w-6 text-gray-500" />
      </div>
    );
  }

  return (
    <div className='p-4 max-w-sm'>
      {/* Current User Section */}
      <div className='flex items-center justify-between mb-8'>
        <div 
          className='flex items-center space-x-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity'
          onClick={() => handleUserClick(user?._id || '')}
        >
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.profilePicture} className='object-cover' />
            <AvatarFallback className="text-sm">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm truncate">{user?.username}</h2>
            <p className="text-gray-500 text-xs truncate">
              {user?.bio || "Welcome to my profile"}
            </p>
          </div>
        </div>
        <button 
          onClick={handleSwitchAccount}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium ml-2 transition-colors"
        >
          Switch
        </button>
      </div>

      {/* Suggested Users Section */}
      <div>
        <div className='flex items-center justify-between mb-4'>
          <h3 className="font-semibold text-gray-600 text-sm">Suggested for you</h3>
          <button 
            onClick={handleSeeAllUsers}
            className="text-gray-900 hover:text-gray-700 text-xs font-medium transition-colors"
          >
            See All
          </button>
        </div>

        {error ? (
          <div className="text-red-500 text-sm text-center py-4">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:text-blue-700 text-xs mt-2 underline"
            >
              Try again
            </button>
          </div>
        ) : suggestedUsers.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-4">
            <p>No suggestions available</p>
            <button 
              onClick={handleSeeAllUsers}
              className="text-blue-600 hover:text-blue-700 text-xs mt-2 underline"
            >
              Explore users
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestedUsers.slice(0, 5).map((suggestedUser) => {
              const isFollowing = followingUsers[suggestedUser._id];
              const isProcessing = processingFollow === suggestedUser._id;
              
              return (
                <div 
                  key={suggestedUser._id} 
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div 
                    className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleUserClick(suggestedUser._id)}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={suggestedUser?.profilePicture} className='object-cover' />
                      <AvatarFallback className="text-xs">
                        {suggestedUser?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate group-hover:text-gray-900 transition-colors">
                        {suggestedUser.username}
                      </h4>
                      <p className="text-gray-500 text-xs truncate">
                        {suggestedUser.bio || "New to the platform"}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollowToggle(suggestedUser._id, suggestedUser.username);
                    }}
                    disabled={isProcessing}
                    className={`
                      flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ml-2 transition-all
                      ${isFollowing 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                      }
                      ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {isProcessing ? (
                      <Loader className="w-3 h-3 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserCheck className="w-3 h-3" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Additional Suggestions */}
      {suggestedUsers.length > 5 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <button 
            onClick={handleSeeAllUsers}
            className="w-full text-center text-blue-600 hover:text-blue-700 text-sm font-medium py-2 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Show {suggestedUsers.length - 5} more suggestions
          </button>
        </div>
      )}
    </div>
  );
};

export default RightSidebar;