// types/auth.types.ts

import type { UserResponse } from "./User";

// Response wrapper từ backend



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