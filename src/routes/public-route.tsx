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
import AdminShopApprovalPage from "@/pages/Admin/AdminShopApprovalPage";
import FrameProductPage from "@/pages/Product/Frame/FrameProductPage";
import CreateFramePage from "@/pages/Product/Frame/Create/CreateFramePage";
import MyOrdersPage from "@/pages/Order/MyOrdersPage";
import WarrantyPage from "@/pages/Warranty/WarrantyPage";
import AuthPage from "@/pages/auth/Login";
import PaymentResultPage from "@/pages/checkout/PaymentResultPage";
import VirtualTryOnPage from "@/pages/Virtrual-Try-On/VitrualTryOnPage";
import ImageTryOnPage from "@/pages/Virtrual-Try-On/ImageTryOnPage";
import TestTryOnPage from "@/pages/Virtrual-Try-On/GlassesTryOn/TestTryOnPage";
import HelpPage from "@/pages/Help/HelpPage";

const PublicRoutesComponent = () => {
    return (
        <>
            <Route
                path="/test-try-on"
                element={<TestTryOnPage />}
            />
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
                path={PAGE_ENDPOINTS.SHOP.PRODUCT_FRAME}
                element={
                    <GuestGuard>
                        <FrameProductPage />
                    </GuestGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.SHOP.CREATE_FRAME}
                element={
                    <GuestGuard>
                        <CreateFramePage />
                    </GuestGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.PAYMENT.RESULT}
                element={<PaymentResultPage />}
            />

            <Route
                path={PAGE_ENDPOINTS.USER.HELP}
                element={<HelpPage />}
            />
        </>
    );
};

export default PublicRoutesComponent;