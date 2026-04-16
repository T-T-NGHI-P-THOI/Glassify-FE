import { Route } from "react-router-dom";
import GuestGuard from "../auth/guards/GuestGuard";
import { PAGE_ENDPOINTS } from "../api/endpoints";
import MainPage from "@/pages/MainPage";
import AuthPage from "@/pages/auth/Login";
import PaymentResultPage from "@/pages/checkout/PaymentResultPage";
import VirtualTryOnPage from "@/pages/Virtrual-Try-On/VitrualTryOnPage";
import ImageTryOnPage from "@/pages/Virtrual-Try-On/ImageTryOnPage";
import HelpPage from "@/pages/Help/HelpPage";
import TestTryOnPage from "@/pages/Virtrual-Try-On/GlassesTryOn/TestTryOnPage";

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