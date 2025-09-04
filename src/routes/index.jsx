import { Routes, Route } from "react-router-dom";

import Auth from "../pages/auth/auth.jsx";
import SellerSignin from "../pages/auth/Seller/SellerAuth.jsx";
import SellerRegister from "../pages/auth/Seller/SellerRegister.jsx";
import AdvisorSignin from "../pages/auth/Advisor/AdvisorAuth.jsx";
import AdvisorRegister from "../pages/auth/Advisor/AdvisorRegister.jsx";
import Option from "../pages/Option";
import AuthRegister from "../pages/auth/authRegister.jsx"
import VerifyEmail from "../pages/auth/Seller/SellerForm.jsx";
import SellerDashboard from "../pages/dashboard/SellerDashboard.jsx";
import AdvisorDashboard from "../pages/dashboard/AdvisorDashboard.jsx";
import Continue from "../pages/Continue.jsx"
import ResetPassword from "../pages/ResetPassword.jsx";
import ForgotPassword from "../pages/ForgotPassword.jsx";
import AdvisorPayments from "../pages/auth/Advisor/AdvisorPayments.jsx";
import AdvisorForm from "../pages/auth/Advisor/AdvisorForm.jsx";
import AdvisorUpload from "../pages/auth/Advisor/AdvisorUpload.jsx";


const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Option />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/authRegister" element={<AuthRegister />} />
            <Route path="/seller-login" element={<SellerSignin />} />
            <Route path="/seller-register" element={<SellerRegister />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/seller-dashboard" element={<SellerDashboard />} />
            <Route path="/advisor-login" element={<AdvisorSignin />} />
            <Route path="/advisor-register" element={<AdvisorRegister />} />
            <Route path="/adviser-payment" element={<AdvisorPayments />} />
            <Route path="/advisor-form" element={<AdvisorForm />} />
            <Route path="/advisor-dashboard" element={<AdvisorDashboard />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/continue" element={<Continue />} />
            <Route path="/advisor-upload" element={<AdvisorUpload />} />
        </Routes>
    );
};

export default AppRoutes;