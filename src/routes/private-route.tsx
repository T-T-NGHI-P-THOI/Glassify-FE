import { Route } from "react-router-dom"
import AuthGuard from "../auth/guards/AuthGuard"
import RoleBasedGuard from "../auth/guards/RoleBaseGuard"
import MainPage from "../pages/MainPage"
import { PAGE_ENDPOINTS } from "../api/endpoints"
import DashboardPage from "@/pages/Dashboard/DashboardPage.tsx";
import UserProfilePage from "@/pages/User/UserProfilePage"
import ShopRegistrationPage from "@/pages/Shop/ShopRegistrationPage"
import ShopDashboardPage from "@/pages/Shop/ShopDashboardPage"
import ShopBankAccountPage from "@/pages/Shop/ShopBankAccountPage"
import ShopEditProfilePage from "@/pages/Shop/ShopEditProfilePage"

const PrivateRoutesComponent = () => {
    return (
        <>
            {/*<Route*/}
            {/*    path={PAGE_ENDPOINTS.HOME}*/}
            {/*    element={*/}
            {/*        <AuthGuard>*/}
            {/*            <RoleBasedGuard accessibleRoles={["admin", "staff"]}>*/}
            {/*                <MainPage />*/}
            {/*            </RoleBasedGuard>*/}
            {/*        </AuthGuard>*/}
            {/*    }*/}
            {/*/>*/}

            <Route
                path={PAGE_ENDPOINTS.DASHBOARD}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={["admin", "staff", 'CUSTOMER']}>
                            <DashboardPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.USER.PROFILE}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['CUSTOMER']}>
                            <UserProfilePage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.SHOP.REGISTER}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['CUSTOMER']}>
                            <ShopRegistrationPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.SHOP.DASHBOARD}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['CUSTOMER']}>
                            <ShopDashboardPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.SHOP.EDIT_PROFILE}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['CUSTOMER']}>
                            <ShopEditProfilePage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.SHOP.BANK_ACCOUNTS}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['CUSTOMER']}>
                            <ShopBankAccountPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />
        </>

    )
}
export default PrivateRoutesComponent
