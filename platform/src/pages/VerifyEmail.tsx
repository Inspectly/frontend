import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "../../firebase";
import { login } from "@/features/authSlice";
import { createUser, getUserByFirebaseId } from "@/features/api/usersApi";
import { createUserLogin } from "@/features/api/userLoginsApi";
import { createUserSession } from "@/features/api/userSessionsApi";
import { createClient } from "@/features/api/clientsApi";
import { createVendor } from "@/features/api/vendorsApi";
import { Button } from "@/components/ui/button";
import { MailCheck, RefreshCw } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const createBackendUser = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      localStorage.setItem("authToken", token);

      const stored = localStorage.getItem("signupData");
      if (!stored) throw new Error("Signup data not found");
      const signupData = JSON.parse(stored);

      // Create base user
      const backendUser = await createUser({
        firebase_id: firebaseUser.uid,
        user_type: { user_type: signupData.userType },
        email: signupData.email,
        first_name: signupData.firstName,
        last_name: signupData.lastName,
      });

      // Create role-specific profile
      if (signupData.userType === "client") {
        await createClient({
          user_id: backendUser.id,
          first_name: signupData.firstName,
          last_name: signupData.lastName,
          email: signupData.email,
          phone: signupData.phone || "",
          address: signupData.address || "",
          city: signupData.city || "",
          state: signupData.state || "",
          country: signupData.country || "",
          postal_code: signupData.postalCode || "",
        });
      } else if (signupData.userType === "vendor") {
        await createVendor({
          vendor_user_id: backendUser.id,
          vendor_types: signupData.vendorTypes || "",
          name: `${signupData.firstName} ${signupData.lastName}`,
          company_name: signupData.businessName || "",
          email: signupData.email,
          phone: signupData.phone || "",
          city: signupData.city || "",
          state: signupData.state || "",
          country: signupData.country || "",
        });
      }

      // Create login record
      await createUserLogin({
        user_id: backendUser.id,
        email_login: true,
        email: signupData.email,
        phone_login: false,
        phone: "",
        gmail_login: false,
        gmail: "",
      });

      // Create session
      await createUserSession({
        user_id: backendUser.id,
        login: "email",
        login_time: new Date().toISOString(),
        authentication_code: token,
      });

      localStorage.removeItem("signupData");
      dispatch(login(backendUser));
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
      setChecking(false);
    }
  }, [dispatch, navigate]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const user = auth.currentUser;
      if (!user) return;

      await user.reload();
      if (user.emailVerified) {
        clearInterval(interval);
        await createBackendUser();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [createBackendUser]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    const user = auth.currentUser;
    if (!user) return;

    try {
      await sendEmailVerification(user);
      setResendCooldown(60);
    } catch {
      setError("Failed to resend verification email");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-muted/30 pt-32">
        <div className="w-full max-w-md bg-background rounded-2xl shadow-lg p-8 sm:p-10 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <MailCheck className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Check Your Email
          </h2>
          <p className="text-muted-foreground mb-6">
            We've sent a verification link to{" "}
            <span className="font-semibold text-foreground">
              {auth.currentUser?.email}
            </span>
            . Please verify your email to continue.
          </p>

          {checking && !error && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Waiting for verification...
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive mb-4">{error}</p>
          )}

          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={handleResend}
            disabled={resendCooldown > 0}
          >
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : "Resend Verification Email"}
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default VerifyEmail;
