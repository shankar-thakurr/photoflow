import React from 'react';
import { User } from '@/.types';
import Image from 'next/image';

type Props = {
    userProfile: User | undefined
}

const Post = ({ userProfile }: Props) => {
    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4'>
            {userProfile?.posts?.map((post) => (
                <div key={post._id} className="relative w-full h-48 md:h-72 group cursor-pointer">
                    <Image
                        src={post.image?.url || ''}
                        alt="post"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        style={{ objectFit: "cover" }}
                        className="group-hover:opacity-80 transition-opacity"
                    />
                </div>
            ))}
        </div>
    );
};

export default Post;
