import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/layout";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { ToastProvider } from "./components/ui/Toast";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RequireRole } from "./components/auth/RequireRole";
import { initKeycloak } from "./lib/keycloak";

// Pages
import { MenuPage } from "./pages/menu";
import { CartPage } from "./pages/cart";
import { CheckoutPage } from "./pages/checkout";
import OrdersPage from "./pages/orders";
import { LoginPage } from "./pages/login";
import { CallbackPage } from "./pages/callback";
import OperatorDashboard from "./pages/operator-dashboard";
import SupervisorDashboard from "./pages/supervisor-dashboard";
import AuditorDashboard from "./pages/auditor-dashboard";
import AdminDashboard from "./pages/admin-dashboard";
import { AccessDeniedPage } from "./pages/access-denied";

/**
 * Home page component.
 *
 * Landing page with welcome message and call to action.
 */
function HomePage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to OrderDemo
              </h1>
              <p className="text-xl text-gray-600">
                A customer-facing restaurant ordering system with role-based authentication
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">
                Demo Ordering Interface
              </h2>
              <p className="text-blue-800 mb-4">
                This is a comprehensive demo showcasing a production-ready ordering system
                with authentication, authorization, and role-based access control.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-white rounded p-3">
                  <div className="font-medium text-gray-900">Browse Menu</div>
                  <div className="text-gray-600">18+ delicious items</div>
                </div>
                <div className="bg-white rounded p-3">
                  <div className="font-medium text-gray-900">Add to Cart</div>
                  <div className="text-gray-600">Easy quantity controls</div>
                </div>
                <div className="bg-white rounded p-3">
                  <div className="font-medium text-gray-900">Checkout</div>
                  <div className="text-gray-600">Multi-step payment flow</div>
                </div>
                <div className="bg-white rounded p-3">
                  <div className="font-medium text-gray-900">Track Orders</div>
                  <div className="text-gray-600">Real-time status updates</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/menu"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                Browse Menu
              </a>
              <a
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                Sign In
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main App component.
 *
 * Sets up React Router with all application routes.
 * Includes protected routes and role-based access control.
 */
function App() {
  // Initialize auth on mount (run once)
  useEffect(() => {
    initKeycloak().catch(console.error);
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider position="top-right">
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<MainLayout appName="OrderDemo"><HomePage /></MainLayout>} />
            <Route path="/login" element={<LoginPage />} />

            {/* OAuth callback */}
            <Route path="/callback" element={<CallbackPage />} />

            {/* Protected routes - require authentication */}
            <Route
              path="/menu"
              element={
                <ProtectedRoute>
                  <MainLayout appName="OrderDemo">
                    <MenuPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <MainLayout appName="OrderDemo">
                    <CartPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <MainLayout appName="OrderDemo">
                    <OrdersPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Operator dashboard - requires operator role */}
            <Route
              path="/operator"
              element={
                <MainLayout appName="OrderDemo">
                  <OperatorDashboard />
                </MainLayout>
              }
            />

            {/* Supervisor dashboard - requires supervisor role */}
            <Route
              path="/supervisor"
              element={
                <MainLayout appName="OrderDemo">
                  <SupervisorDashboard />
                </MainLayout>
              }
            />

            {/* Auditor dashboard - requires auditor role */}
            <Route
              path="/auditor"
              element={
                <MainLayout appName="OrderDemo">
                  <AuditorDashboard />
                </MainLayout>
              }
            />

            {/* Admin dashboard - requires admin role */}
            <Route
              path="/admin"
              element={
                <MainLayout appName="OrderDemo">
                  <AdminDashboard />
                </MainLayout>
              }
            />

            {/* Access denied page */}
            <Route path="/access-denied" element={<AccessDeniedPage />} />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
