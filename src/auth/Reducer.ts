import { AuthActionType } from "../types/auth-action-type.enum";
import type { AuthState } from "../types/auth-state.enum";
import type { PayloadAction } from "./AuthContext";
import {TokenManager} from "@/api/axios.config.ts";

// Define supported actions and their reducers
interface ReducerHandler {
  INITIALIZE(state: AuthState, action: PayloadAction<AuthState>): AuthState;
  SIGN_IN(state: AuthState, action: PayloadAction<AuthState>): AuthState;
  SIGN_OUT(state: AuthState): AuthState;
}

// Reducer logic for each action
const reducerHandlers: ReducerHandler = {
  INITIALIZE(state, action) {
    const { isAuthenticated, user } = action.payload;

    return {
      ...state,
      isAuthenticated,
      isInitialized: true,
      user,
    };
  },

  SIGN_IN(state, action) {
    const { user } = action.payload;

    return {
      ...state,
      isAuthenticated: true,
      user,
    };
  },

  SIGN_OUT(state) {
    return {
      ...state,
      isAuthenticated: false,
      user: null,
    };
  },
};

// Main reducer function
export function reducer(state: AuthState, action: PayloadAction<AuthState>): AuthState {
  if (!(action.type in reducerHandlers)) return state;

  return reducerHandlers[action.type](state, action);
}


// -------------------- ACTIONS ------------------------------------
export function initialize(payload: AuthState): PayloadAction<AuthState> {
  return {
    type: AuthActionType.INITIALIZE,
    payload,
  };
}

export function logIn(payload: AuthState): PayloadAction<AuthState> {
  return {
    type: AuthActionType.SIGN_IN,
    payload,
  };
}

export function logOut(): PayloadAction<AuthState> {
  TokenManager.clearTokens();

  return {
    type: AuthActionType.SIGN_OUT,
    payload: { isAuthenticated: false, isInitialized: true, user: null },
  };
}