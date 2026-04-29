import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { signOut } from "firebase/auth";
import { store, persistor, AppDispatch } from "@/store/store";
import { checkAuthState, logout } from "@/features/authSlice";
import { auth } from "../firebase";
import PrivateRoute from "@/components/PrivateRoute";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import VerifyEmail from "./pages/VerifyEmail";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import Properties from "./pages/dashboard/Properties";
import PropertyDetail from "./pages/dashboard/PropertyDetail";
import Offers from "./pages/dashboard/Offers";
import FAQs from "./pages/FAQs";
import Terms from "./pages/Terms";
import Chat from "./pages/dashboard/Chat";
import VendorLayout from "./components/vendor-dashboard/VendorLayout";
import VendorHome from "./pages/vendor/VendorHome";
import FindJobs from "./pages/vendor/FindJobs";
import MyProjects from "./pages/vendor/MyProjects";
import Earnings from "./pages/vendor/Earnings";
import Reviews from "./pages/vendor/Reviews";
import VendorMessages from "./pages/vendor/VendorMessages";
import VendorSettings from "./pages/vendor/VendorSettings";

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AuthStateChecker = () => {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    dispatch(checkAuthState());
  }, [dispatch]);
  return null;
};

export const handleLogout = async (
  navigate: ReturnType<typeof useNavigate>,
  dispatch: AppDispatch
) => {
  await signOut(auth);
  localStorage.removeItem("authToken");
  localStorage.removeItem("signupData");
  dispatch(logout());
  navigate("/login");
};

const App = () => (
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <AuthStateChecker />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faqs" element={<FAQs />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
                <Route index element={<DashboardHome />} />
                <Route path="properties" element={<Properties />} />
                <Route path="properties/:id" element={<PropertyDetail />} />
                <Route path="offers" element={<Offers />} />
                <Route path="faqs" element={<FAQs />} />
                <Route path="terms" element={<Terms />} />
                <Route path="chat" element={<Chat />} />
              </Route>
              <Route path="/vendor" element={<PrivateRoute><VendorLayout /></PrivateRoute>}>
                <Route index element={<VendorHome />} />
                <Route path="jobs" element={<FindJobs />} />
                <Route path="projects" element={<MyProjects />} />
                <Route path="earnings" element={<Earnings />} />
                <Route path="reviews" element={<Reviews />} />
                <Route path="messages" element={<VendorMessages />} />
                <Route path="settings" element={<VendorSettings />} />
                <Route path="faqs" element={<FAQs />} />
                <Route path="terms" element={<Terms />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </PersistGate>
  </Provider>
);

export default App;
