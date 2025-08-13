import React from 'react';
import { User, Post } from '@/.types';
import Image from 'next/image';

type Props = {
    userProfile: User | undefined
}

const Save = ({ userProfile }: Props) => {
    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4'>
            {userProfile?.savedPosts?.map((post) => (
                <div key={(post as Post)._id} className="relative w-full h-48 md:h-72 group cursor-pointer">
                    <Image
                        src={(post as Post).image?.url || ''}
                        alt="post"
                        layout="fill"
                        objectFit="cover"
                        className="group-hover:opacity-80 transition-opacity"
                    />
                </div>
            ))}
        </div>
    );
};

export default Save;
