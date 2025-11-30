import { createContext, type Dispatch } from "react";
import { AuthActionType } from "../types/auth-action-type.enum";
import type { AuthState } from "../types/auth-state.enum";

export interface PayloadAction<T> {
    type: AuthActionType,
    payload: T;
}

export interface AuthContextType extends AuthState {
    dispatch: Dispatch<PayloadAction<AuthState>>;
}

export const initialState : AuthState = {
    isInitialized: false,
    isAuthenticated: false,
    user: null
}

export const AuthContext = createContext<AuthContextType>({
    ...initialState,
    dispatch: () => null
})