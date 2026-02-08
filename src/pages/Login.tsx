import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAt,
  faUser,
  faShieldAlt,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { faEye } from "@fortawesome/free-regular-svg-icons";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  getIdToken,
  sendPasswordResetEmail, // ✅ added
} from "firebase/auth";
import { auth } from "../../firebase";
import { useCreateUserSessionMutation } from "../features/api/userSessionsApi";
import { AxiosError } from "axios";
import { useCreateUserLoginMutation } from "../features/api/userLoginsApi";
import { useDispatch } from "react-redux";
import { login, logout, setLoading as setPageLoading } from "../features/authSlice";
import { useGetUserByFirebaseIdQuery } from "../features/api/usersApi";

// --- STYLE CONSTANTS ---
const GOLD_BG = "bg-[rgb(212_160_23)]";
const GOLD_TEXT = "text-[rgb(212_160_23)]";
const GOLD_RING_FOCUS = "focus-within:ring-[rgb(212_160_23_/_0.35)]";
const GOLD_BORDER_FOCUS = "focus-within:border-[rgb(212_160_23_/_1)]";

// --- DIMENSIONS ---
const CARD_SIZE = "w-full max-w-[560px] min-h-[700px]";

// --- UI COMPONENTS ---
const FieldShell = ({
  icon,
  children,
}: {
  icon: any;
  children: React.ReactNode;
}) => (
  <div
    className={`flex px-4 py-1 bg-white rounded-lg border border-gray-300 transition-all duration-200 focus-within:ring-2 ${GOLD_RING_FOCUS} ${GOLD_BORDER_FOCUS}`}
  >
    <div className="flex-1">{children}</div>
    <FontAwesomeIcon
      icon={icon}
      className="h-5 w-5 ml-4 my-auto text-gray-300"
    />
  </div>
);

const ResetPasswordModal = ({
  open,
  onClose,
  initialEmail,
}: {
  open: boolean;
  onClose: () => void;
  initialEmail: string;
}) => {
  const [resetEmail, setResetEmail] = useState(initialEmail || "");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    // keep in sync when opening and user has typed email in main form
    if (open) {
      setResetEmail(initialEmail || "");
      setStatus(null);
      setSending(false);
    }
  }, [open, initialEmail]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setSending(true);

    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      // Best practice: generic message (don’t reveal whether email exists)
      setStatus("If an account exists for that email, a reset link has been sent.");
    } catch (err) {
      console.error("Password reset failed:", err);
      setStatus("If an account exists for that email, a reset link has been sent.");
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900">Reset password</h3>
            <p className="text-sm text-gray-500 mt-1">
              We’ll email you a link to reset your password.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition flex items-center justify-center"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {status && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
            {status}
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide ml-1">
              Email
            </label>
            <FieldShell icon={faAt}>
              <input
                className="w-full py-3.5 text-sm placeholder-gray-400 font-medium bg-white outline-none"
                type="email"
                placeholder="name@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </FieldShell>
          </div>

          <button
            type="submit"
            disabled={sending}
            className={`w-full rounded-lg ${GOLD_BG} px-5 py-4 text-sm font-bold text-white shadow-lg shadow-yellow-500/20 hover:bg-black hover:text-white hover:shadow-xl transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 disabled:hover:bg-[rgb(212_160_23)]`}
          >
            {sending ? "Sending..." : "Send reset link"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full text-sm font-bold text-gray-500 hover:text-gray-800 transition"
          >
            Back to sign in
          </button>
        </form>
      </div>
    </div>
  );
};

const RightSideGraphic3D = () => {
  return (
    <div className={`relative ${CARD_SIZE} flex items-center justify-center select-none`}>
      {/* Ambient Background Blobs */}
      <div className="absolute -top-8 right-6 w-80 h-80 bg-yellow-100 rounded-full blur-3xl opacity-70" />
      <div className="absolute top-8 -left-10 w-80 h-80 bg-gray-100 rounded-full blur-3xl opacity-70" />
      <div className="absolute -bottom-10 left-20 w-80 h-80 bg-yellow-50 rounded-full blur-3xl opacity-70" />

      {/* Main Glass Container */}
      <div className="relative w-full h-full bg-white/50 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-gray-900/5">
        <div className="h-2.5 w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 shrink-0" />

        <div className="p-10 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center space-x-3">
              <div className={`h-12 w-12 rounded-2xl ${GOLD_BG} flex items-center justify-center text-white shadow-lg shadow-yellow-500/30`}>
                <FontAwesomeIcon icon={faShieldAlt} className="h-5 w-5" />
              </div>
              <div>
                <div className="h-2.5 w-28 bg-gray-800 rounded mb-2 opacity-80" />
                <div className="h-2.5 w-16 bg-gray-400 rounded opacity-60" />
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-gray-200" />
          </div>

          {/* Tilted Card */}
          <div className="relative mt-2 flex-1 flex items-center justify-center [perspective:1200px]">
            <div className="w-full relative [transform-style:preserve-3d] transition-transform duration-500 hover:[transform:rotateY(8deg)_rotateX(6deg)] [transform:rotateY(6deg)_rotateX(5deg)]">
              <div className="bg-white rounded-3xl p-8 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.15)] border border-gray-100">
                <div className="flex justify-between items-start mb-7">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Property Status</p>
                    <h3 className="text-xl font-bold text-gray-800 mt-1.5">124 Maple Avenue</h3>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">Active</span>
                </div>

                <div className="space-y-4">
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full w-3/4 ${GOLD_BG} rounded-full`} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 font-medium">
                    <span>Inspection Progress</span>
                    <span>75%</span>
                  </div>
                </div>

                <div className="mt-8 flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 w-10 rounded-full ring-4 ring-white bg-gray-200" />
                  ))}
                  <div className="h-10 w-10 rounded-full ring-4 ring-white bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-bold">
                    +2
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -right-6 top-10 bg-white p-4 rounded-2xl shadow-xl border border-gray-50 flex items-center gap-3 [transform:translateZ(24px)]">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <FontAwesomeIcon icon={faCheckCircle} className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-800">Verified</div>
                  <div className="text-xs text-gray-400">Just now</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto text-center pt-10 opacity-70">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-500">Secure Inspector Portal</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [createUserSession] = useCreateUserSessionMutation();
  const [createUserLogin] = useCreateUserLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [loginMethod, setLoginMethod] = useState<string>("");
  const [isBackendLoading, setIsBackendLoading] = useState(false);

  // ✅ Forgot password UI state
  const [showResetPassword, setShowResetPassword] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value);
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => setAgreeToTerms(e.target.checked);
  const togglePasswordVisibility = () => setIsPasswordVisible((prev) => !prev);

  // Fetch user session from backend after Firebase login
  const {
    data: backendUser,
    isLoading: backendLoading,
    error: backendError,
  } = useGetUserByFirebaseIdQuery(firebaseUser?.uid as string, {
    skip: !firebaseUser,
  });

  // Handle Email/Password Login
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreeToTerms) {
      setError("You must agree to the terms.");
      return;
    }

    try {
      setLoading(true);
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const token = await getIdToken(user);

      setFirebaseUser(user);
      setLoginMethod("email");
      localStorage.setItem("authToken", token);
    } catch (err) {
      const error = err as AxiosError;
      console.error("Email login failed:", err);
      setError(error.message || "Failed to sign in.");
      dispatch(logout());
    } finally {
      setLoading(false);
      dispatch(setPageLoading(false));
    }
  };

  // Handle Google Login (Production Logic + Terms Check)
  const handleGoogleSignIn = async () => {
    if (!agreeToTerms) {
      setError("You must agree to the terms.");
      return;
    }

    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);

      const token = await getIdToken(user);

      setFirebaseUser(user);
      setLoginMethod("gmail");
      localStorage.setItem("authToken", token);
    } catch (err) {
      const error = err as AxiosError;
      console.error("Google login failed:", error);
      setError(error.message || "Failed to sign in with Google.");
      dispatch(logout());
    } finally {
      setLoading(false);
      dispatch(setPageLoading(false));
    }
  };

  const handleSignUp = () => {
    navigate("/signup");
  };

  useEffect(() => {
    if (firebaseUser && backendLoading) setIsBackendLoading(true);
    if (backendUser) setIsBackendLoading(false);
  }, [backendLoading, backendUser, firebaseUser]);

  // Once `backendUser` is available, create user session
  useEffect(() => {
    const proceed = async () => {
      if (!firebaseUser || !backendUser) return;

      try {
        // Optional: Avoid duplicate login row
        try {
          await createUserLogin({
            user_id: backendUser.id,
            email_login: loginMethod === "email",
            email: loginMethod === "email" ? firebaseUser.email : "",
            phone_login: false,
            phone: "",
            gmail_login: loginMethod === "gmail",
            gmail: loginMethod === "gmail" ? firebaseUser.email : "",
          }).unwrap();
        } catch (loginErr: any) {
          if (
            loginErr?.status === 409 ||
            (loginErr?.status === 400 &&
              loginErr?.data?.detail?.includes("duplicate key value"))
          ) {
            // ignore
          } else {
            throw loginErr;
          }
        }

        // Create session
        await createUserSession({
          user_id: backendUser.id,
          login: loginMethod,
          login_time: new Date().toISOString(),
          authentication_code: localStorage.getItem("authToken") || "",
        }).unwrap();

        dispatch(login(backendUser));
        navigate("/dashboard");
      } catch (err) {
        console.error("Error during login/session:", err);
        setError("Login failed. Please try again.");
        dispatch(logout());
      } finally {
        setLoading(false);
        dispatch(setPageLoading(false));
      }
    };

    if (!backendLoading && firebaseUser) {
      if (!backendUser && backendError) {
        setError("User not found in backend. Please sign up.");
        setLoading(false);
        setFirebaseUser(null);
        return;
      }
      proceed();
    }
  }, [firebaseUser, backendUser, backendLoading, backendError, createUserLogin, createUserSession, dispatch, loginMethod, navigate]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden">
      {/* ✅ Forgot Password Modal */}
      <ResetPasswordModal
        open={showResetPassword}
        onClose={() => setShowResetPassword(false)}
        initialEmail={email}
      />

      {/* LEFT BRANDING (33% Width) */}
      <div className="hidden lg:flex lg:w-4/12 flex-col justify-center bg-gray-900 text-white h-screen px-12 xl:px-20 shrink-0 relative z-10 sticky top-0">
        <div className="slide-in">
          <div className={`inline-flex items-center gap-2 rounded-full ${GOLD_BG} px-4 py-2 mb-8 shadow-lg shadow-yellow-500/20`}>
            <FontAwesomeIcon icon={faUser} className="text-white text-xs" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">Member Access</span>
          </div>

          <h1 className="text-5xl xl:text-6xl font-extrabold tracking-tight mb-6">Welcome Back.</h1>
          <p className="text-lg font-light leading-relaxed max-w-sm text-gray-400">
            Sign in to manage your properties, connect with vendors, and track your home maintenance effortlessly.
          </p>

          <div className={`mt-12 h-1.5 w-24 ${GOLD_BG} rounded-full`} />
        </div>
      </div>

      {/* RIGHT SIDE (67% Width) */}
      <div className="w-full lg:w-8/12 min-h-screen flex items-center justify-center lg:justify-start lg:pl-20 xl:pl-24 bg-white p-6 relative">
        {/* Content Container */}
        <div className="w-full max-w-[1400px] flex items-center justify-center lg:justify-start gap-16 2xl:gap-24 px-4">
          {/* SIGN IN CARD */}
          <div className={`${CARD_SIZE} bg-white rounded-3xl shadow-2xl p-10 relative z-20 flex flex-col shrink-0`}>
            <div className="text-center shrink-0">
              <h2 className="text-3xl font-extrabold text-gray-900">Sign In</h2>
              <p className="text-gray-500 mt-2 text-sm">Join our community</p>
            </div>

            <div className="flex-1 flex flex-col justify-center py-6">
              {error && !isBackendLoading && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium flex items-center justify-center gap-2 text-center">
                  {error}
                </div>
              )}

              {/* FORM START - Email/Password */}
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide ml-1">
                    Email
                  </label>
                  <FieldShell icon={faAt}>
                    <input
                      className="w-full py-3.5 text-sm placeholder-gray-400 font-medium bg-white outline-none"
                      type="email"
                      placeholder="name@email.com"
                      value={email}
                      onChange={handleEmailChange}
                      required
                    />
                  </FieldShell>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                      Password
                    </label>

                    {/* ✅ Forgot password link */}
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setShowResetPassword(true);
                      }}
                      className="text-xs font-bold text-gray-500 hover:text-gray-900 transition underline underline-offset-4"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div
                    className={`flex px-4 py-1 bg-white rounded-lg border border-gray-300 focus-within:ring-2 ${GOLD_RING_FOCUS} ${GOLD_BORDER_FOCUS} transition-all duration-200`}
                  >
                    <input
                      className="flex-1 w-full py-3.5 text-sm placeholder-gray-400 font-medium bg-white outline-none"
                      type={isPasswordVisible ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={handlePasswordChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="ml-4 text-gray-300 hover:text-gray-600 transition"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center px-1">
                  <label className="inline-flex items-center text-xs text-gray-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                      checked={agreeToTerms}
                      onChange={handleCheckboxChange}
                    />
                    <span className="ml-2">
                      I agree to{" "}
                      <a href="#" className="underline hover:text-gray-800">
                        Privacy Policy
                      </a>{" "}
                      and{" "}
                      <a href="#" className="underline hover:text-gray-800">
                        Terms of Use
                      </a>
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full rounded-lg ${GOLD_BG} px-5 py-4 text-sm font-bold text-white shadow-lg shadow-yellow-500/20 hover:bg-black hover:text-white hover:shadow-xl transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 disabled:hover:bg-[rgb(212_160_23)]`}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </form>
              {/* END FORM */}

              <div className="relative mt-8 mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    or continue with
                  </span>
                </div>
              </div>

              {/* GOOGLE BUTTON - Strictly outside Form, prevents reload */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="group flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-4 text-sm font-bold shadow-sm hover:bg-black hover:border-black hover:text-white transition-all duration-300 disabled:opacity-70"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-gray-600 font-semibold group-hover:text-white transition-colors">
                  Sign In with Google
                </span>
              </button>
            </div>

            <div className="mt-auto pt-4 text-center shrink-0">
              <p className="text-xs text-gray-400 font-medium">
                Don't have an account?{" "}
                <button
                  onClick={handleSignUp}
                  className={`font-bold ${GOLD_TEXT} hover:text-black transition`}
                >
                  Sign up now
                </button>
              </p>
            </div>
          </div>

          {/* GRAPHIC (Visible on 2XL) */}
          <div className="hidden 2xl:flex items-center justify-center shrink-0">
            <RightSideGraphic3D />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
