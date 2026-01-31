import { type FC, type PropsWithChildren, useEffect, useReducer } from "react";
import { initialize, reducer } from "./Reducer";
import { AuthContext, initialState } from "./AuthContext";
import AuthAPI from "../api/auth-api";
import {TokenManager} from "@/api/axios.config.ts";

const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    (async () => {
      const accessToken = TokenManager.getAccessToken();
      if (!accessToken) {
        return dispatch(initialize({ isAuthenticated: false, user: null }));
      }

      try {
        const user = await AuthAPI.getUserByToken();
        dispatch(initialize({isInitialized: true, isAuthenticated: true, user }));
      } catch {
        dispatch(initialize({ isAuthenticated: false, user: null }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;