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
import {
    BuyerRefundListPage,
    BuyerRefundDetailPage,
    BuyerCreateRefundPage,
    SellerRefundListPage,
    SellerRefundDetailPage,
    AdminRefundManagementPage,
} from "@/pages/Refund"

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
                        <RoleBasedGuard accessibleRoles={["ADMIN", "STAFF", 'CUSTOMER']}>
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
                        <RoleBasedGuard accessibleRoles={['SHOP_OWNER', 'ADMIN']}>
                            <ShopDashboardPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.SHOP.PRODUCTS}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['SHOP_OWNER', 'ADMIN']}>
                            <ShopProductsPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.SHOP.EDIT_PROFILE}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['SHOP_OWNER', 'ADMIN']}>
                            <ShopEditProfilePage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.SHOP.BANK_ACCOUNTS}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['SHOP_OWNER', 'ADMIN']}>
                            <ShopBankAccountPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.SHOP.WALLET}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['SHOP_OWNER', 'ADMIN']}>
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
                        <RoleBasedGuard accessibleRoles={['SHOP_OWNER', 'ADMIN']}>
                            <ShippingPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.SHOP.ORDER_DETAIL}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['SHOP_OWNER', 'ADMIN']}>
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

            {/* Buyer Refund Routes */}
            <Route
                path={PAGE_ENDPOINTS.REFUND.BUYER_LIST}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['CUSTOMER', 'SHOP_OWNER', 'ADMIN']}>
                            <BuyerRefundListPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.REFUND.BUYER_DETAIL}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['CUSTOMER', 'SHOP_OWNER', 'ADMIN']}>
                            <BuyerRefundDetailPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.REFUND.BUYER_CREATE}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['CUSTOMER', 'SHOP_OWNER', 'ADMIN']}>
                            <BuyerCreateRefundPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            {/* Seller Refund Routes */}
            <Route
                path={PAGE_ENDPOINTS.REFUND.SELLER_LIST}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['SHOP_OWNER']}>
                            <SellerRefundListPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.REFUND.SELLER_DETAIL}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['SHOP_OWNER']}>
                            <SellerRefundDetailPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            {/* Admin Refund Routes */}
            <Route
                path={PAGE_ENDPOINTS.REFUND.ADMIN_LIST}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['ADMIN']}>
                            <AdminRefundManagementPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.REFUND.ADMIN_DETAIL}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['ADMIN']}>
                            <AdminRefundManagementPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />
        </>

    )
}
export default PrivateRoutesComponent
