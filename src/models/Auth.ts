// types/auth.types.ts

// Response wrapper từ backend
import type {UserResponse} from "@/models/User.ts";



// Auth response
interface AuthResponse {
    accessToken: string;
    tokenType: string;
    user: UserResponse;
}

// Login request
interface LoginRequest {
    usernameOrEmail: string;
    password: string;
}

export type { AuthResponse, LoginRequest };