import { Route, Routes } from 'react-router-dom';
import { AdminRoute } from './components/AdminRoute';
import { CustomerRoute } from './components/CustomerRoute';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentPage } from './pages/PaymentPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { AdminPurchaseOrdersPage } from './pages/AdminPurchaseOrdersPage';
import { AdminManageProductsPage } from './pages/AdminManageProductsPage';
import { LoginPage } from './pages/LoginPage';
import { CustomerLoginPage } from './pages/CustomerLoginPage';
import { CustomerRegisterPage } from './pages/CustomerRegisterPage';
import { AccountPage } from './pages/AccountPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminProductsPage } from './pages/AdminProductsPage';
import { AdminInventoryPage } from './pages/AdminInventoryPage';
import { AdminAbcPage } from './pages/AdminAbcPage';
import { AdminExperimentPage } from './pages/AdminExperimentPage';
import { DssProductPage } from './pages/DssProductPage';
import { AboutPage } from './pages/AboutPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="account/login" element={<CustomerLoginPage />} />
        <Route path="account/register" element={<CustomerRegisterPage />} />
        <Route index element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="product/:id" element={<ProductPage />} />
        <Route path="orders" element={<MyOrdersPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route element={<CustomerRoute />}>
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="payment/:orderNumber" element={<PaymentPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminDashboardPage />} />
          <Route path="admin/catalog" element={<AdminManageProductsPage />} />
          <Route path="admin/products" element={<AdminProductsPage />} />
          <Route path="admin/abc" element={<AdminAbcPage />} />
          <Route path="admin/experiment" element={<AdminExperimentPage />} />
          <Route path="admin/inventory" element={<AdminInventoryPage />} />
          <Route path="admin/purchase-orders" element={<AdminPurchaseOrdersPage />} />
          <Route path="admin/product/:id" element={<DssProductPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
