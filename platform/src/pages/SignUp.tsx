import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  signOut,
  getIdToken,
} from "firebase/auth";
import { auth, googleProvider } from "../../firebase";
import { login } from "@/features/authSlice";
import { createUser, getUserByFirebaseId } from "@/features/api/usersApi";
import { createUserLogin } from "@/features/api/userLoginsApi";
import { createUserSession } from "@/features/api/userSessionsApi";
import { createClient } from "@/features/api/clientsApi";
import { createVendor } from "@/features/api/vendorsApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, AtSign, Eye, EyeOff, Building2, MapPin, Phone, Loader2 } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useToast } from "@/hooks/use-toast";

type Role = "homeowner" | "vendor";

const TRADES = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Roofing",
  "General Contracting",
  "Painting",
  "Landscaping",
  "Flooring",
  "Carpentry",
  "Masonry",
];

const SignUp = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toast } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const roleParam = searchParams.get("role") === "vendor" ? "vendor" : "homeowner";
  const [role, setRole] = useState<Role>(roleParam);

  useEffect(() => {
    setRole(roleParam);
  }, [roleParam]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Homeowner fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  // Vendor fields
  const [vendorStep, setVendorStep] = useState(1);
  const [trade, setTrade] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [website, setWebsite] = useState("");

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setSearchParams({ role: newRole });
    setVendorStep(1);
  };

  // Email/Password signup for homeowners
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreed) {
      toast({ title: "Please agree to the terms", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // 1. Create Firebase user
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await getIdToken(credential.user);

      // 2. Send email verification
      await sendEmailVerification(credential.user);

      // 3. Store form data for after verification
      localStorage.setItem(
        "signupData",
        JSON.stringify({
          userType: "client",
          firstName,
          lastName,
          email,
        })
      );

      // 4. Redirect to verify-email
      navigate("/verify-email");
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message.includes("auth/email-already-in-use")
          ? "An account with this email already exists"
          : `Sign up failed: ${err instanceof Error ? err.message : String(err)}`;
      toast({ title: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Email/Password signup for vendors (multi-step)
  const handleVendorNext = async (e: React.FormEvent) => {
    e.preventDefault();

    if (vendorStep < 3) {
      // Validate current step
      if (vendorStep === 1) {
        if (!trade) {
          toast({ title: "Please select a trade", variant: "destructive" });
          return;
        }
        if (!email) {
          toast({ title: "Please enter your email", variant: "destructive" });
          return;
        }
        if (!password || !confirmPassword) {
          toast({ title: "Please enter a password", variant: "destructive" });
          return;
        }
        if (password !== confirmPassword) {
          toast({ title: "Passwords do not match", variant: "destructive" });
          return;
        }
        if (password.length < 6) {
          toast({ title: "Password must be at least 6 characters", variant: "destructive" });
          return;
        }
        if (!agreed) {
          toast({ title: "Please agree to the terms", variant: "destructive" });
          return;
        }
      }
      setVendorStep(vendorStep + 1);
      return;
    }

    // Final submit (step 3)
    setLoading(true);
    try {
      // 1. Create Firebase user
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await getIdToken(credential.user);

      // 2. Send email verification
      await sendEmailVerification(credential.user);

      // 3. Store form data for after verification
      localStorage.setItem(
        "signupData",
        JSON.stringify({
          userType: "vendor",
          firstName: businessName,
          lastName: "",
          email,
          vendorTypes: trade,
          businessName,
          city,
          state: province,
          phone: phoneNumber,
        })
      );

      // 4. Redirect to verify-email
      navigate("/verify-email");
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message.includes("auth/email-already-in-use")
          ? "An account with this email already exists"
          : `Sign up failed: ${err instanceof Error ? err.message : String(err)}`;
      toast({ title: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Google sign-up (works for both homeowner and vendor)
  const handleGoogleSignUp = async () => {
    if (!agreed) {
      toast({ title: "Please agree to the terms", variant: "destructive" });
      return;
    }

    if (role === "vendor" && !trade) {
      toast({ title: "Please select a trade first", variant: "destructive" });
      return;
    }

    setGoogleLoading(true);
    try {
      // 1. Google popup
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();

      // 2. Check if user already exists
      try {
        await getUserByFirebaseId(result.user.uid);
        // User exists — sign out and show error
        await signOut(auth);
        toast({
          title: "An account with this Google email already exists. Please log in instead.",
          variant: "destructive",
        });
        setGoogleLoading(false);
        return;
      } catch {
        // 404 = new user, proceed
      }

      localStorage.setItem("authToken", token);

      const displayName = result.user.displayName || "";
      const [gFirstName, ...rest] = displayName.split(" ");
      const gLastName = rest.join(" ");
      const gEmail = result.user.email || "";

      const userType = role === "vendor" ? "vendor" : "client";

      // 3. Create base user
      const backendUser = await createUser({
        firebase_id: result.user.uid,
        user_type: { user_type: userType },
        email: gEmail,
        first_name: gFirstName,
        last_name: gLastName,
      });

      // 4. Create role-specific profile
      if (userType === "client") {
        await createClient({
          user_id: backendUser.id,
          first_name: gFirstName,
          last_name: gLastName,
          email: gEmail,
          phone: "",
          address: "",
          city: "",
          state: "",
          country: "",
          postal_code: "",
        });
      } else {
        await createVendor({
          vendor_user_id: backendUser.id,
          vendor_types: trade,
          name: displayName,
          company_name: businessName || displayName,
          email: gEmail,
          phone: phoneNumber || "",
          city: city || "",
          state: province || "",
          country: "",
        });
      }

      // 5. Create login record
      await createUserLogin({
        user_id: backendUser.id,
        email_login: false,
        email: "",
        phone_login: false,
        phone: "",
        gmail_login: true,
        gmail: gEmail,
      });

      // 6. Create session
      await createUserSession({
        user_id: backendUser.id,
        login: "gmail",
        login_time: new Date().toISOString(),
        authentication_code: token,
      });

      // 7. Redux dispatch + redirect
      dispatch(login(backendUser));

      if (userType === "vendor") {
        navigate("/vendor");
      } else {
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : `Google sign-up failed: ${String(err)}`;
      toast({ title: message, variant: "destructive" });
    } finally {
      setGoogleLoading(false);
    }
  };

  const leftPanelContent = {
    homeowner: {
      badge: "FOR HOMEOWNERS",
      badgeIcon: <User className="h-4 w-4" />,
      title: <>Inspectly<br />Homeowner</>,
      subtitle: "Start with a basic account — complete your profile after signup.",
      bullets: ["Track inspections", "Find trusted vendors", "Keep everything organized"],
    },
    vendor: {
      badge: "FOR PROS",
      badgeIcon: <Building2 className="h-4 w-4" />,
      title: <>Inspectly<br />Vendor</>,
      subtitle: "Join the pro network — get discovered by homeowners and win more jobs.",
      bullets: ["Get customer leads", "Manage requests faster", "Grow your reviews"],
    },
  };

  const panel = leftPanelContent[role];

  const stepIndicator = (
    <div className="flex items-center justify-center gap-0 mb-6">
      {[
        { num: 1, label: "Account" },
        { num: 2, label: "Location" },
        { num: 3, label: "Contact" },
      ].map((step, i) => (
        <div key={step.num} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                vendorStep >= step.num
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground"
              }`}
            >
              {step.num}
            </div>
            <span
              className={`text-sm font-medium ${
                vendorStep >= step.num ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < 2 && <div className="w-12 h-px bg-border mx-3" />}
        </div>
      ))}
    </div>
  );

  const renderVendorStep = () => {
    if (vendorStep === 1) {
      return (
        <>
          {/* Services Offered */}
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-foreground uppercase">
              Services Offered
            </label>
            <Select value={trade} onValueChange={setTrade}>
              <SelectTrigger className="h-12 rounded-xl border-border bg-background">
                <SelectValue placeholder="Select trades..." />
              </SelectTrigger>
              <SelectContent>
                {TRADES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <div className="relative">
              <Input
                type="email"
                placeholder="Email Address"
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
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
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

          {/* Confirm Password */}
          <div className="space-y-2">
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 pr-10 rounded-xl border-border bg-background"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </>
      );
    }

    if (vendorStep === 2) {
      return (
        <>
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-foreground uppercase">
              Business Name
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Your business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="h-12 pr-10 rounded-xl border-border bg-background"
              />
              <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-foreground uppercase">
              City
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Your city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-12 pr-10 rounded-xl border-border bg-background"
              />
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-foreground uppercase">
              Province
            </label>
            <Select value={province} onValueChange={setProvince}>
              <SelectTrigger className="h-12 rounded-xl border-border bg-background">
                <SelectValue placeholder="Select province..." />
              </SelectTrigger>
              <SelectContent>
                {["Ontario", "British Columbia", "Alberta", "Quebec", "Manitoba", "Saskatchewan", "Nova Scotia", "New Brunswick", "Newfoundland", "PEI"].map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      );
    }

    // Step 3
    return (
      <>
        <div className="space-y-2">
          <label className="text-xs font-semibold tracking-wider text-foreground uppercase">
            Phone Number
          </label>
          <div className="relative">
            <Input
              type="tel"
              placeholder="(416) 555-0123"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="h-12 pr-10 rounded-xl border-border bg-background"
            />
            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold tracking-wider text-foreground uppercase">
            Website (Optional)
          </label>
          <Input
            type="url"
            placeholder="https://yourwebsite.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="h-12 rounded-xl border-border bg-background"
          />
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-20">
        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-1/3 bg-foreground text-background relative flex-col justify-center px-12 xl:px-16">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-8">
              {panel.badgeIcon}
              {panel.badge}
            </div>
            <h1 className="font-display text-5xl xl:text-6xl font-bold leading-tight mb-6">
              {panel.title}
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
              {panel.subtitle}
            </p>
            <ul className="mt-8 space-y-3">
              {panel.bullets.map((b) => (
                <li key={b} className="flex items-center gap-3 text-background/80">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-12 w-16 h-1 bg-primary rounded-full" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground to-primary/10" />
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex items-center justify-center px-6 py-6 bg-muted/30 overflow-y-auto">
          <div className="w-full max-w-md bg-background rounded-2xl shadow-lg p-6 sm:p-8">
            <div className="text-center mb-4">
              <h2 className="font-display text-2xl font-bold text-foreground mb-1">Create an Account</h2>
              <p className="text-muted-foreground">
                {role === "homeowner"
                  ? "Create your account in seconds."
                  : "Create your vendor profile in a few steps."}
              </p>
            </div>

            {/* Role Tabs */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => handleRoleChange("homeowner")}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  role === "homeowner"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <User className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <div className="font-semibold text-sm text-foreground">Homeowner</div>
                  <div className="text-xs text-muted-foreground">Create a basic account</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("vendor")}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  role === "vendor"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <div className="font-semibold text-sm text-foreground">Vendor</div>
                  <div className="text-xs text-muted-foreground">Join the pro network</div>
                </div>
              </button>
            </div>

            {/* Homeowner Form */}
            {role === "homeowner" && (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-12 pr-10 rounded-xl border-border bg-background"
                    required
                  />
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>

                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-12 pr-10 rounded-xl border-border bg-background"
                    required
                  />
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>

                <div className="relative">
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pr-10 rounded-xl border-border bg-background"
                    required
                  />
                  <AtSign className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
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

                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 pr-10 rounded-xl border-border bg-background"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <Checkbox
                    id="signup-terms"
                    checked={agreed}
                    onCheckedChange={(v) => setAgreed(v === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="signup-terms" className="text-sm text-muted-foreground">
                    I agree to the{" "}
                    <Link to="/terms" className="underline text-foreground hover:text-primary">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/terms" className="underline text-foreground hover:text-primary">
                      Privacy Policy
                    </Link>.
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="gold"
                  size="xl"
                  className="w-full rounded-xl text-base font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating Account...</>
                  ) : (
                    "Create Account"
                  )}
                </Button>

                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Or continue with</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="xl"
                  className="w-full rounded-xl border-border font-medium"
                  onClick={handleGoogleSignUp}
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
                  Sign Up with Google
                </Button>
              </form>
            )}

            {/* Vendor Multi-Step Form */}
            {role === "vendor" && (
              <form onSubmit={handleVendorNext} className="space-y-3">
                {stepIndicator}
                {renderVendorStep()}

                {vendorStep === 1 && (
                  <div className="flex items-start gap-2 pt-1">
                    <Checkbox
                      id="vendor-terms"
                      checked={agreed}
                      onCheckedChange={(v) => setAgreed(v === true)}
                      className="mt-0.5"
                    />
                    <label htmlFor="vendor-terms" className="text-sm text-muted-foreground">
                      I agree to the{" "}
                      <Link to="/terms" className="underline text-foreground hover:text-primary">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/terms" className="underline text-foreground hover:text-primary">
                        Privacy Policy
                      </Link>.
                    </label>
                  </div>
                )}

                <div className="flex gap-3">
                  {vendorStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="xl"
                      className="flex-1 rounded-xl font-semibold"
                      onClick={() => setVendorStep(vendorStep - 1)}
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="gold"
                    size="xl"
                    className={`rounded-xl text-base font-semibold ${vendorStep > 1 ? "flex-1" : "w-full"}`}
                    disabled={loading && vendorStep === 3}
                  >
                    {vendorStep < 3 ? (
                      "Next Step"
                    ) : loading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating Account...</>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Or continue with</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="xl"
                  className="w-full rounded-xl border-border font-medium"
                  onClick={handleGoogleSignUp}
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
                  Sign Up with Google
                </Button>
              </form>
            )}

            {/* Footer */}
            <p className="text-center text-sm text-muted-foreground mt-5">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SignUp;
