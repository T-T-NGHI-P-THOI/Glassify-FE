import { Route } from "react-router-dom"
import AuthGuard from "../auth/guards/AuthGuard"
import RoleBasedGuard from "../auth/guards/RoleBaseGuard"
import MainPage from "../pages/MainPage"
import { PAGE_ENDPOINTS } from "../api/endpoints"

const PrivateRoutesComponent = () => {
    return (
        <Route
                    path={PAGE_ENDPOINTS.HOME}
                    element={
                        <AuthGuard>
                            <RoleBasedGuard accessibleRoles={["admin", "staff"]}>
                                <MainPage />
                            </RoleBasedGuard>
                        </AuthGuard>
                    }
                />
    )
}
export default PrivateRoutesComponent
