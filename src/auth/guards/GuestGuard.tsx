import { type FC, type PropsWithChildren, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import Loading from '../../layouts/Loading';
import { PAGE_ENDPOINTS} from '../../api/endpoints';

const GuestGuard: FC<PropsWithChildren> = ({ children }) => {
    const { isInitialized, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        console.log("Guest Guard →", { isInitialized, isAuthenticated });

        if (isInitialized && isAuthenticated) {
            // If we're on login/register page with redirect state,
            // let the login handler manage the redirect to avoid race conditions
            const from = location.state?.from;
            const isAuthPage = location.pathname === PAGE_ENDPOINTS.AUTH.LOGIN ||
                              location.pathname === PAGE_ENDPOINTS.AUTH.REGISTER;

            // Don't redirect if we're on auth page with pending redirect - login page will handle it
            if (isAuthPage && from && from.pathname) {
                return;
            }

            // Otherwise, redirect authenticated users away from auth pages
            if (isAuthPage) {
                const isAdmin = user?.roles?.includes('ADMIN');
                navigate(isAdmin ? PAGE_ENDPOINTS.DASHBOARD : PAGE_ENDPOINTS.HOME, { replace: true });
            }
            // If we're on other pages and authenticated, do nothing
        }
    }, [isInitialized, isAuthenticated, user, navigate, location.state, location.pathname]);

    if (!isInitialized) return <Loading />;

    return <>{children}</>;
};

export default GuestGuard;