import { Route } from "react-router-dom";
import GuestGuard from "../auth/guards/GuestGuard";
import Login from "../pages/auth/Login";
import { PAGE_ENDPOINTS } from "../api/endpoints";

const PublicRoutesComponent = () => {
    return (
        <>
            <Route
                path={PAGE_ENDPOINTS.AUTH.LOGIN}
                element={
                    <GuestGuard>
                        <Login />
                    </GuestGuard>
                }
            />
            {/* <Route
                    path={].SIGN_UP_ENDPOINT}
                    element={
                        <GuestGuard>
                            <SignUpPageComponent />
                        </GuestGuard>
                    }
                /> */}
        </>
    );
};

export default PublicRoutesComponent;