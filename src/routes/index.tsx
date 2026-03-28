import { Route, Routes } from "react-router-dom"
import PublicRoutesComponent from "./public-route"
import PrivateRoutesComponent from "./private-route"
import ProductDetailPage from '../pages/Product/ProductDetailPage';
import ProductBrowsePage from '../pages/Product/ProductBrowsePage';
import ShoppingCart from '../pages/cart/Cart';
import ShopDetailPage from '../pages/Shop/ShopDetailPage';
import NotFoundPage from '../pages/NotFoundPage';
import AccountDisabledPage from '../pages/AccountDisabledPage';

const RouteComponent = () => {
    return (
        <Routes>
            {PublicRoutesComponent()}
            {PrivateRoutesComponent()}
            <Route path="/products" element={<ProductBrowsePage />} />
            <Route path="/products/:category" element={<ProductBrowsePage />} />
            <Route path="/product/:slug/:sku" element={<ProductDetailPage />} />
            <Route path="/shop/:shopId" element={<ShopDetailPage />} />
            <Route path="/cart" element={<ShoppingCart />} />
            <Route path="/account-disabled" element={<AccountDisabledPage />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    )
}

export default RouteComponent