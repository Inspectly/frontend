import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  getIdToken,
  signOut,
} from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faAt, 
  faMobileScreen, 
  faCheck,
  faHouse
} from "@fortawesome/free-solid-svg-icons";
import {
  faBuilding,
  faEnvelope,
  faEye,
  faMap,
  faUser,
  faFileLines
} from "@fortawesome/free-regular-svg-icons";
// Note: faGoogle import kept to prevent build errors if referenced elsewhere
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

import {
  getUserByFirebaseId,
  useCreateUserMutation,
} from "../features/api/usersApi";
import { useCreateClientMutation } from "../features/api/clientsApi";
import { useCreateRealtorMutation } from "../features/api/realtorsApi";
import {
  useCreateVendorMutation,
  useGetVendorsQuery,
} from "../features/api/vendorsApi";
import { useGetVendorTypesQuery } from "../features/api/vendorTypesApi";
import Select from "react-select";
import "../styles/Select.css";
import { useCreateUserLoginMutation } from "../features/api/userLoginsApi";
import { useCreateUserSessionMutation } from "../features/api/userSessionsApi";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store/store";
import { login, logout, setLoading as setPageLoading } from "../features/authSlice";
import { nanoid } from "nanoid";

// --- TYPES ---
type VendorStep = 0 | 1 | 2;

// --- STYLES CONSTANTS ---
// Using tailwind.config.js gold color (rgb 212, 160, 23)
const GOLD_BG = "bg-gold";
const GOLD_TEXT = "text-gold";
const GOLD_BORDER = "border-gold";
const GOLD_RING_SOFT = "ring-gold-300";
const GOLD_RING_FOCUS = "focus-within:ring-gold-300";
const GOLD_BG_SOFT_16 = "bg-gold-200";
const GOLD_BG_SOFT_18 = "bg-gold-200";
const GOLD_SELECTED_BG = "bg-gold-200";

// --- DIMENSIONS (Matched exactly to your Login code) ---
const CARD_SIZE = "w-full max-w-[560px] min-h-[700px]";

// --- COMPONENTS ---

// FIXED: Moved FieldShell outside of the main component to prevent re-rendering/focus loss
const FieldShell = ({ icon, children }: { icon: any; children: React.ReactNode }) => (
  <div className={`flex px-4 py-1 bg-white rounded-lg border border-gray-300 focus-within:ring-2 ${GOLD_RING_FOCUS} focus-within:border-gold transition`}>
    <div className="flex-1">
      {children}
    </div>
    <FontAwesomeIcon icon={icon} className="h-5 w-5 ml-4 my-auto text-gray-300" />
  </div>
);

const RightSideGraphic3D = ({ isVendor }: { isVendor: boolean }) => {
  return (
    <div className="relative h-[560px] w-[420px] max-w-[420px]">
      {/* background glow */}
      <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(80%_60%_at_70%_20%,rgb(212_160_23_/_0.22),transparent_55%),radial-gradient(70%_60%_at_10%_90%,rgba(17,24,39,0.18),transparent_60%)]" />

      {/* subtle frame */}
      <div className="absolute inset-0 rounded-3xl bg-white/50 backdrop-blur-[2px] shadow-2xl" />

      {/* 3D stack */}
      <div className="relative h-full p-6 [perspective:1200px]">
        <div className={`absolute left-6 top-6 inline-flex items-center gap-2 rounded-full ${GOLD_BG_SOFT_16} px-3 py-1 text-xs font-semibold text-gray-900`}>
          <span className={`h-2 w-2 rounded-full ${GOLD_BG}`} />
          {isVendor ? "Vendor onboarding" : "Homeowner setup"}
        </div>

        <div className="absolute inset-x-6 top-20 bottom-6">
          <div className="relative h-full w-full">
            
            {/* --- BACK CARD --- */}
            <div className="absolute left-6 top-10 w-[340px] rounded-2xl border border-gray-200 bg-white shadow-sm transform-gpu [transform:rotateY(-18deg)_rotateX(10deg)_translateZ(-40px)]">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-gray-900">
                    {isVendor ? "Insights" : "Activity"}
                  </div>
                  <div className="text-xs text-gray-400">Last 7 days</div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-200 p-3">
                    <div className="text-xs text-gray-500">
                      {isVendor ? "New leads" : "Spent"}
                    </div>
                    <div className="mt-1 text-lg font-extrabold text-gray-900">
                      {isVendor ? "18" : "$450"}
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
                      <div className={`h-1.5 rounded-full ${GOLD_BG} ${isVendor ? "w-2/3" : "w-1/3"}`} />
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-3">
                    <div className="text-xs text-gray-500">
                      {isVendor ? "Response" : "Reports"}
                    </div>
                    <div className="mt-1 text-lg font-extrabold text-gray-900">
                      {isVendor ? "92%" : "3"}
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
                      <div className={`h-1.5 rounded-full bg-gray-900 ${isVendor ? "w-4/5" : "w-full"}`} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-gray-50 p-3">
                  <div className="text-xs font-semibold text-gray-900">
                    {isVendor ? "Top category" : "Recent Service"}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {isVendor ? "Plumbing • Electrical • HVAC" : "HVAC Tune-up • Gutter Clean"}
                  </div>
                </div>
              </div>
            </div>

            {/* --- MID CARD --- */}
            <div className="absolute right-2 top-24 w-[360px] rounded-2xl border border-gray-200 bg-white shadow-md transform-gpu [transform:rotateY(14deg)_rotateX(8deg)_translateZ(10px)]">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-gray-900">
                    {isVendor ? "Job Requests" : "Upcoming"}
                  </div>
                  <div className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                    {isVendor ? "Live" : "Scheduled"}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                    <div>
                      <div className="text-xs font-semibold text-gray-900">
                        {isVendor ? "Kitchen sink leak" : "Annual HVAC Check"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isVendor ? "2 km away • High priority" : "Tomorrow • 10:00 AM"}
                      </div>
                    </div>
                    <div className={`h-8 w-8 rounded-lg ${GOLD_BG_SOFT_18} flex items-center justify-center`}>
                       <div className={`h-2 w-2 rounded-full ${GOLD_BG}`}></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                    <div>
                      <div className="text-xs font-semibold text-gray-900">
                        {isVendor ? "Panel inspection" : "Gutter Cleaning"}
                      </div>
                      <div className="text-xs text-gray-500">
                         {isVendor ? "8 km away • Quote requested" : "Sat, Oct 12 • 2:00 PM"}
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-gray-100" />
                  </div>
                </div>
              </div>
            </div>

            {/* --- FRONT HERO CARD --- */}
            <div className="absolute left-0 bottom-0 w-[400px] rounded-3xl border border-gray-200 bg-white shadow-xl transform-gpu [transform:rotateY(-6deg)_rotateX(10deg)_translateZ(60px)]">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-gray-500">Inspectly</div>
                    <div className="text-base font-extrabold text-gray-900">
                      {isVendor ? "Vendor Dashboard" : "My Home"}
                    </div>
                  </div>
                  <div className={`h-10 w-10 rounded-2xl ${GOLD_BG} shadow-sm flex items-center justify-center text-white`}>
                     <FontAwesomeIcon icon={isVendor ? faBuilding : faHouse} />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <div className="text-[11px] text-gray-500">
                      {isVendor ? "Today" : "Alerts"}
                    </div>
                    <div className="mt-1 text-lg font-extrabold text-gray-900">
                      {isVendor ? "4" : "0"}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {isVendor ? "new requests" : "active"}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <div className="text-[11px] text-gray-500">
                       {isVendor ? "Quotes" : "Value"}
                    </div>
                    <div className="mt-1 text-lg font-extrabold text-gray-900">
                      {isVendor ? "7" : "+5%"}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {isVendor ? "pending" : "ytd"}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <div className="text-[11px] text-gray-500">
                      {isVendor ? "Rating" : "Score"}
                    </div>
                    <div className="mt-1 text-lg font-extrabold text-gray-900">
                      {isVendor ? "5.0" : "98"}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {isVendor ? "new vendor" : "/100"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-gray-900">
                      {isVendor ? "Complete profile" : "Maintenance Score"}
                    </div>
                    <div className="text-xs font-semibold text-gray-500">
                      {isVendor ? "65%" : "Good"}
                    </div>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                    <div className={`h-2 rounded-full ${GOLD_BG} transition-all duration-500 ${isVendor ? "w-[65%]" : "w-[98%]"}`} />
                  </div>
                  <div className="mt-3 text-xs text-gray-600">
                    {isVendor 
                      ? "Add your service area & verification to get more leads." 
                      : "Your home is in great shape! No critical items found."}
                  </div>
                </div>
              </div>
            </div>

            {/* floating chips */}
            <div className="absolute left-8 top-2 rounded-full border border-gray-200 bg-white/80 px-3 py-1 text-[11px] font-semibold text-gray-700 shadow-sm transform-gpu [transform:translateZ(80px)_rotateX(8deg)]">
              {isVendor ? "Faster quotes" : "Trusted Pros"}
            </div>
            <div className="absolute right-10 bottom-16 rounded-full border border-gray-200 bg-white/80 px-3 py-1 text-[11px] font-semibold text-gray-700 shadow-sm transform-gpu [transform:translateZ(70px)_rotateX(8deg)]">
              {isVendor ? "Verified pros" : "Fair Pricing"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  const [createUser] = useCreateUserMutation();
  const [createUserLogin] = useCreateUserLoginMutation();
  const [createUserSession] = useCreateUserSessionMutation();
  const [createClient] = useCreateClientMutation();
  const [createVendor] = useCreateVendorMutation();
  const [createRealtor] = useCreateRealtorMutation();

  const { data: fetchedVendorTypes } = useGetVendorTypesQuery();
  const { data: vendors } = useGetVendorsQuery();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    userType: "client",
    password: "",
    confirmPassword: "",
  });

  const isVendor = formData.userType === "vendor";

  const roleUI = isVendor
    ? {
        kicker: "For Pros",
        title: "Inspectly Vendor",
        subtitle: "Join the pro network — get discovered by homeowners and win more jobs.",
        icon: faBuilding,
        bullets: ["Get customer leads", "Manage requests faster", "Grow your reviews"],
      }
    : {
        kicker: "For Homeowners",
        title: "Inspectly Homeowner",
        subtitle: "Start with a basic account — complete your profile after signup.",
        icon: faUser,
        bullets: ["Track inspections", "Find trusted vendors", "Keep everything organized"],
      };

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [vendorStep, setVendorStep] = useState<VendorStep>(0);

  const [vendorTypeOptions, setVendorTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedVendorTypes, setSelectedVendorTypes] = useState<{ value: string; label: string }[]>([]);

  // FIXED: Updated handler to restrict phone input to numbers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Only allow numbers for the phone field
    if (name === "phone") {
        const numericValue = value.replace(/\D/g, ""); // Remove non-numeric chars
        setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleVendorTypeChange = (selectedOptions: any) => {
    setSelectedVendorTypes(selectedOptions || []);
  };

  const togglePasswordVisibility = () => setIsPasswordVisible((prev) => !prev);
  const toggleConfirmPasswordVisibility = () => setIsConfirmPasswordVisible((prev) => !prev);

  const handleSelectRole = (role: "client" | "vendor") => {
    setError(null);
    setFormData((prev) => ({ ...prev, userType: role }));

    if (role === "client") {
      setVendorStep(0);
      setSelectedVendorTypes([]);
      setFormData((prev) => ({
        ...prev,
        phone: "",
        address: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
      }));
    } else {
      setVendorStep(0);
    }
  };

  const validateVendorStep = (step: VendorStep) => {
    if (step === 0) {
      if (!selectedVendorTypes || selectedVendorTypes.length === 0) {
        setError("Please select at least one Vendor Type.");
        return false;
      }
      if (!formData.email) {
        setError("Please enter your email.");
        return false;
      }
      if (!formData.password) {
        setError("Please enter a password.");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match!");
        return false;
      }
      return true;
    }

    if (step === 1) {
      if (
        !formData.address ||
        !formData.city ||
        !formData.state ||
        !formData.country ||
        !formData.postalCode
      ) {
        setError("Please complete your location details.");
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!formData.firstName || !formData.lastName || !formData.phone) {
        setError("Please complete your contact details.");
        return false;
      }
      return true;
    }

    return true;
  };

  const goNextVendorStep = () => {
    setError(null);
    if (!validateVendorStep(vendorStep)) return;
    setVendorStep((s) => (Math.min(2, s + 1) as VendorStep));
  };

  const goBackVendorStep = () => {
    setError(null);
    setVendorStep((s) => (Math.max(0, s - 1) as VendorStep));
  };

  const generateUniqueVendorCode = async (vendorName: string) => {
    const nameInitials = vendorName
      .split(" ")
      .map((word) => word.substring(0, 1).toUpperCase())
      .join("");

    let uniqueCode = `${nameInitials}${nanoid(3).toUpperCase()}`;

    let isUnique = false;
    while (!isUnique) {
      const codeExists = vendors?.some((vendor) => vendor.code === uniqueCode);
      if (!codeExists) {
        isUnique = true;
      } else {
        uniqueCode = `${nameInitials}${nanoid(3).toUpperCase()}`;
      }
    }
    return uniqueCode;
  };

  const formatVendorTypes = (vendorTypes: { value: string; label: string }[]) => {
    return vendorTypes.map((type) => type.value).join(", ");
  };

  const createUserType = async (
    backendUser: any,
    userType: string,
    userData: any,
    vendorTypes?: { value: string; label: string }[]
  ) => {
    const userId = backendUser.id;

    if (userType === "client") {
      return createClient({
        user_id: userId,
        ...userData,
      }).unwrap();
    } else if (userType === "vendor") {
      const { first_name, last_name, ...vendorData } = userData;
      const vendorName = `${userData.first_name} ${userData.last_name}`;
      const uniqueCode = await generateUniqueVendorCode(vendorName);

      return createVendor({
        vendor_user_id: userId,
        vendor_type: {
          vendor_type: vendorTypes && vendorTypes.length > 0 ? vendorTypes[0].value : "",
        },
        vendor_types: formatVendorTypes(vendorTypes || []),
        code: uniqueCode,
        name: vendorName,
        ...vendorData,
        rating: 5,
        review: "New Vendor",
      }).unwrap();
    } else if (userType === "realtor") {
      return createRealtor({
        realtor_user_id: userId,
        realtor_firm_id: 1,
        ...userData,
        rating: 5,
        review: "New Realtor",
      }).unwrap();
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!acceptedTerms) {
      setError("Please accept the Privacy Policy and Terms of Use.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (!formData.userType) {
      setError("Please select a user type.");
      return;
    }

    if (formData.userType === "vendor") {
      if (selectedVendorTypes.length === 0) {
        setError("Please select at least one Vendor Type.");
        setVendorStep(0);
        return;
      }
      if (!validateVendorStep(1)) {
        setVendorStep(1);
        return;
      }
      if (!validateVendorStep(2)) {
        setVendorStep(2);
        return;
      }
    }

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, {
        displayName: `${formData.firstName} ${formData.lastName}`,
      });

      await sendEmailVerification(firebaseUser);

      localStorage.setItem("signupUserData", JSON.stringify(formData));
      if (formData.userType === "vendor") {
        localStorage.setItem("signupVendorTypes", JSON.stringify(selectedVendorTypes));
      }

      navigate(`/verify-email`);
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. If already registered with google please link your account in settings");
      } else {
        setError("Error: " + err.message || err.data?.detail || "Failed to sign up.");
      }
    } finally {
      setLoading(false);
      dispatch(setPageLoading(false));
    }
  };

  const handleSignUpWithThirdParty = async () => {
    try {
      if (!formData.userType) {
        setError("Please select a role.");
        return;
      }

      if (formData.userType === "vendor" && selectedVendorTypes.length === 0) {
        setError("Please select at least one Vendor Type.");
        setVendorStep(0);
        return;
      }

      if (!acceptedTerms) {
        setError("Please accept the Privacy Policy and Terms of Use.");
        return;
      }

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const token = await getIdToken(firebaseUser);

      let backendUser = null;
      let userExists = false;

      try {
        backendUser = await dispatch(getUserByFirebaseId.initiate(firebaseUser.uid)).unwrap();
        userExists = true;
      } catch (error: any) {
        if (error?.status === 404) userExists = false;
        else throw new Error("Failed to check user existence.");
      }

      if (userExists) {
        dispatch(setPageLoading(true));
        await signOut(auth);
        localStorage.removeItem("authToken");
        localStorage.removeItem("firebase_id");
        dispatch(logout());
        dispatch(setPageLoading(false));
        navigate("/signup", {
          state: { error: "An account with this Google email already exists. Please log in instead." },
        });
        return;
      }

      backendUser = await createUser({
        firebase_id: firebaseUser.uid,
        user_type: { user_type: formData.userType },
      }).unwrap();

      const updatedUserData = {
        email: firebaseUser.email || "",
        first_name: firebaseUser.displayName?.split(" ")[0] || "",
        last_name: firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
        phone: firebaseUser.phoneNumber || "",
        address: "",
        city: "",
        state: "",
        country: "",
        postal_code: "",
      };

      try {
        await createUserType(
          backendUser,
          formData.userType,
          updatedUserData,
          formData.userType === "vendor" ? selectedVendorTypes : undefined
        );
      } catch (error: any) {
        if (error?.response?.status !== 409) await firebaseUser.delete();
        dispatch(setPageLoading(false));
        throw new Error("Failed to create user type in backend.");
      }

      try {
        await createUserLogin({
          user_id: backendUser.id,
          email_login: false,
          email: "",
          phone_login: false,
          phone: "",
          gmail_login: true,
          gmail: updatedUserData.email,
        }).unwrap();
      } catch (error: any) {
        if (error?.response?.status !== 409) await firebaseUser.delete();
        dispatch(setPageLoading(false));
        throw new Error("Failed to log user login method.");
      }

      try {
        await createUserSession({
          user_id: backendUser.id,
          login: "gmail",
          login_time: new Date().toISOString(),
          authentication_code: token,
        }).unwrap();
      } catch (error: any) {
        if (error?.response?.status !== 409) await firebaseUser.delete();
        dispatch(setPageLoading(false));
        throw new Error("Failed to create session in backend.");
      }

      const refreshedUser = await dispatch(getUserByFirebaseId.initiate(firebaseUser.uid)).unwrap();
      dispatch(login(refreshedUser));
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Google.");
      dispatch(setPageLoading(false));
    }
  };

  useEffect(() => {
    if (location.state?.error) setError(location.state.error);
  }, [location.state]);

  useEffect(() => {
    if (formData.userType === "vendor" && fetchedVendorTypes) {
      setVendorTypeOptions(
        fetchedVendorTypes.map((type) => ({
          value: type.vendor_type,
          label: type.vendor_type,
        }))
      );
    }
  }, [formData.userType, fetchedVendorTypes]);

  const StepPill = ({
    idx,
    label,
    active,
    done,
  }: {
    idx: number;
    label: string;
    active: boolean;
    done: boolean;
  }) => (
    <div className="flex items-center gap-2">
      <div
        className={[
          "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
          done
            ? `${GOLD_BG} text-white border ${GOLD_BORDER}`
            : active
            ? `border-2 ${GOLD_BORDER} ${GOLD_TEXT}`
            : "border border-gray-300 text-gray-400",
        ].join(" ")}
      >
        {done ? <FontAwesomeIcon icon={faCheck} /> : idx}
      </div>
      <div className={active ? "text-sm font-semibold text-gray-900" : "text-sm text-gray-500"}>{label}</div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden">
      
      {/* LEFT BRANDING (4/12 Width - Matched from Login) */}
      <div className="hidden lg:flex lg:w-4/12 flex-col justify-center bg-gray-900 text-white h-screen px-12 xl:px-20 shrink-0 relative z-10 sticky top-0">
        <div className="slide-in">
          <div className={`inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-4 py-2 mb-8 shadow-lg shadow-yellow-500/20`}>
            <FontAwesomeIcon icon={roleUI.icon} className="text-white text-xs" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">{roleUI.kicker}</span>
          </div>

          <h1 className="text-5xl xl:text-6xl font-extrabold tracking-tight mb-6">{roleUI.title}</h1>

          <p className="text-lg font-light leading-relaxed max-w-sm text-gray-400">{roleUI.subtitle}</p>

          <ul className="mt-8 space-y-3 text-white/80">
              {roleUI.bullets.map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-white/70" />
                  <span className="text-sm">{b}</span>
                </li>
              ))}
            </ul>

          <div className={`mt-12 h-1.5 w-24 ${GOLD_BG} rounded-full`} />
        </div>
      </div>

      {/* RIGHT SIDE (8/12 Width - Matched from Login) */}
      <div className="w-full lg:w-8/12 min-h-screen flex items-center justify-center lg:justify-start lg:pl-20 xl:pl-24 bg-white p-6 relative">
        
        {/* Content Container - Matched max-w-[1400px] and gaps */}
        <div className="w-full max-w-[1400px] flex items-center justify-center lg:justify-start gap-16 2xl:gap-24 px-4">
          
          {/* SIGN UP CARD - Matched CARD_SIZE and Styling */}
          <div className={`${CARD_SIZE} bg-white rounded-3xl shadow-2xl p-10 relative z-20 flex flex-col shrink-0`}>
            
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Create an Account</h2>
              <p className="text-gray-500 mt-1">
                {isVendor ? "Create your vendor profile in a few steps." : "Create your account in seconds."}
              </p>
            </div>

            {/* ERROR DISPLAY */}
            {error && (
               <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                 {error}
               </div>
            )}

            {/* ROLE CARDS */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => handleSelectRole("client")}
                className={[
                  "group rounded-xl p-4 text-left",
                  "transition-all duration-200 ease-out",
                  "transform-gpu hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl",
                  "shadow-lg",
                  "hover:bg-black hover:text-white",
                  !isVendor
                    ? `bg-gold-200`
                    : "bg-white"
                ].join(" ")}
                >
                <div className="flex items-center gap-3">
                  {/* icon wrapper stays WHITE on hover */}
                  <div
                    className={[
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      "bg-gray-100 transition-colors duration-200",
                      "group-hover:bg-white",
                    ].join(" ")}
                  >
                    <FontAwesomeIcon
                      icon={faUser}
                      className="text-gray-700 transition-colors duration-200 group-hover:text-gray-900"
                    />
                  </div>

                  <div>
                    <div className="font-bold text-gray-900 transition-colors duration-200 group-hover:text-white">
                      Homeowner
                    </div>
                    <div className="text-xs text-gray-500 transition-colors duration-200 group-hover:text-white/80">
                      Create a basic account
                    </div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleSelectRole("vendor")}
                className={[
                  "group rounded-xl p-4 text-left",
                  "transition-all duration-200 ease-out",
                  "transform-gpu hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl",
                  "shadow-lg",
                  "hover:bg-black hover:text-white hover:ring-2 hover:ring-white/10",
                  isVendor
                    ? `${GOLD_SELECTED_BG}`
                    : "bg-white"
                ].join(" ")}
                >
                <div className="flex items-center gap-3">
                  {/* icon wrapper stays WHITE on hover */}
                  <div
                    className={[
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      "bg-gray-100 transition-colors duration-200",
                      "group-hover:bg-white",
                    ].join(" ")}
                  >
                    <FontAwesomeIcon
                      icon={faBuilding}
                      className="text-gray-700 transition-colors duration-200 group-hover:text-gray-900"
                    />
                  </div>

                  <div>
                    <div className="font-bold text-gray-900 transition-colors duration-200 group-hover:text-white">
                      Vendor
                    </div>
                    <div className="text-xs text-gray-500 transition-colors duration-200 group-hover:text-white/80">
                      Join the pro network
                    </div>
                  </div>
                </div>
              </button>

            </div>

            <div className="bg-white rounded-2xl p-6">
              <form onSubmit={handleFormSubmit}>
                {/* VENDOR: STEP TRACKER */}
                {isVendor && (
                  <div className="flex items-center justify-between mb-6">
                    <StepPill idx={1} label="Account" active={vendorStep === 0} done={vendorStep > 0} />
                    <div className="h-px flex-1 mx-3 bg-gray-200" />
                    <StepPill idx={2} label="Location" active={vendorStep === 1} done={vendorStep > 1} />
                    <div className="h-px flex-1 mx-3 bg-gray-200" />
                    <StepPill idx={3} label="Contact" active={vendorStep === 2} done={false} />
                  </div>
                )}

                {/* CONTENT AREA */}
                <div key={isVendor ? `vendor-${vendorStep}` : "client"} className="space-y-4">
                  {/* CLIENT OR VENDOR STEP 0 */}
                  {(!isVendor || (isVendor && vendorStep === 0)) && (
                    <>
                      {/* Vendor Type Select */}
                      {isVendor && (
                        <div className="mb-2">
                           <label className="text-xs font-semibold text-gray-500 uppercase ml-1 mb-1 block">Services Offered</label>
                           <Select
                            options={vendorTypeOptions}
                            isMulti
                            value={selectedVendorTypes}
                            onChange={handleVendorTypeChange}
                            placeholder="Select trades..."
                            className="react-select-container"
                            classNamePrefix="react-select"
                          />
                        </div>
                      )}

                      {!isVendor && (
                        <>
                          <FieldShell icon={faUser}>
                            <input
                              className="w-full py-3.5 text-sm placeholder-gray-400 font-medium bg-white outline-none"
                              type="text"
                              name="firstName"
                              autoComplete="given-name"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              placeholder="First Name"
                              required
                            />
                          </FieldShell>
                          <FieldShell icon={faUser}>
                            <input
                              className="w-full py-3.5 text-sm placeholder-gray-400 font-medium bg-white outline-none"
                              type="text"
                              name="lastName"
                              autoComplete="family-name"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              placeholder="Last Name"
                              required
                            />
                          </FieldShell>
                        </>
                      )}

                      <FieldShell icon={faAt}>
                        <input
                          className="w-full py-3.5 text-sm placeholder-gray-400 font-medium bg-white outline-none"
                          type="email"
                          name="email"
                          autoComplete="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Email Address"
                          required
                        />
                      </FieldShell>

                      <div className={`flex px-4 py-1 bg-white rounded-lg border border-gray-300 focus-within:ring-2 ${GOLD_RING_FOCUS} focus-within:border-gold transition`}>
                        <input
                          className="flex-1 w-full py-3.5 text-sm placeholder-gray-400 font-medium bg-white outline-none"
                          type={isPasswordVisible ? "text" : "password"}
                          name="password"
                          autoComplete="new-password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Password"
                          required
                        />
                        <button type="button" onClick={togglePasswordVisibility} className="ml-4 text-gray-300 hover:text-gray-500">
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                      </div>

                      <div className={`flex px-4 py-1 bg-white rounded-lg border border-gray-300 focus-within:ring-2 ${GOLD_RING_FOCUS} focus-within:border-gold transition`}>
                        <input
                          className="flex-1 w-full py-3.5 text-sm placeholder-gray-400 font-medium bg-white outline-none"
                          type={isConfirmPasswordVisible ? "text" : "password"}
                          name="confirmPassword"
                          autoComplete="new-password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="Confirm Password"
                          required
                        />
                        <button type="button" onClick={toggleConfirmPasswordVisibility} className="ml-4 text-gray-300 hover:text-gray-500">
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                      </div>
                    </>
                  )}

                  {/* VENDOR STEP 1: LOCATION */}
                  {isVendor && vendorStep === 1 && (
                    <>
                       <FieldShell icon={faMap}>
                        <input
                          className="w-full py-3.5 text-sm placeholder-gray-400 font-medium bg-white outline-none"
                          type="text"
                          name="address"
                          autoComplete="street-address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Street Address"
                          required
                        />
                      </FieldShell>
                      <div className="grid grid-cols-2 gap-3">
                        <FieldShell icon={faMap}>
                          <input
                            className="w-full py-3.5 text-sm placeholder-gray-400 font-medium bg-white outline-none"
                            type="text"
                            name="city"
                            autoComplete="address-level2"
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder="City"
                            required
                          />
                        </FieldShell>
                        <FieldShell icon={faMap}>
                          <input
                            className="w-full py-3.5 text-sm placeholder-gray-400 font-medium bg-white outline-none"
                            type="text"
                            name="state"
                            autoComplete="address-level1"
                            value={formData.state}
                            onChange={handleInputChange}
                            placeholder="Province"
                            required
                          />
                        </FieldShell>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <FieldShell icon={faMap}>
                          <input
                            className="w-full py-3.5 text-sm placeholder-gray-400 font-medium bg-white outline-none"
                            type="text"
                            name="postalCode"
                            autoComplete="postal-code"
                            value={formData.postalCode}
                            onChange={handleInputChange}
                            placeholder="Postal Code"
                            required
                          />
                        </FieldShell>
                         <FieldShell icon={faMap}>
                          <input
                            className="w-full py-3.5 text-sm placeholder-gray-400 font-medium bg-white outline-none"
                            type="text"
                            name="country"
                            autoComplete="country-name"
                            value={formData.country}
                            onChange={handleInputChange}
                            placeholder="Country"
                            required
                          />
                        </FieldShell>
                      </div>
                    </>
                  )}

                  {/* VENDOR STEP 2: CONTACT */}
                  {isVendor && vendorStep === 2 && (
                    <>
                       <div className="grid grid-cols-2 gap-3">
                         <FieldShell icon={faUser}>
                            <input
                              className="w-full py-3.5 text-sm placeholder-gray-400 font-medium bg-white outline-none"
                              type="text"
                              name="firstName"
                              autoComplete="given-name"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              placeholder="First Name"
                              required
                            />
                          </FieldShell>
                          <FieldShell icon={faUser}>
                            <input
                              className="w-full py-3.5 text-sm placeholder-gray-400 font-medium bg-white outline-none"
                              type="text"
                              name="lastName"
                              autoComplete="family-name"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              placeholder="Last Name"
                              required
                            />
                          </FieldShell>
                       </div>
                       <FieldShell icon={faMobileScreen}>
                          <input
                            className="w-full py-3.5 text-sm placeholder-gray-400 font-medium bg-white outline-none"
                            type="tel"
                            name="phone"
                            autoComplete="tel"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Phone Number"
                            required
                          />
                        </FieldShell>
                    </>
                  )}
                </div>

                {/* TERMS CHECKBOX */}
                <div className="mt-6 flex items-start">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className={`mt-1 h-4 w-4 rounded border-gray-300 ${GOLD_TEXT} focus:ring-gold`}
                  />
                  <label htmlFor="terms" className="ml-2 text-sm text-gray-500">
                    I agree to the{" "}
                    <a href="#" className="text-gray-900 underline decoration-gray-300 underline-offset-2 hover:decoration-gray-900">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-gray-900 underline decoration-gray-300 underline-offset-2 hover:decoration-gray-900">
                      Privacy Policy
                    </a>
                    .
                  </label>
                </div>

                {/* ACTION BUTTONS */}
                <div className="mt-6 flex gap-3">
                   {isVendor && vendorStep > 0 && (
                     <button
                       type="button"
                       onClick={goBackVendorStep}
                       className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-700 hover:bg-foreground hover:text-background transition"
                     >
                       Back
                     </button>
                   )}

                   {isVendor && vendorStep < 2 ? (
                      <button
                        type="button"
                        onClick={goNextVendorStep}
                        className={`flex-1 rounded-lg ${GOLD_BG} px-5 py-3 text-sm font-bold text-white shadow-md shadow-gold/20 hover:bg-foreground hover:text-background transition`}
                      >
                        Next Step
                      </button>
                   ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className={`flex-1 rounded-lg ${GOLD_BG} px-5 py-3 text-sm font-bold text-white shadow-md shadow-gold/20 hover:bg-foreground hover:text-background transition disabled:opacity-70`}
                      >
                        {loading ? "Creating Account..." : "Create Account"}
                      </button>
                   )}
                </div>
              </form>

              {/* DIVIDER */}
              <div className="relative mt-8">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* GOOGLE AUTH */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleSignUpWithThirdParty}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-bold shadow-sm hover:bg-foreground hover:text-background transition"
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
                  <span className="group-hover:text-white font-semibold">Sign In with Google</span>
                </button>
              </div>

            </div>
          </div>
          
          {/* 3D GRAPHIC: Hidden on mobile/tablet/laptop, Visible on 2XL+ screens */}
          {/* We hide it on smaller screens because fixed 3D transforms don't resize fluidly */}
          <div className="hidden 2xl:flex items-center justify-center shrink-0">
             <RightSideGraphic3D isVendor={isVendor} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default Signup;