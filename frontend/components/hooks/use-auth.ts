import { BASE_API_URL } from "@/server";
import axios from "axios";
import { useDispatch } from "react-redux";
import { handleAuthRequest } from "../utils/apiRequest";
import { toast } from "sonner";
import { login } from "@/store/authSlice";

const useFollowUnFollow = () => {
    const dispatch = useDispatch();

    const handleFollowUnfollow = async (userId: string) => {
        try {
            const followRequest = async () => 
                await axios.post(`${BASE_API_URL}/users/follow-unfollow/${userId}`, {}, { 
                    withCredentials: true 
                });

            const result = await handleAuthRequest(followRequest, () => {});

            if (result && result.data.status === "success") {
                dispatch(login(result.data.data.user));
                toast.success(result.data.message);
            }
        } catch (error) {
            console.error("Follow/Unfollow error:", error);
            toast.error("Failed to update follow status. Please try again.");
        }
    };

    return { handleFollowUnfollow };
}

export default useFollowUnFollow;