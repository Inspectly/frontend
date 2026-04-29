import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, googleProvider } from "../../firebase";
import { login } from "@/features/authSlice";
import { getUserByFirebaseId } from "@/features/api/usersApi";
import { createUserLogin } from "@/features/api/userLoginsApi";
import { createUserSession } from "@/features/api/userSessionsApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { User, AtSign, Eye, EyeOff, Loader2 } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Password reset state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCooldown, setResetCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreed) {
      toast({ title: "Please agree to the terms", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // 1. Firebase auth
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const token = await credential.user.getIdToken();
      localStorage.setItem("authToken", token);

      // 2. Backend lookup
      const backendUser = await getUserByFirebaseId(credential.user.uid);

      // 3. Create login record
      await createUserLogin({
        user_id: backendUser.id,
        email_login: true,
        email: email,
        phone_login: false,
        phone: "",
        gmail_login: false,
        gmail: "",
      });

      // 4. Create session
      await createUserSession({
        user_id: backendUser.id,
        login: "email",
        login_time: new Date().toISOString(),
        authentication_code: token,
      });

      // 5. Redux dispatch + redirect
      dispatch(login(backendUser));

      if (backendUser.user_type === "vendor") {
        navigate("/vendor");
      } else {
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message.includes("auth/invalid-credential")
          ? "Invalid email or password"
          : err instanceof Error && err.message.includes("auth/user-not-found")
          ? "No account found with this email"
          : `Login failed: ${err instanceof Error ? err.message : String(err)}`;
      toast({ title: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!agreed) {
      toast({ title: "Please agree to the terms", variant: "destructive" });
      return;
    }

    setGoogleLoading(true);
    try {
      // 1. Google popup
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      localStorage.setItem("authToken", token);

      // 2. Backend lookup
      const backendUser = await getUserByFirebaseId(result.user.uid);

      // 3. Create login record
      await createUserLogin({
        user_id: backendUser.id,
        email_login: false,
        email: "",
        phone_login: false,
        phone: "",
        gmail_login: true,
        gmail: result.user.email || "",
      });

      // 4. Create session
      await createUserSession({
        user_id: backendUser.id,
        login: "gmail",
        login_time: new Date().toISOString(),
        authentication_code: token,
      });

      // 5. Redux dispatch + redirect
      dispatch(login(backendUser));

      if (backendUser.user_type === "vendor") {
        navigate("/vendor");
      } else {
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message.includes("Failed to get user")
          ? "No account found. Please sign up first."
          : `Google sign-in failed: ${err instanceof Error ? err.message : String(err)}`;
      toast({ title: message, variant: "destructive" });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({ title: "Please enter your email", variant: "destructive" });
      return;
    }
    if (resetCooldown > 0) return;

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({ title: "If an account exists, a reset link has been sent." });
      setResetCooldown(60);
      const interval = setInterval(() => {
        setResetCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      toast({ title: "If an account exists, a reset link has been sent." });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-20">
        {/* Left Panel - Dark */}
        <div className="hidden lg:flex lg:w-1/3 bg-foreground text-background relative flex-col justify-center px-12 xl:px-16">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-8">
              <User className="h-4 w-4" />
              MEMBER ACCESS
            </div>
            <h1 className="font-display text-5xl xl:text-6xl font-bold leading-tight mb-6">
              Welcome<br />Back.
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
              Sign in to manage your properties, connect with vendors, and track your home maintenance effortlessly.
            </p>
            <div className="mt-12 w-16 h-1 bg-primary rounded-full" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground to-primary/10" />
        </div>

        {/* Right Panel - Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 bg-muted/30">
          <div className="w-full max-w-md bg-background rounded-2xl shadow-lg p-8 sm:p-10">
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl font-bold text-foreground mb-2">Sign In</h2>
              <p className="text-muted-foreground">Join our community</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wider text-foreground uppercase">
                  Email
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pr-10 rounded-xl border-border bg-background"
                    required
                  />
                  <AtSign className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold tracking-wider text-foreground uppercase">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setShowResetModal(true);
                    }}
                    className="text-xs font-medium text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-10 rounded-xl border-border bg-background"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="terms"
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(v === true)}
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground">
                  I agree to{" "}
                  <Link to="/terms" className="underline text-foreground hover:text-primary">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link to="/terms" className="underline text-foreground hover:text-primary">
                    Terms of Use
                  </Link>
                </label>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="gold"
                size="xl"
                className="w-full rounded-xl text-base font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing In...</>
                ) : (
                  "Sign In"
                )}
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Or continue with</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Google */}
              <Button
                type="button"
                variant="outline"
                size="xl"
                className="w-full rounded-xl border-border font-medium"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                Sign In with Google
              </Button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-muted-foreground mt-8">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary font-semibold hover:underline">
                Sign up now
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm bg-background rounded-2xl shadow-xl p-6 mx-4">
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              Reset Password
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your email and we'll send a password reset link.
            </p>
            <Input
              type="email"
              placeholder="name@email.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="h-12 rounded-xl border-border bg-background mb-4"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="gold"
                className="flex-1 rounded-xl"
                onClick={handlePasswordReset}
                disabled={resetCooldown > 0}
              >
                {resetCooldown > 0 ? `Wait ${resetCooldown}s` : "Send Link"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Login;
