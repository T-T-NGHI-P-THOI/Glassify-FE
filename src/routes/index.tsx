import { Route, Routes } from "react-router-dom"
import PublicRoutesComponent from "./public-route"
import PrivateRoutesComponent from "./private-route"
import ProductDetailPage from '../pages/ProductDetailPage';

const RouteComponent = () => {
    return (
        <Routes>
            {PublicRoutesComponent()}
            {PrivateRoutesComponent()}
            <Route path="/product/:slug/:variant" element={<ProductDetailPage />} />
        </Routes>
    )
}

export default RouteComponent