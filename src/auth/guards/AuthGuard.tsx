import { type FC, type PropsWithChildren, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Loading from '../../layouts/Loading';
import { PAGE_ENDPOINTS } from '../../api/endpoints';

const AuthGuard: FC<PropsWithChildren> = ({ children }) => {
  const { isInitialized, isAuthenticated } = useAuth();
  // const navigate = useNavigate();

  // useEffect(() => {
  //   if (isInitialized && !isAuthenticated) {
  //     navigate(PAGE_ENDPOINTS.AUTH.LOGIN);
  //   }
  // }, [isInitialized, isAuthenticated, navigate]);

  // if (!isInitialized) {
  //   return <Loading />;
  // }

  // return <>{children}</>;

  const location = useLocation();

  // Đang loading auth state
  if (!isInitialized) {
    return <Loading />;
  }

  // Chưa đăng nhập → redirect ngay, không render children
  if (!isAuthenticated) {
    return (
      <Navigate
        to={PAGE_ENDPOINTS.AUTH.LOGIN}
        state={{ from: location }} // Lưu để redirect về sau login
        replace
      />
    );
  }

  // Đã authenticated → render children
  return <>{children}</>;
};

export default AuthGuard;