'use client';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { addPost } from '@/store/postSlice';
import { handleAuthRequest } from '../utils/apiRequest';
import axios from '@/lib/axios';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import LoadingButton from '../Helper/LoadingButton';
import { BASE_API_URL } from '@/server';
import { toast } from 'sonner';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

const CreatePost = ({ isOpen, onClose }: Props) => {
    const router = useRouter();
    const dispatch = useDispatch();
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [caption, setCaption] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Constants
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    // Reset form when dialog opens
    useEffect(() => {
        if (isOpen) {
            resetForm();
        }
    }, [isOpen]);

    // Cleanup preview URL when component unmounts or preview changes
    useEffect(() => {
        return () => {
            if (previewImage) {
                URL.revokeObjectURL(previewImage);
            }
        };
    }, [previewImage]);

    const resetForm = useCallback(() => {
        // Clean up existing preview URL
        if (previewImage) {
            URL.revokeObjectURL(previewImage);
        }
        
        setSelectedImage(null);
        setPreviewImage(null);
        setCaption('');
        setError(null);
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [previewImage]);

    const validateFile = (file: File): string | null => {
        // Check file type
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            return 'Please select a valid image file (JPEG, PNG, GIF, or WebP).';
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
            return `File size should not exceed ${maxSizeMB}MB. Please choose a smaller image.`;
        }

        return null;
    };

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setError(null);

        if (!file) {
            handleRemoveImage();
            return;
        }

        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        // Clean up previous preview URL
        if (previewImage) {
            URL.revokeObjectURL(previewImage);
        }

        // Set the selected file
        setSelectedImage(file);

        // Create preview
        const previewUrl = URL.createObjectURL(file);
        setPreviewImage(previewUrl);
    }, [previewImage]);

    const handleRemoveImage = useCallback(() => {
        // Clean up preview URL
        if (previewImage) {
            URL.revokeObjectURL(previewImage);
        }
        
        setSelectedImage(null);
        setPreviewImage(null);
        setError(null);
        
        // Clear file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [previewImage]);

    const handleCreatePost = async () => {
        // Basic validation
        const trimmedCaption = caption.trim();
        if (!trimmedCaption && !selectedImage) {
            setError('Please add a caption or select an image.');
            return;
        }

        setError(null);

        try {
            const response = await handleAuthRequest(async () => {
                const formData = new FormData();
                formData.append('caption', trimmedCaption);

                if (selectedImage) {
                    formData.append('image', selectedImage);
                }

                return await axios.post(`${BASE_API_URL}/posts/create-post`, formData, {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }, setIsLoading);

            if (response?.data) {
                // Add post to store
                const newPost = response.data.data?.post || response.data.post;
                if (newPost) {
                    dispatch(addPost(newPost));
                }

                // Show success message
                toast.success('Post created successfully!');

                // Reset form and close dialog
                resetForm();
                onClose();

                // Navigate to home and refresh
                router.push('/');
                router.refresh();
            }
        } catch (err: any) {
            console.error('Error creating post:', err);
            const errorMessage = err.response?.data?.message || 'Failed to create post. Please try again.';
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    const handleDialogClose = useCallback((open: boolean) => {
        if (!isLoading && !open) {
            resetForm();
            onClose();
        }
    }, [isLoading, resetForm, onClose]);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Create Post</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-6">
                    {/* Error Message */}
                    {error && (
                        <div className="flex items-start gap-2 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                            <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Form Content */}
                    <div className="flex flex-col gap-4">
                        {/* Caption Input */}
                        <div className="space-y-2">
                            <label htmlFor="caption" className="text-sm font-medium text-gray-700">
                                Caption
                            </label>
                            <Textarea
                                id="caption"
                                placeholder="What's on your mind?"
                                value={caption}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                    setCaption(e.target.value)
                                }
                                rows={4}
                                disabled={isLoading}
                                className="resize-none focus:ring-2 focus:ring-blue-500"
                                maxLength={2000}
                            />
                            <div className="text-xs text-gray-500 text-right">
                                {caption.length}/2000
                            </div>
                        </div>

                        {/* Image Upload Section */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Image (Optional)
                            </label>
                            
                            {/* Hidden File Input */}
                            <Input
                                type="file"
                                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                disabled={isLoading}
                            />

                            {/* File Selection Button */}
                            {!selectedImage ? (
                                <Button
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isLoading}
                                    className="w-full h-32 border-dashed border-2 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="h-8 w-8 text-gray-400" />
                                        <span className="text-sm font-medium">Upload Image</span>
                                        <span className="text-xs text-gray-500">
                                            JPEG, PNG, GIF, WebP (Max 5MB)
                                        </span>
                                    </div>
                                </Button>
                            ) : (
                                <div className="space-y-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isLoading}
                                        className="w-full"
                                    >
                                        <ImageIcon className="h-4 w-4 mr-2" />
                                        Change Image
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Image Preview */}
                        {previewImage && selectedImage && (
                            <div className="space-y-3">
                                <div className="relative">
                                    <div className="relative overflow-hidden rounded-lg bg-gray-50 border">
                                        <img
                                            src={previewImage}
                                            alt="Preview"
                                            className="w-full h-auto max-h-96 object-contain"
                                            onError={() => {
                                                setError('Failed to load image preview');
                                                handleRemoveImage();
                                            }}
                                        />
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="absolute top-2 right-2 h-8 w-8 p-0"
                                        onClick={handleRemoveImage}
                                        disabled={isLoading}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                
                                {/* File Info */}
                                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium truncate mr-2">
                                            {selectedImage.name}
                                        </span>
                                        <span className="text-gray-500 flex-shrink-0">
                                            {formatFileSize(selectedImage.size)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => handleDialogClose(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <LoadingButton
                            isLoading={isLoading}
                            onClick={handleCreatePost}
                            disabled={isLoading || (!caption.trim() && !selectedImage)}
                            className="px-6"
                        >
                            Create Post
                        </LoadingButton>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreatePost;