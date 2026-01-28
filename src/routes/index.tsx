import { Route, Routes } from "react-router-dom"
import PublicRoutesComponent from "./public-route"
import PrivateRoutesComponent from "./private-route"
import ProductDetailPage from '../pages/ProductDetailPage';
import ProductBrowsePage from '../pages/ProductBrowsePage';

const RouteComponent = () => {
    return (
        <Routes>
            {PublicRoutesComponent()}
            {PrivateRoutesComponent()}
            <Route path="/products" element={<ProductBrowsePage />} />
            <Route path="/products/:category" element={<ProductBrowsePage />} />
            <Route path="/product/:slug/:productId/:variantId?" element={<ProductDetailPage />} />
        </Routes>
    )
}

export default RouteComponent