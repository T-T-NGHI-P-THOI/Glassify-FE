import type { UserDto } from "./user.dto";

export interface AuthState {
    isAuthenticated?: boolean,
    isInitialized?: boolean,
    user: UserDto | null
}