import { Route } from "react-router-dom";
import GuestGuard from "../auth/guards/GuestGuard";
import { PAGE_ENDPOINTS } from "../api/endpoints";
import MyForm from "@/pages/MyForm";
import DashboardPage from "@/pages/Dashboard/DashboardPage";
import ShippingPage from "@/pages/Shipping/DeliveryPage/ShippingPage";
import ShipmentDetailPage from "@/pages/Shipping/DeliveryPage/ShipmentDetailPage";
import ShopTrackingPage from "@/pages/Shop/ShopTrackingPage";
import ShopTrackingDetailPage from "@/pages/Shop/ShopTrackingDetailPage";
import ShopRegistrationPage from "@/pages/Shop/ShopRegistrationPage";
import ShopProfilePage from "@/pages/Shop/ShopProfilePage";
import AdminShopApprovalPage from "@/pages/Admin/AdminShopApprovalPage";
import FrameProductPage from "@/pages/Product/Frame/FrameProductPage";

const PublicRoutesComponent = () => {
    return (
        <>
            {/* <Route
                path={PAGE_ENDPOINTS.AUTH.LOGIN}
                element={
                    <GuestGuard>
                        <Login />
                    </GuestGuard>
                }
            /> */}
            <Route
                path={PAGE_ENDPOINTS.AUTH.LOGIN}
                element={
                    <GuestGuard>
                        <MyForm />
                    </GuestGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.DASHBOARD}
                element={
                    <GuestGuard>
                        <DashboardPage />
                    </GuestGuard>
                }
            />

            
            <Route
                path={PAGE_ENDPOINTS.SHOP.PRODUCT_FRAME}
                element={
                    <GuestGuard>
                        <FrameProductPage />
                    </GuestGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.TRACKING.DELIVERY}
                element={
                    <GuestGuard>
                        <ShippingPage />
                    </GuestGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.TRACKING.SHIPMENT_DETAIL}
                element={
                    <GuestGuard>
                        <ShipmentDetailPage />
                    </GuestGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.TRACKING.SHOPS}
                element={
                    <GuestGuard>
                        <ShopTrackingPage />
                    </GuestGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.TRACKING.SHOP_DETAIL}
                element={
                    <GuestGuard>
                        <ShopTrackingDetailPage />
                    </GuestGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.SHOP.REGISTER}
                element={
                    <GuestGuard>
                        <ShopRegistrationPage />
                    </GuestGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.SHOP.PROFILE}
                element={
                    <GuestGuard>
                        <ShopProfilePage />
                    </GuestGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.ADMIN.SHOP_APPROVAL}
                element={
                    <GuestGuard>
                        <AdminShopApprovalPage />
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