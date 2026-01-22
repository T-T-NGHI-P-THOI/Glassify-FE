import { Route } from "react-router-dom";
import GuestGuard from "../auth/guards/GuestGuard";
import { PAGE_ENDPOINTS } from "../api/endpoints";
import MyForm from "@/pages/MyForm";
import ShippingPage from "@/pages/Shipping/DeliveryPage/ShippingPage";
import ShipmentDetailPage from "@/pages/Shipping/DeliveryPage/ShipmentDetailPage";
import InternalTransferPage from "@/pages/Shipping/InternalTransferPage/InternalTransferPage";
import InternalTransferDetailPage from "@/pages/Shipping/InternalTransferPage/InternalTransferDetailPage";

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
                path={PAGE_ENDPOINTS.TRACKING.INTERNAL_TRANSFER}
                element={
                    <GuestGuard>
                        <InternalTransferPage />
                    </GuestGuard>
                }
            />

            <Route
                path={PAGE_ENDPOINTS.TRACKING.INTERNAL_TRANSFER_DETAIL}
                element={
                    <GuestGuard>
                        <InternalTransferDetailPage />
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