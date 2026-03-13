import { Route } from "react-router-dom"
import AuthGuard from "../auth/guards/AuthGuard"
import RoleBasedGuard from "../auth/guards/RoleBaseGuard"
import { PAGE_ENDPOINTS } from "../api/endpoints"
import DashboardPage from "@/pages/Dashboard/DashboardPage.tsx";
import UserProfilePage from "@/pages/User/UserProfilePage"
import ShopRegistrationPage from "@/pages/Shop/ShopRegistrationPage"
import ShopDashboardPage from "@/pages/Shop/ShopDashboardPage"
import ShopBankAccountPage from "@/pages/Shop/ShopBankAccountPage"
import ShopWalletPage from "@/pages/Shop/ShopWalletPage"
import ShopEditProfilePage from "@/pages/Shop/ShopEditProfilePage"
import ShopProductsPage from "@/pages/Shop/ShopProductsPage"
import AdminShopApprovalPage from "@/pages/Admin/AdminShopApprovalPage"
import AdminShopDetailPage from "@/pages/Shop/AdminShopDetailPage"
import CheckoutPage from "@/pages/checkout/CheckoutPage"
import UserWalletPage from "@/pages/User/UserWalletPage"
import ShippingPage from "@/pages/Shipping/DeliveryPage/ShippingPage"
import ShipmentDetailPage from "@/pages/Shipping/DeliveryPage/ShipmentDetailPage"
import ShopStaffPage from "@/pages/Shop/ShopStaffPage"
import WarrantyPage from "@/pages/Warranty/WarrantyPage"
import MyOrdersPage from "@/pages/Order/MyOrdersPage"
import ShopProfilePage from "@/pages/Shop/ShopProfilePage"
import ShopTrackingPage from "@/pages/Shop/ShopTrackingPage"

const PrivateRoutesComponent = () => {
    return (
        <>
            <Route
                path={PAGE_ENDPOINTS.TRACKING.SHOPS}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['CUSTOMER', 'SHOP_OWNER']}>
                            <ShopTrackingPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.SHOP.PROFILE}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['CUSTOMER', 'SHOP_OWNER']}>
                            <ShopProfilePage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.ORDER.MY_ORDERS}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['CUSTOMER']}>
                            <MyOrdersPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.WARRANTY.MAIN}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['CUSTOMER']}>
                            <WarrantyPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.DASHBOARD}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['ADMIN']}>
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
                path={PAGE_ENDPOINTS.SHOP.PRODUCTS}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['CUSTOMER']}>
                            <ShopProductsPage />
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

            <Route
                path={PAGE_ENDPOINTS.SHOP.WALLET}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['CUSTOMER']}>
                            <ShopWalletPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.USER.WALLET}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['CUSTOMER']}>
                            <UserWalletPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.CHECKOUT.MAIN}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['CUSTOMER']}>
                            <CheckoutPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.SHOP.ORDERS}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['CUSTOMER']}>
                            <ShippingPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.SHOP.ORDER_DETAIL}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['CUSTOMER']}>
                            <ShipmentDetailPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.SHOP.STAFF}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['CUSTOMER']}>
                            <ShopStaffPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.ADMIN.SHOP_APPROVAL}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['ADMIN']}>
                            <AdminShopApprovalPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.TRACKING.SHOP_DETAIL}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['ADMIN']}>
                            <AdminShopDetailPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />
        </>

    )
}
export default PrivateRoutesComponent
