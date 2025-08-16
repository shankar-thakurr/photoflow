'use client'
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Post } from '@/.types'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import Link from 'next/link'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import axios from 'axios'
import { BASE_API_URL } from '@/server'
import { handleAuthRequest } from '../utils/apiRequest'
import { setPosts } from '@/store/postSlice'
import { Send } from 'lucide-react'

interface CommentProps {
    post: Post | null,
    isOpen: boolean,
    onClose: () => void
}

const Comment = ({ post, isOpen, onClose }: CommentProps) => {
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.auth.user);
    const posts = useSelector((state: RootState) => state.posts.posts);

    if (!post) return null;

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        
        try {
            setIsLoading(true);
            const addCommentRequest = async () => 
                await axios.post(`${BASE_API_URL}/posts/add-comment/${post._id}`, { text: newComment }, { withCredentials: true });
            const result = await handleAuthRequest(addCommentRequest, setIsLoading);
            if (result && result.data?.data?.comment) {
                const commentData = result.data.data.comment;
                const updatedPosts = posts.map((p) => {
                    if (p._id === post._id) {
                        return { ...p, comments: [...(p.comments || []), commentData] };
                    }
                    return p;
                });
                dispatch(setPosts(updatedPosts));
                setNewComment('');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddComment();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className='min-w-[70vw] h-[80vh]'>
                <DialogHeader>
                    <DialogTitle>Comments</DialogTitle>
                </DialogHeader>
                <div className='flex h-full'>
                    {/* Image */}
                    <div className='w-1/2 h-full'>
                        {post.image && (
                            <Image 
                                src={post.image.url} 
                                alt='post' 
                                width={400} 
                                height={400} 
                                className='w-full h-full object-cover rounded-l-lg' 
                            />
                        )}
                    </div>
                    
                    {/* Comments section */}
                    <div className='w-1/2 flex flex-col p-4'>
                        {/* User info */}
                        <div className='flex items-center space-x-2 border-b pb-2 mb-4'>
                            <Avatar>
                                {post.user?.profilePicture && (
                                    <AvatarImage 
                                        src={post.user.profilePicture} 
                                        alt={`${post.user.username || 'User'}'s profile`}
                                    />
                                )}
                                <AvatarFallback>
                                    {post.user?.username?.slice(0, 2).toUpperCase() || 'UN'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className='font-semibold'>{post.user?.username || 'Unknown User'}</h1>
                                {post.caption && (
                                    <p className='text-sm text-gray-600 mt-1'>{post.caption}</p>
                                )}
                            </div>
                        </div>
                        
                        {/* Comments */}
                        <div className='flex-1 overflow-y-auto mb-4'>
                            {post.comments && post.comments.length > 0 ? (
                                <div className='space-y-4'>
                                    {post.comments.map(comment => (
                                        <div key={comment._id} className='flex items-start space-x-3'>
                                            <Avatar className='w-8 h-8 flex-shrink-0'>
                                                {comment.user?.profilePicture && (
                                                    <AvatarImage 
                                                        src={comment.user.profilePicture} 
                                                        alt={`${comment.user.username || 'User'}'s profile`}
                                                    />
                                                )}
                                                <AvatarFallback className='text-xs'>
                                                    {comment.user?.username?.slice(0, 2).toUpperCase() || 'UN'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className='flex-1'>
                                                <div className='bg-gray-100 rounded-lg px-3 py-2'>
                                                    <Link 
                                                        href={`/profile/${comment.user?._id}`} 
                                                        className='font-semibold text-sm hover:underline'
                                                    >
                                                        {comment.user?.username || 'Unknown User'}
                                                    </Link>
                                                    <p className='text-sm mt-1'>{comment.text}</p>
                                                </div>
                                                <span className='text-xs text-gray-500 mt-1 block'>
                                                    {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Unknown date'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className='flex items-center justify-center h-full'>
                                    <p className='text-gray-500 text-center'>No comments yet. Be the first to comment!</p>
                                </div>
                            )}
                        </div>

                        {/* Add comment */}
                        <div className='border-t pt-4'>
                            <div className='flex items-start space-x-3'>
                                <Avatar className='w-8 h-8 flex-shrink-0'>
                                    {user?.profilePicture && (
                                        <AvatarImage 
                                            src={user.profilePicture} 
                                            alt="Your profile"
                                        />
                                    )}
                                    <AvatarFallback className='text-xs'>
                                        {user?.username?.slice(0, 2).toUpperCase() || 'YOU'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className='flex-1 flex items-end space-x-2'>
                                    <textarea
                                        placeholder='Write a comment...'
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        className='flex-1 resize-none border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        rows={1}
                                        style={{ 
                                            minHeight: '36px',
                                            maxHeight: '100px',
                                            height: 'auto'
                                        }}
                                        disabled={isLoading}
                                    />
                                    <button 
                                        onClick={handleAddComment}
                                        disabled={!newComment.trim() || isLoading}
                                        className={`p-2 rounded-full transition-colors ${
                                            newComment.trim() && !isLoading
                                                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                                : 'bg-gray-200 text-gray-400'
                                        }`}
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default Comment