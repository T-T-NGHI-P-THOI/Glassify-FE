import type { UserDto } from "./user.dto";
import type {UserResponse} from "@/models/User.ts";

export interface AuthState {
    isAuthenticated?: boolean,
    isInitialized?: boolean,
    user: UserResponse | null
}