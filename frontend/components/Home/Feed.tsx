'use client'
import { BASE_API_URL } from '@/server';
import { RootState } from '@/store/store';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { handleAuthRequest } from '../utils/apiRequest';
import { setPosts } from '@/store/postSlice';
import { login } from '@/store/authSlice';
import axios from 'axios';
import { Bookmark, HeartIcon, Loader, MessageSquare, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import DotButton from '../Helper/DotButton';
import Image from 'next/image';
import Comment from '../Helper/Comment';
import { Post, User } from '@/.types';

const Feed = () => {
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [isCommentOpen, setIsCommentOpen] = useState(false);
    const [comment, setComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [likingPostId, setLikingPostId] = useState<string | null>(null);
    const [savingPostId, setSavingPostId] = useState<string | null>(null);

    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.auth.user);
    const posts = useSelector((state: RootState) => state.posts.posts);

    // Get the current selected post from posts array
    const selectedPost = selectedPostId ? posts.find(post => post._id === selectedPostId) || null : null;

    useEffect(() => {
        const getAllPosts = async () => {
            try {
                setIsLoading(true);
                const getAllPostRequest = async () => await axios.get(`${BASE_API_URL}/posts/all`, { withCredentials: true });
                const result = await handleAuthRequest(getAllPostRequest, setIsLoading);
                if (result && result.data?.data?.posts) {
                    dispatch(setPosts(result.data.data.posts));
                }
            } catch (error) {
                console.error('Error fetching posts:', error);
            } finally {
                setIsLoading(false);
            }
        };
        getAllPosts();
    }, [dispatch]);

    const handleLikeOrDislike = async (id: string) => {
        if (likingPostId === id || !user) return; // Prevent multiple clicks and ensure user exists
        
        try {
            setLikingPostId(id);
            
            // Store original post for potential revert
            const originalPost = posts.find(post => post._id === id);
            if (!originalPost) return;

            // Optimistic update - immediately update UI
            const isCurrentlyLiked = originalPost.likes?.includes(user._id) || false;
            const updatedLikes = isCurrentlyLiked 
                ? (originalPost.likes || []).filter(likeId => likeId !== user._id)
                : [...(originalPost.likes || []), user._id];
            
            const optimisticUpdatedPosts = posts.map((post) => 
                post._id === id ? { ...post, likes: updatedLikes } : post
            );
            dispatch(setPosts(optimisticUpdatedPosts));

            // Make API call
            const likeOrDislikeRequest = async () => 
                await axios.post(`${BASE_API_URL}/posts/like-unlike-post/${id}`, {}, { withCredentials: true });
            const result = await handleAuthRequest(likeOrDislikeRequest, () => {});
            
            if (result && result.data?.data?.post) {
                // Update with server response to ensure consistency
                const updatedPost = result.data.data.post;
                const serverUpdatedPosts = posts.map((post) => 
                    post._id === updatedPost._id ? updatedPost : post
                );
                dispatch(setPosts(serverUpdatedPosts));
            } else {
                // If API call failed, revert the optimistic update
                const revertedPosts = posts.map((post) => 
                    post._id === id ? originalPost : post
                );
                dispatch(setPosts(revertedPosts));
            }
        } catch (error) {
            console.error('Error liking/unliking post:', error);
            // Revert optimistic update on error
            const originalPost = posts.find(post => post._id === id);
            if (originalPost) {
                const revertedPosts = posts.map((post) => 
                    post._id === id ? originalPost : post
                );
                dispatch(setPosts(revertedPosts));
            }
        } finally {
            setLikingPostId(null);
        }
    };

    const handleSaveUnsave = async (id: string) => {
        if (savingPostId === id || !user) return; // Prevent multiple clicks and ensure user exists

        const originalUser = user;
        const postToUpdate = posts.find(p => p._id === id);
        if (!postToUpdate) return;

        const isCurrentlySaved = user.savedPosts.some(p => (typeof p === 'string' ? p : p._id) === id);

        // Optimistic update
        const updatedSavedPosts = isCurrentlySaved
            ? user.savedPosts.filter(p => (typeof p === 'string' ? p : p._id) !== id)
            : [...user.savedPosts, postToUpdate];
        
        const optimisticUser = { ...user, savedPosts: updatedSavedPosts };
        dispatch(login(optimisticUser as User));

        try {
            setSavingPostId(id);
            const saveUnsaveRequest = async () => 
                await axios.post(`${BASE_API_URL}/users/save-unsave/${id}`, {}, { withCredentials: true });
            
            await handleAuthRequest(saveUnsaveRequest, () => {});

        } catch (error) {
            console.error('Error saving/unsaving post:', error);
            // Revert on error
            dispatch(login(originalUser));
        } finally {
            setSavingPostId(null);
        }
    };

    const handleComment = async (id: string) => {
        if (!comment.trim()) return;
        
        try {
            const addCommentRequest = async () => 
                await axios.post(`${BASE_API_URL}/posts/add-comment/${id}`, { text: comment }, { withCredentials: true });
            const result = await handleAuthRequest(addCommentRequest, () => {});
            if (result && result.data?.data?.comment) {
                const newComment = result.data.data.comment;
                const updatedPosts = posts.map((post) => {
                    if (post._id === id) {
                        return { ...post, comments: [...(post.comments || []), newComment] };
                    }
                    return post;
                });
                dispatch(setPosts(updatedPosts));
                setComment('');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent, postId: string) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleComment(postId);
        }
    };

    const openCommentModal = (post: Post) => {
        setSelectedPostId(post._id);
        setIsCommentOpen(true);
    };

    const closeCommentModal = () => {
        setIsCommentOpen(false);
        setSelectedPostId(null);
    };

    // Check if user has liked a post
    const isPostLiked = (post: Post) => {
        return post.likes?.includes(user?._id || '') || false;
    };

    // Check if post is saved
    const isPostSaved = (post: Post) => {
        return user?.savedPosts?.some((savedPost) => {
            if (typeof savedPost === 'string') {
                return savedPost === post._id;
            }
            return savedPost._id === post._id;
        }) || false;
    };

    // Handle loading state
    if (isLoading) {
        return (
            <div className='w-full h-screen flex items-center justify-center flex-col'>
                <Loader className="animate-spin mr-2" />
                <p className="mt-2">Loading posts...</p>
            </div>
        );
    }

    if (!posts || posts.length < 1) {
        return (
            <div className='text-3xl m-8 text-center capitalize font-bold'>
                No Posts To Show
            </div>
        );
    }

    return (
        <div className='mt-20 w-[70%] mx-auto max-w-2xl'>
            {/* Main Posts */}
            {posts.map((post) => (
                <div key={post._id} className='mt-8 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm'>
                    <div className='flex items-center justify-between p-4'>
                        {/* User info */}
                        {post.user && (
                            <div className='flex items-center space-x-3'>
                                <Avatar className='w-10 h-10'>
                                    {post.user?.profilePicture && (
                                        <AvatarImage 
                                            src={post.user.profilePicture} 
                                            className='h-full w-full object-cover' 
                                            alt={`${post.user.username}'s profile`}
                                        />
                                    )}
                                    <AvatarFallback className='bg-gray-200 text-gray-600'>
                                        {post.user?.username?.slice(0, 2).toUpperCase() || 'UN'}
                                    </AvatarFallback>
                                </Avatar>
                                <h1 className='font-semibold text-sm'>{post.user?.username}</h1>
                            </div>
                        )}
                        <DotButton  post={post} user={user}/>
                    </div>

                    {/* Image */}
                    {post.image && (
                        <div className='relative bg-gray-100'>
                            <Image
                                src={post.image.url}
                                alt="post"
                                width={600}
                                height={600}
                                className='w-full h-auto object-cover max-h-[600px]'
                                priority={false}
                            />
                        </div>
                    )}

                    <div className='p-4'>
                        <div className='flex items-center justify-between mb-4'>
                            <div className='flex items-center space-x-4'>
                                <button
                                    onClick={() => handleLikeOrDislike(post._id)}
                                    disabled={likingPostId === post._id}
                                    aria-label={isPostLiked(post) ? 'Unlike post' : 'Like post'}
                                    className={`transition-all duration-200 ${
                                        likingPostId === post._id ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
                                    }`}
                                >
                                    <HeartIcon
                                        className={`w-6 h-6 transition-colors ${
                                            isPostLiked(post) 
                                                ? 'text-red-500 fill-red-500' 
                                                : 'text-gray-700 hover:text-red-500'
                                        }`}
                                    />
                                </button>
                                <button 
                                    onClick={() => openCommentModal(post)}
                                    aria-label="Comment on post"
                                    className='hover:scale-110 transition-transform duration-200'
                                >
                                    <MessageSquare className='w-6 h-6 text-gray-700 hover:text-gray-500' />
                                </button>
                                <button 
                                    onClick={() => handleComment(post._id)}
                                    aria-label="Send comment"
                                    className='hover:scale-110 transition-transform duration-200'
                                    disabled={!comment.trim()}
                                >
                                    <Send className='w-6 h-6 text-gray-700 hover:text-gray-500' />
                                </button>
                            </div>
                            <button 
                                onClick={() => handleSaveUnsave(post._id)}
                                disabled={savingPostId === post._id}
                                aria-label={isPostSaved(post) ? 'Unsave post' : 'Save post'}
                                className={`transition-all duration-200 ${
                                    savingPostId === post._id ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
                                }`}
                            >
                                <Bookmark
                                    className={`w-6 h-6 transition-colors ${
                                        isPostSaved(post)
                                            ? 'text-blue-500 fill-blue-500' 
                                            : 'text-gray-700 hover:text-blue-500'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Likes count */}
                        {post.likes && post.likes.length > 0 && (
                            <div className='mb-2'>
                                <span className='text-sm font-semibold text-gray-900'>
                                    {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
                                </span>
                            </div>
                        )}
                        
                        {/* Caption */}
                        {post.caption && (
                            <div className='mb-2'>
                                <span className='font-semibold text-sm mr-2'>{post.user?.username}</span>
                                <span className='text-sm text-gray-900'>{post.caption}</span>
                            </div>
                        )}

                        {/* Show comments count */}
                        {post.comments && post.comments.length > 0 && (
                            <button 
                                className='text-sm text-gray-500 cursor-pointer hover:text-gray-700 mb-3 block'
                                onClick={() => openCommentModal(post)}
                            >
                                View all {post.comments.length} comment{post.comments.length !== 1 ? 's' : ''}
                            </button>
                        )}

                        {/* Add comment */}
                        <div className='flex items-center space-x-3 pt-3 border-t border-gray-100'>
                            <Avatar className='w-8 h-8 flex-shrink-0'>
                                {user?.profilePicture && (
                                    <AvatarImage 
                                        src={user.profilePicture} 
                                        className='h-full w-full object-cover'
                                        alt="Your profile"
                                    />
                                )}
                                <AvatarFallback className='bg-gray-200 text-gray-600 text-xs'>
                                    {user?.username?.slice(0, 2).toUpperCase() || 'YOU'}
                                </AvatarFallback>
                            </Avatar>
                            <input
                                type='text'
                                placeholder='Add a comment...'
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                onKeyPress={(e) => handleKeyPress(e, post._id)}
                                className='flex-1 outline-none border-none bg-transparent text-sm py-2 placeholder-gray-400'
                            />
                            <button 
                                onClick={() => handleComment(post._id)} 
                                className={`text-sm font-semibold transition-colors ${
                                    comment.trim() ? 'text-blue-500 hover:text-blue-700' : 'text-gray-400'
                                }`}
                                disabled={!comment.trim()}
                            >
                                Post
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            {/* Comment Modal */}
            {selectedPost && (
                <Comment
                    post={selectedPost}
                    isOpen={isCommentOpen}
                    onClose={closeCommentModal}
                />
            )}
        </div>
    );
};

export default Feed;
