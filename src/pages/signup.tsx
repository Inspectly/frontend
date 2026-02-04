import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../../firebase"; // Firebase initialized file
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
import { faAt, faMobileScreen } from "@fortawesome/free-solid-svg-icons";
import {
  faBuilding,
  faCompass,
  faEnvelope,
  faEye,
  faFlag,
  faMap,
  faUser,
} from "@fortawesome/free-regular-svg-icons";
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
import "../styles/Select.css"; // Tailwind styles
import { useCreateUserLoginMutation } from "../features/api/userLoginsApi";
import { useCreateUserSessionMutation } from "../features/api/userSessionsApi";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store/store";
import {
  login,
  logout,
  setLoading as setPageLoading,
} from "../features/authSlice";
import { nanoid } from "nanoid";

type VendorStep = 0 | 1 | 2;

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

  // Fetch vendor types when "Vendor" is selected
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
    userType: "client", // ✅ default: homeowner
    password: "",
    confirmPassword: "",
  });

  const isVendor = formData.userType === "vendor";

  const roleUI = isVendor
  ? {
      kicker: "For Pros",
      title: "Inspectly Vendor",
      subtitle:
        "Join the pro network — get discovered by homeowners and win more jobs.",
      icon: faBuilding,
      bullets: ["Get customer leads", "Manage requests faster", "Grow your reviews"],
    }
  : {
      kicker: "For Homeowners",
      title: "Inspectly Homeowner",
      subtitle:
        "Start with a basic account — complete your profile after signup.",
      icon: faUser,
      bullets: ["Track inspections", "Find trusted vendors", "Keep everything organized"],
    };

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [vendorStep, setVendorStep] = useState<VendorStep>(0);

  const [vendorTypeOptions, setVendorTypeOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [selectedVendorTypes, setSelectedVendorTypes] = useState<
    { value: string; label: string }[]
  >([]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Multi-Select Change
  const handleVendorTypeChange = (selectedOptions: any) => {
    setSelectedVendorTypes(selectedOptions || []);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setIsConfirmPasswordVisible((prev) => !prev);
  };

  const handleSelectRole = (role: "client" | "vendor") => {
    setError(null);
    setFormData((prev) => ({
      ...prev,
      userType: role,
    }));

    if (role === "client") {
      setVendorStep(0);
      setSelectedVendorTypes([]);
      // Optional: clear vendor-only fields (keeps things tidy)
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
      if (!formData.address || !formData.city || !formData.state || !formData.country || !formData.postalCode) {
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
    // Extract first letter of each word in the name
    const nameInitials = vendorName
      .split(" ")
      .map((word) => word.substring(0, 1).toUpperCase())
      .join("");

    // Generate a short unique ID
    let uniqueCode = `${nameInitials}${nanoid(3).toUpperCase()}`;

    // Check for uniqueness in the backend
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

  const formatVendorTypes = (
    vendorTypes: { value: string; label: string }[]
  ) => {
    return vendorTypes.map((type) => type.value).join(", ");
  };

  // Create specific user type
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
          vendor_type:
            vendorTypes && vendorTypes.length > 0 ? vendorTypes[0].value : "",
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

    // ✅ Terms required for email signup too
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

    // ✅ Vendor requirements (full vendor flow for email signup)
    if (formData.userType === "vendor") {
      if (selectedVendorTypes.length === 0) {
        setError("Please select at least one Vendor Type.");
        setVendorStep(0);
        return;
      }

      // Ensure vendor completed steps 1 & 2 before submitting email signup
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

      // Create Firebase User First
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const firebaseUser = userCredential.user;
      await updateProfile(firebaseUser, {
        displayName: `${formData.firstName} ${formData.lastName}`,
      });

      console.log("Firebase user created:", firebaseUser.uid);

      // Send Email Verification (Before Backend User)
      await sendEmailVerification(firebaseUser);
      console.log("Verification email sent!");

      localStorage.setItem("signupUserData", JSON.stringify(formData));
      if (formData.userType === "vendor") {
        localStorage.setItem(
          "signupVendorTypes",
          JSON.stringify(selectedVendorTypes)
        );
      }
      // Redirect to Verify Email Page
      navigate(`/verify-email`);
    } catch (err: any) {
      setLoading(false);
      if (err.code === "auth/email-already-in-use") {
        setError(
          "This email is already registered. If already registered with google please link your account in settings"
        );
      } else {
        setError(
          "Error: " + err.message || err.data?.detail || "Failed to sign up."
        );
      }
    } finally {
      setLoading(false);
      dispatch(setPageLoading(false));
    }
  };

  // ✅ Keep production edge-case logic, but remove redundant role/vendor-type selects.
  const handleSignUpWithThirdParty = async () => {
    try {
      // 1) Role must exist (default is client anyway)
      if (!formData.userType) {
        setError("Please select a role.");
        return;
      }

      // 2) If vendor, require vendor type first (as requested)
      if (formData.userType === "vendor" && selectedVendorTypes.length === 0) {
        setError("Please select at least one Vendor Type.");
        setVendorStep(0);
        return;
      }

      // 3) Then require terms (as requested)
      if (!acceptedTerms) {
        setError("Please accept the Privacy Policy and Terms of Use.");
        return;
      }

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const token = await getIdToken(firebaseUser);

      // Check if backend user already exists
      let backendUser = null;
      let userExists = false;

      try {
        backendUser = await dispatch(
          getUserByFirebaseId.initiate(firebaseUser.uid)
        ).unwrap();
        userExists = true;
      } catch (error: any) {
        if (error?.status === 404) {
          userExists = false;
        } else {
          throw new Error("Failed to check user existence.");
        }
      }

      if (userExists) {
        // Immediately log out the user
        dispatch(setPageLoading(true));

        await signOut(auth);
        localStorage.removeItem("authToken");
        localStorage.removeItem("firebase_id");

        dispatch(logout());
        dispatch(setPageLoading(false));

        navigate("/signup", {
          state: {
            error:
              "An account with this Google email already exists. Please log in instead.",
          },
        });
        return;
      }

      // User doesn't exist in backend — continue with account creation
      backendUser = await createUser({
        firebase_id: firebaseUser.uid,
        user_type: { user_type: formData.userType },
      }).unwrap();

      // Extract user info from Firebase
      const updatedUserData = {
        email: firebaseUser.email || "",
        first_name: firebaseUser.displayName?.split(" ")[0] || "",
        last_name:
          firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
        phone: firebaseUser.phoneNumber || "",
        address: "",
        city: "",
        state: "",
        country: "",
        postal_code: "",
      };

      try {
        // Create the specific user type
        await createUserType(
          backendUser,
          formData.userType,
          updatedUserData,
          formData.userType === "vendor" ? selectedVendorTypes : undefined
        );
      } catch (error: any) {
        console.error("Creating user type failed:", error);
        if (error?.response?.status !== 409) {
          await firebaseUser.delete(); // Delete Firebase user on failure
        }
        dispatch(setPageLoading(false));

        throw new Error("Failed to create user type in backend.");
      }

      try {
        // Log the login method
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
        console.error("User login tracking failed:", error);
        if (error?.response?.status !== 409) {
          await firebaseUser.delete(); // Delete Firebase user on failure
        }
        dispatch(setPageLoading(false));

        throw new Error("Failed to log user login method.");
      }

      try {
        console.log("Creating new user session...");

        // Create session in backend
        const payload = {
          user_id: backendUser.id,
          login: "gmail",
          login_time: new Date().toISOString(),
          authentication_code: token,
        };

        console.log("Sending payload:", payload);

        // Create User session
        const response = await createUserSession(payload).unwrap();
        console.log("User session created successfully:", response);
      } catch (error: any) {
        console.error("User session creation failed:", error);
        if (error?.response?.status !== 409) {
          await firebaseUser.delete(); // Delete Firebase user on failure
        }
        dispatch(setPageLoading(false));

        throw new Error("Failed to create session in backend.");
      }

      // Store user
      const refreshedUser = await dispatch(
        getUserByFirebaseId.initiate(firebaseUser.uid)
      ).unwrap();

      dispatch(login(refreshedUser));
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Third-party sign-up failed:", err);
      setError(err.message || "Failed to sign up with Google.");
      dispatch(setPageLoading(false));
    }
  };

  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
    }
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

  const FieldShell = ({
    icon,
    children,
  }: {
    icon: any;
    children: React.ReactNode;
  }) => (
    <div className="flex px-4 bg-white rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-[#D4A017] focus-within:border-[#D4A017] transition">
      {children}
      <FontAwesomeIcon icon={icon} className="h-6 w-6 ml-4 my-auto text-gray-300" />
    </div>
  );

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
          "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold",
          done
            ? "bg-[#D4A017] text-white"
            : active
            ? "border-2 border-[#D4A017] text-[#D4A017]"
            : "border border-gray-300 text-gray-400",
        ].join(" ")}
      >
        {idx}
      </div>
      <div className={active ? "text-sm font-semibold text-gray-900" : "text-sm text-gray-500"}>
        {label}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* LEFT BRANDING */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#D4A017] text-white sticky top-0 h-screen items-center">
        <div className="px-16 w-full">
          <div className="slide-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/15 px-4 py-2 mb-6">
              <FontAwesomeIcon icon={roleUI.icon} className="text-white" />
              <span className="text-sm font-semibold text-white">{roleUI.kicker}</span>
            </div>

            <h1 className="text-6xl font-extrabold tracking-tight mb-4">
              {roleUI.title}
            </h1>

            <p className="text-xl font-light leading-relaxed max-w-md">
              {roleUI.subtitle}
            </p>

            <ul className="mt-8 space-y-3 text-white/90">
              {roleUI.bullets.map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-white/70" />
                  <span className="text-base">{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 h-1 w-24 bg-black/20 rounded-full" />
          </div>
        </div>
      </div>

      {/* RIGHT FORM */}
      <div className="w-full lg:w-1/2 flex items-start lg:items-center justify-center px-6 py-10 lg:px-16 lg:py-16 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Create an Account</h2>
            <p className="text-gray-500 mt-1">
              {isVendor ? "Create your vendor profile in a few steps." : "Create your account in seconds."}
            </p>
          </div>

          {/* ROLE CARDS */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => handleSelectRole("client")}
              className={[
                "rounded-xl border p-4 text-left transition-all",
                !isVendor
                  ? "border-[#D4A017] ring-2 ring-[#D4A017]/20 bg-white"
                  : "border-gray-200 hover:border-gray-300 bg-white",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faUser} className="text-gray-700" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Homeowner</div>
                  <div className="text-xs text-gray-500">Create a basic account</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRole("vendor")}
              className={[
                "rounded-xl border p-4 text-left transition-all",
                isVendor
                  ? "border-[#D4A017] ring-2 ring-[#D4A017]/20 bg-white"
                  : "border-gray-200 hover:border-gray-300 bg-white",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faBuilding} className="text-gray-700" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Vendor</div>
                  <div className="text-xs text-gray-500">Join the pro network</div>
                </div>
              </div>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
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
              <div key={isVendor ? `vendor-${vendorStep}` : "client"} className="step-animate space-y-4">
                {/* HOMEOWNER (CLIENT): only first/last/email/password */}
                {!isVendor && (
                  <>
                    <FieldShell icon={faUser}>
                      <input
                        className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-white outline-none"
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="First Name"
                        required
                      />
                    </FieldShell>

                    <FieldShell icon={faUser}>
                      <input
                        className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-white outline-none"
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Last Name"
                        required
                      />
                    </FieldShell>

                    <FieldShell icon={faAt}>
                      <input
                        className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-white outline-none"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Email"
                        required
                      />
                    </FieldShell>

                    <div className="flex px-4 bg-white rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-[#D4A017] focus-within:border-[#D4A017] transition">
                      <input
                        className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-white outline-none"
                        type={isPasswordVisible ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Password"
                        required
                      />
                      <button type="button" onClick={togglePasswordVisibility} className="ml-4">
                        <FontAwesomeIcon icon={faEye} className="h-6 w-6 ml-4 my-auto text-gray-300" />
                      </button>
                    </div>

                    <div className="flex px-4 bg-white rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-[#D4A017] focus-within:border-[#D4A017] transition">
                      <input
                        className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-white outline-none"
                        type={isConfirmPasswordVisible ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm Password"
                        required
                      />
                      <button type="button" onClick={toggleConfirmPasswordVisibility} className="ml-4">
                        <FontAwesomeIcon icon={faEye} className="h-6 w-6 ml-4 my-auto text-gray-300" />
                      </button>
                    </div>
                  </>
                )}

                {/* VENDOR FLOW */}
                {isVendor && vendorStep === 0 && (
                  <>
                    <div className="relative">
                      <Select
                        options={vendorTypeOptions}
                        isMulti
                        value={selectedVendorTypes}
                        onChange={handleVendorTypeChange}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        placeholder="Select Vendor Type"
                      />
                    </div>

                    <FieldShell icon={faAt}>
                      <input
                        className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-white outline-none"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Email"
                        required
                      />
                    </FieldShell>

                    <div className="flex px-4 bg-white rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-[#D4A017] focus-within:border-[#D4A017] transition">
                      <input
                        className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-white outline-none"
                        type={isPasswordVisible ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Password"
                        required
                      />
                      <button type="button" onClick={togglePasswordVisibility} className="ml-4">
                        <FontAwesomeIcon icon={faEye} className="h-6 w-6 ml-4 my-auto text-gray-300" />
                      </button>
                    </div>

                    <div className="flex px-4 bg-white rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-[#D4A017] focus-within:border-[#D4A017] transition">
                      <input
                        className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-white outline-none"
                        type={isConfirmPasswordVisible ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm Password"
                        required
                      />
                      <button type="button" onClick={toggleConfirmPasswordVisibility} className="ml-4">
                        <FontAwesomeIcon icon={faEye} className="h-6 w-6 ml-4 my-auto text-gray-300" />
                      </button>
                    </div>
                  </>
                )}

                {isVendor && vendorStep === 1 && (
                  <>
                    <FieldShell icon={faCompass}>
                      <input
                        className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-white outline-none"
                        type="text"
                        name="address"
                        autoComplete="street-address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Address"
                        required
                      />
                    </FieldShell>

                    <FieldShell icon={faBuilding}>
                      <input
                        className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-white outline-none"
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
                        className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-white outline-none"
                        type="text"
                        name="state"
                        autoComplete="address-level1"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="State / Province"
                        required
                      />
                    </FieldShell>

                    <FieldShell icon={faFlag}>
                      <input
                        className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-white outline-none"
                        type="text"
                        name="country"
                        autoComplete="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        placeholder="Country"
                        required
                      />
                    </FieldShell>

                    <FieldShell icon={faEnvelope}>
                      <input
                        className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-white outline-none"
                        type="text"
                        name="postalCode"
                        autoComplete="postal-code"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        placeholder="Postal Code"
                        required
                      />
                    </FieldShell>
                  </>
                )}

                {isVendor && vendorStep === 2 && (
                  <>
                    <FieldShell icon={faUser}>
                      <input
                        className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-white outline-none"
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="First Name"
                        required
                      />
                    </FieldShell>

                    <FieldShell icon={faUser}>
                      <input
                        className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-white outline-none"
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Last Name"
                        required
                      />
                    </FieldShell>

                    <FieldShell icon={faMobileScreen}>
                      <input
                        className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-white outline-none"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Phone Number"
                        required
                      />
                    </FieldShell>
                  </>
                )}
              </div>

              {/* TERMS - ALWAYS VISIBLE (NOT IN FLOW) */}
              <div className="mt-6 text-left">
                <label className="inline-flex items-center text-sm">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                  />
                  <span className="ml-2">
                    I agree to the{" "}
                    <a className="underline hover:text-gray-500" href="#">
                      Privacy Policy
                    </a>{" "}
                    and{" "}
                    <a className="underline hover:text-gray-500" href="#">
                      Terms of Use
                    </a>
                  </span>
                </label>
              </div>

              {/* ACTIONS */}
              <div className="mt-6 space-y-3">
                {/* Vendor step controls */}
                {isVendor && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={goBackVendorStep}
                      disabled={vendorStep === 0}
                      className={[
                        "w-1/2 py-3 rounded-lg font-semibold border transition",
                        vendorStep === 0
                          ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50",
                      ].join(" ")}
                    >
                      Back
                    </button>

                    {vendorStep < 2 ? (
                      <button
                        type="button"
                        onClick={goNextVendorStep}
                        className="w-1/2 py-3 rounded-lg font-semibold text-white bg-[#D4A017] shadow-sm hover:bg-black transition"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-1/2 py-3 rounded-lg font-semibold text-white bg-[#D4A017] shadow-sm hover:bg-black transition"
                      >
                        {loading ? "Signing Up..." : "Create Account"}
                      </button>
                    )}
                  </div>
                )}

                {/* Homeowner submit */}
                {!isVendor && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-lg font-semibold text-white bg-[#D4A017] shadow-sm hover:bg-black transition"
                  >
                    {loading ? "Signing Up..." : "Create Account"}
                  </button>
                )}

                {/* Google signup - universal (no extra dropdown) */}
                <button
                  type="button"
                  onClick={() => handleSignUpWithThirdParty()}
                  className="transition duration-300 ease-in-out transform hover:-translate-y-0.5 flex items-center justify-center w-full px-4 py-3 text-sm text-gray-700 font-semibold leading-none border border-gray-200 hover:bg-gray-50 rounded-lg"
                >
                  <img className="h-5 pr-3" src="images/google.png" alt="Google" />
                  <span>Sign Up with Google</span>
                </button>

                {error && <p className="text-red-500 text-center font-semibold">{error}</p>}
              </div>
            </form>
          </div>

          <div className="mt-6">
            <p className="text-sm text-gray-400 text-center">
              <a className="underline hover:text-gray-500" href="#">
                Privacy Policy
              </a>{" "}
              and{" "}
              <a className="underline hover:text-gray-500" href="#">
                Terms of Use
              </a>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .slide-in {
          animation: slideIn 420ms ease-out both;
        }
        .step-animate {
          animation: stepIn 260ms ease-out both;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0px); }
        }
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
};

export default Signup;

