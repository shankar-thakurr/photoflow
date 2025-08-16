import { Post, User } from '@/.types';
import React, { useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { handleAuthRequest } from '../utils/apiRequest';
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Ellipsis, Loader, AlertTriangle, Edit3, UserPlus, UserMinus, Flag, Trash2, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import axios, { AxiosResponse } from 'axios';
import { BASE_API_URL } from '@/server';
import { setPosts } from '@/store/postSlice';
import { login } from '@/store/authSlice';
import { RootState } from '@/store/store';

type Props = {
    post: Post | null;
    user: User | null;
    onPostDeleted?: (postId: string) => void;
    onUserFollowed?: (userId: string) => void;
    onUserUnfollowed?: (userId: string) => void;
}

type ActionType = 'follow' | 'unfollow' | 'delete' | 'report' | null;

const DotButton = ({ post, user, onPostDeleted, onUserFollowed, onUserUnfollowed }: Props) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentAction, setCurrentAction] = useState<ActionType>(null);
    const [error, setError] = useState<string | null>(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    
    const dispatch = useDispatch();
    const posts = useSelector((state: RootState) => state.posts.posts);
    
    // Memoized computed values
    const isOwnPost = useMemo(() => post?.user?._id === user?._id, [post?.user?._id, user?._id]);
    const postUserId = useMemo(() => post?.user?._id, [post?.user?._id]);
    const isFollowing = useMemo(() => 
        !!postUserId && !!user?.followings?.includes(postUserId), 
        [postUserId, user?.followings]
    );

    // Clear error when dialog closes
    const handleDialogChange = useCallback((open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            setError(null);
            setCurrentAction(null);
            setShowConfirmDelete(false);
        }
    }, []);

    // Generic API request handler with error handling
    const executeAction = useCallback(async (
        actionType: ActionType,
        requestFn: () => Promise<AxiosResponse>,
        successCallback?: (result: AxiosResponse) => void
    ) => {
        if (currentAction) return; // Prevent multiple simultaneous actions
        
        try {
            setCurrentAction(actionType);
            setError(null);
            
            const result = await handleAuthRequest(requestFn, () => {});
            
            if (result) {
                successCallback?.(result);
                setIsDialogOpen(false);
            } else {
                setError('Operation failed. Please try again.');
            }
        } catch (error) {
            console.error(`Error during ${actionType}:`, error);
            setError(
                error instanceof Error 
                    ? error.message 
                    : `Failed to ${actionType}. Please try again.`
            );
        } finally {
            setCurrentAction(null);
        }
    }, [currentAction]);

    // Delete post handler
    const handleDeletePost = useCallback(async () => {
        if (!post?._id || !showConfirmDelete) {
            setShowConfirmDelete(true);
            return;
        }
        
        await executeAction(
            'delete',
            () => axios.delete(`${BASE_API_URL}/posts/delete/${post._id}`, { withCredentials: true }),
            () => {
                const updatedPosts = posts.filter(p => p._id !== post._id);
                dispatch(setPosts(updatedPosts));
                onPostDeleted?.(post._id);
            }
        );
    }, [post?._id, posts, dispatch, executeAction, onPostDeleted, showConfirmDelete]);

    // Follow user handler - FIXED ENDPOINT AND RESPONSE HANDLING
    const handleFollow = useCallback(async () => {
        if (!postUserId) return;
        
        await executeAction(
            'follow',
            () => axios.post(`${BASE_API_URL}/users/follow-unfollow/${postUserId}`, {}, { withCredentials: true }),
            (result) => {
                // Handle both possible response structures
                const user = result.data?.data?.user || result.data?.user;
                if (user) {
                    dispatch(login(user));
                    onUserFollowed?.(postUserId);
                }
            }
        );
    }, [postUserId, executeAction, dispatch, onUserFollowed]);

    // Unfollow user handler - FIXED ENDPOINT AND RESPONSE HANDLING
    const handleUnfollow = useCallback(async () => {
        if (!postUserId) return;
        
        await executeAction(
            'unfollow',
            () => axios.post(`${BASE_API_URL}/users/follow-unfollow/${postUserId}`, {}, { withCredentials: true }),
            (result) => {
                // Handle both possible response structures
                const user = result.data?.data?.user || result.data?.user;
                if (user) {
                    dispatch(login(user));
                    onUserUnfollowed?.(postUserId);
                }
            }
        );
    }, [postUserId, executeAction, dispatch, onUserUnfollowed]);

    // Report post handler
    const handleReport = useCallback(async () => {
        if (!post?._id) return;
        
        await executeAction(
            'report',
            () => axios.post(`${BASE_API_URL}/posts/report/${post._id}`, {}, { withCredentials: true }),
            () => {
                // Show success message or toast notification here
                console.log('Post reported successfully');
            }
        );
    }, [post?._id, executeAction]);

    // Edit post handler (placeholder)
    const handleEditPost = useCallback(() => {
        setIsDialogOpen(false);
        // TODO: Implement edit functionality
        // This could open an edit modal or navigate to edit page
        console.log('Edit post functionality to be implemented');
    }, []);

    // Copy post link handler
    const handleCopyLink = useCallback(async () => {
        try {
            const postUrl = `${window.location.origin}/post/${post?._id}`;
            await navigator.clipboard.writeText(postUrl);
            setIsDialogOpen(false);
            // Show success toast
            console.log('Link copied to clipboard');
        } catch (error) {
            console.error('Failed to copy link:', error);
            setError('Failed to copy link to clipboard');
        }
    }, [post?._id]);

    // Render nothing if essential props are missing
    if (!post || !user) {
        return (
            <div className="w-6 h-6 flex items-center justify-center">
                <Ellipsis className="w-5 h-5 text-gray-400" />
            </div>
        );
    }

    const isLoading = currentAction !== null;

    return (
        <div>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                <DialogTrigger asChild>
                    <button 
                        className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        aria-label="Post options"
                        type="button"
                    >
                        <Ellipsis className="w-5 h-5 text-gray-700" />
                    </button>
                </DialogTrigger>
                
                <DialogContent className="sm:max-w-md p-0 gap-0">
                    <DialogTitle className="sr-only">Post Options</DialogTitle>
                    
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">{post.user?.username}</p>
                                <p className="text-xs text-gray-500">
                                    {isOwnPost ? 'Your post' : `@${post.user?.username}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="p-4 border-b border-gray-200">
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col">
                        {/* Follow/Unfollow - Only for other users' posts */}
                        {!isOwnPost && (
                            <Button 
                                variant="ghost" 
                                onClick={isFollowing ? handleUnfollow : handleFollow} 
                                className="justify-start h-12 rounded-none border-b border-gray-100 px-4"
                                disabled={isLoading}
                            >
                                {currentAction === (isFollowing ? 'unfollow' : 'follow') && (
                                    <Loader className="w-4 h-4 mr-3 animate-spin" />
                                )}
                                {!isLoading && (
                                    <>
                                        {isFollowing ? (
                                            <UserMinus className="w-4 h-4 mr-3 text-red-600" />
                                        ) : (
                                            <UserPlus className="w-4 h-4 mr-3 text-blue-600" />
                                        )}
                                    </>
                                )}
                                <span className={isFollowing ? 'text-red-600' : 'text-blue-600'}>
                                    {isFollowing ? 'Unfollow' : 'Follow'} @{post.user?.username}
                                </span>
                            </Button>
                        )}

                        {/* Edit - Only for own posts */}
                        {isOwnPost && (
                            <Button 
                                variant="ghost" 
                                onClick={handleEditPost}
                                className="justify-start h-12 rounded-none border-b border-gray-100 px-4"
                                disabled={isLoading}
                            >
                                <Edit3 className="w-4 h-4 mr-3 text-gray-600" />
                                Edit Post
                            </Button>
                        )}

                        {/* Copy Link */}
                        <Button 
                            variant="ghost" 
                            onClick={handleCopyLink}
                            className="justify-start h-12 rounded-none border-b border-gray-100 px-4"
                            disabled={isLoading}
                        >
                            <svg className="w-4 h-4 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy Link
                        </Button>

                        {/* About Account */}
                        <DialogClose asChild>
                            <Link href={`/profile/${post.user?._id}`}>
                                <Button 
                                    variant="ghost" 
                                    className="justify-start h-12 rounded-none border-b border-gray-100 px-4 w-full"
                                >
                                    <UserIcon className="w-4 h-4 mr-3 text-gray-600" />
                                    About this account
                                </Button>
                            </Link>
                        </DialogClose>

                        {/* Report - Only for other users' posts */}
                        {!isOwnPost && (
                            <Button 
                                variant="ghost" 
                                onClick={handleReport}
                                className="justify-start h-12 rounded-none border-b border-gray-100 px-4 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                disabled={isLoading}
                            >
                                {currentAction === 'report' && (
                                    <Loader className="w-4 h-4 mr-3 animate-spin" />
                                )}
                                {currentAction !== 'report' && (
                                    <Flag className="w-4 h-4 mr-3" />
                                )}
                                Report Post
                            </Button>
                        )}

                        {/* Delete - Only for own posts */}
                        {isOwnPost && (
                            <div>
                                {!showConfirmDelete ? (
                                    <Button 
                                        variant="ghost" 
                                        onClick={handleDeletePost}
                                        className="justify-start h-12 rounded-none border-b border-gray-100 px-4 text-red-600 hover:text-red-700 hover:bg-red-50 w-full"
                                        disabled={isLoading}
                                    >
                                        <Trash2 className="w-4 h-4 mr-3" />
                                        Delete Post
                                    </Button>
                                ) : (
                                    <div className="p-4 border-b border-gray-100 bg-red-50">
                                        <p className="text-sm text-red-800 mb-3 font-medium">
                                            Are you sure you want to delete this post? This action cannot be undone.
                                        </p>
                                        <div className="flex space-x-2">
                                            <Button 
                                                size="sm"
                                                variant="destructive"
                                                onClick={handleDeletePost}
                                                disabled={isLoading}
                                                className="flex-1"
                                            >
                                                {currentAction === 'delete' && (
                                                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                                                )}
                                                Delete
                                            </Button>
                                            <Button 
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setShowConfirmDelete(false)}
                                                disabled={isLoading}
                                                className="flex-1"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Close Button */}
                        <DialogClose asChild>
                            <Button 
                                variant="ghost" 
                                className="justify-center h-12 rounded-none font-medium"
                                disabled={isLoading}
                            >
                                Close
                            </Button>
                        </DialogClose>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default React.memo(DotButton);