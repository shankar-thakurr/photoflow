import Profile from '@/components/Profile/Profile';
import React from 'react';

const ProfilePage = async({params}: {params: {id: string}}) => {
    const id = (await params).id
    console.log(id)
    return (
        <div>
            <Profile id={id}/>
        </div>
    );
};

export default ProfilePage;