import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AuthAndDashboardPage } from './pages/AuthAndDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const MainRouter: React.FC = () => {
  const { activePage } = useStore();

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F5] text-[#222222]">
      <Navbar />
      <main className="flex-1">
        {activePage === 'home' && <HomePage />}
        {activePage === 'catalog' && <CatalogPage />}
        {activePage === 'product' && <ProductDetailPage />}
        {activePage === 'cart' && <CartPage mode="cart" />}
        {activePage === 'wishlist' && <CartPage mode="wishlist" />}
        {activePage === 'checkout' && <CheckoutPage />}
        {activePage === 'auth' && <AuthAndDashboardPage />}
        {activePage === 'dashboard' && <AuthAndDashboardPage initialTab="orders" />}
        {activePage === 'track-order' && <AuthAndDashboardPage initialTab="track" />}
        {activePage === 'admin' && <AdminDashboardPage />}
      </main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainRouter />
    </StoreProvider>
  );
}
