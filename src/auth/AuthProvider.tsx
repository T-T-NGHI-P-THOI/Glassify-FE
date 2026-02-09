import { type FC, type PropsWithChildren, useEffect, useReducer } from "react";
import { initialize, reducer } from "./Reducer";
import { AuthContext, initialState } from "./AuthContext";
import AuthAPI from "../api/auth-api";
import { TokenManager } from "@/api/axios.config.ts";
import { useAuth } from "@/hooks/useAuth";
import userApi from "@/api/service/userApi";
import { authApi } from "@/api/service/authApi";
import Loading from "@/layouts/Loading";

const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    (async () => {
      const accessToken = TokenManager.getAccessToken();
      if (!accessToken) {
        return dispatch(initialize({ isInitialized: true, isAuthenticated: false, user: null }));
      }

      try {
        const userProfile = await userApi.getMyProfile();

        console.log('Fetched user profile:', userProfile.data);

        // @ts-ignore
          dispatch(initialize({ isInitialized: true, isAuthenticated: true, user: userProfile.data ?? null }));
      } catch (err) {
        TokenManager.clearTokens();
        dispatch(initialize({
          isInitialized: true,
          isAuthenticated: false,
          user: null
        }));
      }
    })();
  }, []);

  if (!state.isInitialized) {
    return <Loading />; // hoặc null, hoặc spinner
  }

  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;