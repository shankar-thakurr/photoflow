export interface User{
    _id:string,
    username:string,
    email:string,
    password?:string,
    profilePicture?:string,
    bio?:string,
    follwers:string[],
    follwings:string[],
    posts:Post[],
    savaPosts:string[] | Post[],
    isVerified:boolean,
}

export interface Commnet{
    _id:string,
    test:string,
    user:{
        _id:string,
        username:string,
        profilePicture:string,
    };
    createAt:string
}

export  interface Post{
    _id:string,
    caption:string,
    image?:{
        url:string,
        publicId:string
    },
    user:User | undefined,
    likes:string[],
    comments:Commnet[],
    createdAt:string
}