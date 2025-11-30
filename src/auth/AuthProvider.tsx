import { type FC, type PropsWithChildren, useEffect, useReducer } from "react";
import { initialize, reducer } from "./Reducer";
import { AuthContext, initialState } from "./AuthContext";
import AuthAPI from "../api/auth-api";

const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    (async () => {
      const accessToken = localStorage.getItem('ACCESS_TOKEN');
      if (!accessToken) {
        return dispatch(initialize({ isAuthenticated: false, user: null }));
      }

      try {
        const user = await AuthAPI.getUserByToken();
        dispatch(initialize({ isAuthenticated: true, user }));
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