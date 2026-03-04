import { Route } from "react-router-dom";
import GuestGuard from "../auth/guards/GuestGuard";
import { PAGE_ENDPOINTS } from "../api/endpoints";
import MyForm from "@/pages/MyForm";
import MainPage from "@/pages/MainPage";
import DashboardPage from "@/pages/Dashboard/DashboardPage";
import ShopTrackingPage from "@/pages/Shop/ShopTrackingPage";
import ShopTrackingDetailPage from "@/pages/Shop/ShopTrackingDetailPage";
import ShopRegistrationPage from "@/pages/Shop/ShopRegistrationPage";
import ShopProfilePage from "@/pages/Shop/ShopProfilePage";

import MyOrdersPage from "@/pages/Order/MyOrdersPage";
import WarrantyPage from "@/pages/Warranty/WarrantyPage";
import AuthPage from "@/pages/auth/Login";
import PaymentResultPage from "@/pages/checkout/PaymentResultPage";
import VirtualTryOnPage from "@/pages/Virtrual-Try-On/VitrualTryOnPage";
import ImageTryOnPage from "@/pages/Virtrual-Try-On/ImageTryOnPage";

const PublicRoutesComponent = () => {
    return (
        <>
            {/* Home Page */}
            <Route
                path="/"
                element={<MainPage />}
            />
            <Route
                path={PAGE_ENDPOINTS.HOME}
                element={<MainPage />}
            />

            <Route
                path={PAGE_ENDPOINTS.AUTH.LOGIN}
                element={
                    <GuestGuard>
                        <AuthPage />
                    </GuestGuard>
                }
            />
            <Route
                path={'/virtual-try-on'}
                element={
                    <GuestGuard>
                        <VirtualTryOnPage />
                    </GuestGuard>
                }
            />

             <Route
                path={'/image-try-on'}
                element={
                    <GuestGuard>
                        <ImageTryOnPage />
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
                path={PAGE_ENDPOINTS.SHOP.PROFILE}
                element={
                    <GuestGuard>
                        <ShopProfilePage />
                    </GuestGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.ORDER.MY_ORDERS}
                element={
                    <GuestGuard>
                        <MyOrdersPage />
                    </GuestGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.WARRANTY.MAIN}
                element={
                    <GuestGuard>
                        <WarrantyPage />
                    </GuestGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.PAYMENT.RESULT}
                element={<PaymentResultPage />}
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