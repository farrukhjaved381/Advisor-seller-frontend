import { Routes, Route } from "react-router-dom";
import SellerSignin from "../pages/auth/Seller/SellerAuth.jsx";
import AdvisorSignin from "../pages/auth/Advisor/AdvisorAuth.jsx";
import AdvisorRegister from "../pages/auth/Advisor/AdvisorRegister.jsx";
import Option from "../pages/Option";
import VerifyEmailRouter from "../pages/auth/VerifyEmailRouter.jsx";
import { SellerForm } from "../pages/auth/Seller/SellerForm.jsx";
import SellerDashboard from "../pages/dashboard/SellerDashboard.jsx";
import AdvisorDashboard from "../pages/dashboard/AdvisorDashboard.jsx";
import Continue from "../pages/Continue.jsx"
import ResetPassword from "../pages/ResetPassword.jsx";
import ForgotPassword from "../pages/ForgotPassword.jsx";
import AdvisorPayments from "../pages/auth/Advisor/AdvisorPayments.jsx";
import { AdvisorForm } from "../pages/auth/Advisor/AdvisorForm.jsx";
import AdvisorUpload from "../pages/auth/Advisor/AdvisorUpload.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
// Removed standalone edit page; route will show AdvisorDashboard's profile tab
import AdvisorProfile from "../pages/dashboard/AdvisorProfile.jsx";
import AdvisorChangeCard from "../pages/dashboard/AdvisorChangeCard.jsx";
import { Navigate } from "react-router-dom";
import AdvisorAddCard from "../pages/dashboard/AdvisorAddCard.jsx";
export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Option />} />
            <Route path="/authRegister" element={<Option />} />
            <Route path="/seller-login" element={<SellerSignin />} />
            <Route path="/seller-register" element={<SellerSignin />} />
            <Route path="/verify-email" element={<VerifyEmailRouter />} />
            <Route path="/seller-form" element={
                <ProtectedRoute requiredRole="seller">
                    <SellerForm />
                </ProtectedRoute>
            } />
            <Route path="/seller-dashboard" element={
                <ProtectedRoute requiredRole="seller">
                    <SellerDashboard />
                </ProtectedRoute>
            } />
            <Route path="/advisor-login" element={<AdvisorSignin />} />
            <Route path="/advisor-register" element={<AdvisorRegister />} />
            <Route path="/adviser-payment" element={
                <ProtectedRoute requiredRole="advisor">
                    <AdvisorPayments />
                </ProtectedRoute>
            } />
            <Route path="/advisor-payments" element={
                <ProtectedRoute requiredRole="advisor">
                    <AdvisorPayments />
                </ProtectedRoute>
            } />
            <Route path="/advisor-form" element={
                <ProtectedRoute requiredRole="advisor">
                    <AdvisorForm />
                </ProtectedRoute>
            } />
            <Route path="/advisor-dashboard" element={
                <ProtectedRoute requiredRole="advisor">
                    <AdvisorDashboard />
                </ProtectedRoute>
            } />
            <Route path="/advisor-profile" element={
                <ProtectedRoute requiredRole="advisor">
                    <AdvisorProfile />
                </ProtectedRoute>
            } />
            <Route path="/advisor-change-card" element={
                <ProtectedRoute requiredRole="advisor">
                    <AdvisorChangeCard />
                </ProtectedRoute>
            } />
            <Route path="/advisor-add-card" element={
                <ProtectedRoute requiredRole="advisor">
                    <AdvisorAddCard />
                </ProtectedRoute>
            } />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/continue" element={<Continue />} />
            <Route path="/advisor-upload" element={
                <ProtectedRoute requiredRole="advisor">
                    <AdvisorUpload />
                </ProtectedRoute>
            } />
            <Route path="/edit-advisor-profile" element={<Navigate to="/advisor-dashboard?tab=settings" replace />} />
        </Routes>
    );
};
