import { Navigate, Route, useParams } from "react-router-dom"
import AuthGuard from "../auth/guards/AuthGuard"
import RoleBasedGuard from "../auth/guards/RoleBaseGuard"
import { PAGE_ENDPOINTS } from "../api/endpoints"
import DashboardPage from "@/pages/Dashboard/DashboardPage.tsx";
import UserProfilePage from "@/pages/User/UserProfilePage"
import ShopRegistrationPage from "@/pages/Shop/ShopRegistrationPage"
import ShopResubmitPage from "@/pages/Shop/ShopResubmitPage"
import ShopDashboardPage from "@/pages/Shop/ShopDashboardPage"
import ShopBankAccountPage from "@/pages/Shop/ShopBankAccountPage"
import ShopWalletPage from "@/pages/Shop/ShopWalletPage"
import ShopEditProfilePage from "@/pages/Shop/ShopEditProfilePage"
import ShopProductsPage from "@/pages/Shop/ShopProductsPage"
import ShopRefundReviewPage from "@/pages/Shop/ShopRefundReviewPage"
import AdminShopApprovalPage from "@/pages/Admin/AdminShopApprovalPage"
import AdminShopDetailPage from "@/pages/Shop/AdminShopDetailPage"
import CheckoutPage from "@/pages/checkout/CheckoutPage"
import UserWalletPage from "@/pages/User/UserWalletPage"
import ShipmentDetailPage from "@/pages/Shipping/DeliveryPage/ShipmentDetailPage"
import ShopStaffPage from "@/pages/Shop/ShopStaffPage"
import WarrantyPage from "@/pages/Warranty/WarrantyPage"
import MyOrdersPage from "@/pages/Order/MyOrdersPage"
import ShopProfilePage from "@/pages/Shop/ShopProfilePage"
import ShopTrackingPage from "@/pages/Shop/ShopTrackingPage"
import ShopOrdersPage from "@/pages/Shop/ShopOrdersPage"
import ShopWarrantyPage from "@/pages/Shop/ShopWarrantyPage"
import {
    BuyerRefundListPage,
    BuyerRefundDetailPage,
    BuyerCreateRefundPage,
    SellerRefundListPage,
    SellerRefundDetailPage,
} from "@/pages/Refund"
import AdminUserManagementPage from "@/pages/Admin/AdminUserManagementPage"
import AdminUserDetailPage from "@/pages/Admin/AdminUserDetailPage"
import AdminOrdersPage from "@/pages/Admin/AdminOrdersPage"
import AdminOrderDetailPage from "@/pages/Admin/AdminOrderDetailPage"
import AdminRefundsPage from "@/pages/Admin/AdminRefundsPage"
import AdminRefundDetailPage from "@/pages/Admin/AdminRefundDetailPage"
import AdminWarrantiesPage from "@/pages/Admin/AdminWarrantiesPage"
import AdminWarrantyDetailPage from "@/pages/Admin/AdminWarrantyDetailPage"
import FrameProductPage from "@/pages/Product/Frame/FrameProductPage";
import CreateLensPage from "@/pages/Product/Lens/Create/CreateLensPage";
import LensProductPage from "@/pages/Product/Lens/LensProductPage";
import LensDetailPage from "@/pages/Product/Lens/LensDetailPage";

const LensDetailRedirect = () => {
    const { lensId } = useParams();

    if (!lensId) {
        return <Navigate to={PAGE_ENDPOINTS.SHOP.PRODUCT_LENS} replace />;
    }

    return <Navigate to={PAGE_ENDPOINTS.SHOP.LENS_DETAIL(lensId)} replace />;
};

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
                        <RoleBasedGuard accessibleRoles={['CUSTOMER', 'SHOP_OWNER', 'ADMIN']}>
                            <ShopProfilePage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.ORDER.MY_ORDERS}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['CUSTOMER', 'SHOP_OWNER', 'ADMIN']}>
                            <MyOrdersPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.WARRANTY.MAIN}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['CUSTOMER', 'SHOP_OWNER', 'ADMIN']}>
                            <WarrantyPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

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
                path={PAGE_ENDPOINTS.SHOP.RESUBMIT}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['CUSTOMER']}>
                            <ShopResubmitPage />
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
                            <FrameProductPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.SHOP.PRODUCT_LENS}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['SHOP_OWNER', 'ADMIN']}>
                            <LensProductPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.SHOP.LENS_DETAIL(':lensId')}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['SHOP_OWNER', 'ADMIN']}>
                            <LensDetailPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path="/shop/products/lenses/:lensId"
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['SHOP_OWNER', 'ADMIN']}>
                            <LensDetailRedirect />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.SHOP.CREATE_LENS}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['SHOP_OWNER', 'ADMIN']}>
                            <CreateLensPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.SHOP.EDIT_LENS(':lensId')}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['SHOP_OWNER', 'ADMIN']}>
                            <CreateLensPage />
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
                            <ShopOrdersPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.SHOP.REFUND_REVIEW}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['SHOP_OWNER', 'ADMIN']}>
                            <ShopRefundReviewPage />
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
                        <RoleBasedGuard accessibleRoles={['SHOP_OWNER', 'ADMIN']}>
                            <ShopStaffPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.SHOP.WARRANTY}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['SHOP_OWNER', 'ADMIN']}>
                            <ShopWarrantyPage />
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
                        <RoleBasedGuard accessibleRoles={['SHOP_OWNER', 'ADMIN']}>
                            <SellerRefundListPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.REFUND.SELLER_DETAIL}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['SHOP_OWNER', 'ADMIN']}>
                            <SellerRefundDetailPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.ADMIN.USER_MANAGEMENT}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['ADMIN']}>
                            <AdminUserManagementPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.ADMIN.USER_DETAIL}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['ADMIN']}>
                            <AdminUserDetailPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.ADMIN.ORDERS}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['ADMIN']}>
                            <AdminOrdersPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.ADMIN.ORDER_DETAIL}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['ADMIN']}>
                            <AdminOrderDetailPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.ADMIN.REFUNDS}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['ADMIN']}>
                            <AdminRefundsPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.ADMIN.REFUND_DETAIL}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['ADMIN']}>
                            <AdminRefundDetailPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.ADMIN.WARRANTIES}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['ADMIN']}>
                            <AdminWarrantiesPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.ADMIN.WARRANTY_DETAIL}
                element={
                    <AuthGuard>
                        <RoleBasedGuard accessibleRoles={['ADMIN']}>
                            <AdminWarrantyDetailPage />
                        </RoleBasedGuard>
                    </AuthGuard>
                }
            />
        </>

    )
}
export default PrivateRoutesComponent
