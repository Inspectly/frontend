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
import { useGetUserTypesQuery } from "../features/api/userTypesApi";
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

  const { data: userTypes } = useGetUserTypesQuery();

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
    userType: "",
    password: "",
    confirmPassword: "",
  });

  const [thirdPartyOption, setThirdPartyOption] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const [vendorTypeOptions, setVendorTypeOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [selectedVendorTypes, setSelectedVendorTypes] = useState<
    { value: string; label: string }[]
  >([]);
  const [thirdPartyVendorTypes, setThirdPartyVendorTypes] = useState<
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
    setSelectedVendorTypes(selectedOptions);
  };

  // Handle vendor type selection for third-party signup
  const handleThirdPartyVendorTypeChange = (selectedOptions: any) => {
    setThirdPartyVendorTypes(selectedOptions);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setIsConfirmPasswordVisible((prev) => !prev);
  };

  const generateUniqueVendorCode = async (vendorName: string) => {
    // Extract first two letters of each word in the name
    const nameInitials = vendorName
      .split(" ")
      .map((word) => word.substring(0, 1).toUpperCase()) // First 2 letters of each word
      .join("");

    // Generate a short unique ID
    let uniqueCode = `${nameInitials}${nanoid(3).toUpperCase()}`; // Example: "JO-AB12"

    // Check for uniqueness in the backend
    let isUnique = false;
    while (!isUnique) {
      // Check if the generated code already exists
      const codeExists = vendors?.some((vendor) => vendor.code === uniqueCode);

      if (!codeExists) {
        isUnique = true;
      } else {
        // If code already exists, generate a new one
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
      // Remove first_name and last_name before spreading userData
      const { first_name, last_name, ...vendorData } = userData;
      const vendorName = `${userData.first_name} ${userData.last_name}`;

      // Generate a unique vendor code before creating the vendor
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

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (!formData.userType) {
      setError("Please select a user type.");
      return;
    }

    if (formData.userType === "vendor" && selectedVendorTypes.length === 0) {
      setError("Please select at least one Vendor Type.");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create Firebase User First
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

      // Step 2: Send Email Verification (Before Backend User)
      await sendEmailVerification(firebaseUser);
      console.log("Verification email sent!");

      const backendUser = await dispatch(
        getUserByFirebaseId.initiate(firebaseUser.uid)
      ).unwrap();

      dispatch(login(backendUser));

      // Step 3: Redirect to Verify Email Page
      if (formData.userType === "vendor") {
        navigate(
          `/verify-email?userType=${formData.userType}&vendorType=${
            selectedVendorTypes[0].value
          }&vendorTypes=${formatVendorTypes(selectedVendorTypes || [])}`
        );
      } else {
        navigate(`/verify-email?userType=${formData.userType}`);
      }
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

  const handleSignUpWithThirdParty = async () => {
    try {
      if (!thirdPartyOption) {
        setError("Please select a user type.");
        return;
      }

      if (thirdPartyOption === "vendor" && thirdPartyVendorTypes.length === 0) {
        setError("Please select at least one Vendor Type.");
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
        user_type: { user_type: thirdPartyOption },
      }).unwrap();

      // Extract user info from Firebase
      const updatedUserData = {
        email: firebaseUser.email || "",
        first_name: firebaseUser.displayName?.split(" ")[0] || "",
        last_name: firebaseUser.displayName?.split(" ")[1] || "",
        phone: firebaseUser.phoneNumber || "",
        address: "",
        city: "",
        state: "",
        country: "",
        postal_code: "",
      };

      try {
        // Step 3: Create the specific user type
        await createUserType(
          backendUser,
          thirdPartyOption,
          updatedUserData,
          thirdPartyVendorTypes
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
        // Step 4: Log the login method
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
          authentication_code: token,
        };

        console.log("Sending payload:", payload);

        // Step 5: Create User session
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

      // Step 6: Store user
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
    if (
      (formData.userType === "vendor" || thirdPartyOption === "vendor") &&
      fetchedVendorTypes
    ) {
      setVendorTypeOptions(
        fetchedVendorTypes.map((type) => ({
          value: type.vendor_type,
          label: type.vendor_type,
        }))
      );
    }
  }, [formData.userType, thirdPartyOption, fetchedVendorTypes]);

  return (
    <section className="pb-12 bg-gray-50">
      <div className="container mx-auto">
        <div className="flex max-w-md mx-auto flex-col text-center">
          <div className="mt-12 mb-8 p-8 bg-white rounded shadow">
            <h4 className="mb-6 text-3xl">Create an Account</h4>
            <form onSubmit={handleFormSubmit}>
              {/* First Name */}
              <div className="flex mb-4 px-4 bg-gray-50 rounded border border-gray-200">
                <input
                  className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-gray-50 outline-none"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="First Name"
                  required
                />
                <FontAwesomeIcon
                  icon={faUser}
                  className="h-6 w-6 ml-4 my-auto text-gray-300"
                />
              </div>

              {/* Last Name */}
              <div className="flex mb-4 px-4 bg-gray-50 rounded border border-gray-200">
                <input
                  className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-gray-50 outline-none"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last Name"
                  required
                />
                <FontAwesomeIcon
                  icon={faUser}
                  className="h-6 w-6 ml-4 my-auto text-gray-300"
                />
              </div>

              {/* Email */}
              <div className="flex mb-4 px-4 bg-gray-50 rounded border border-gray-200">
                <input
                  className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-gray-50 outline-none"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                  required
                />
                <FontAwesomeIcon
                  icon={faAt}
                  className="h-5 w-5 ml-4 my-auto text-gray-300"
                />
              </div>

              {/* Phone Number */}
              <div className="flex mb-4 px-4 bg-gray-50 rounded border border-gray-200">
                <input
                  className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-gray-50 outline-none"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Phone Number"
                  required
                />
                <FontAwesomeIcon
                  icon={faMobileScreen}
                  className="h-5 w-5 ml-4 my-auto text-gray-300"
                />
              </div>

              {/* Address */}
              <div className="flex mb-4 px-4 bg-gray-50 rounded border border-gray-200">
                <input
                  className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-gray-50 outline-none"
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Address"
                  required
                />
                <FontAwesomeIcon
                  icon={faCompass}
                  className="h-6 w-6 ml-4 my-auto text-gray-300"
                />
              </div>

              {/* City */}
              <div className="flex mb-4 px-4 bg-gray-50 rounded border border-gray-200">
                <input
                  className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-gray-50 outline-none"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  required
                />
                <FontAwesomeIcon
                  icon={faBuilding}
                  className="h-6 w-6 ml-4 my-auto text-gray-300"
                />
              </div>

              {/* State */}
              <div className="flex mb-4 px-4 bg-gray-50 rounded border border-gray-200">
                <input
                  className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-gray-50 outline-none"
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="State"
                  required
                />
                <FontAwesomeIcon
                  icon={faMap}
                  className="h-6 w-6 ml-4 my-auto text-gray-300"
                />
              </div>

              {/* Country */}
              <div className="flex mb-4 px-4 bg-gray-50 rounded border border-gray-200">
                <input
                  className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-gray-50 outline-none"
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="Country"
                  required
                />
                <FontAwesomeIcon
                  icon={faFlag}
                  className="h-6 w-6 ml-4 my-auto text-gray-300"
                />
              </div>

              {/* Postal Code */}
              <div className="flex mb-4 px-4 bg-gray-50 rounded border border-gray-200">
                <input
                  className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-gray-50 outline-none"
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder="Postal Code"
                  required
                />
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="h-6 w-6 ml-4 my-auto text-gray-300"
                />
              </div>

              {/* User Type */}
              <div className="relative mb-4">
                <select
                  className="block w-full text-sm font-semibold cursor-pointer bg-gray-50 border border-gray-300 text-gray-700 py-3.5 px-4 pr-8 rounded appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="userType"
                  value={formData.userType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="" disabled>
                    Select User Type
                  </option>
                  {userTypes
                    ?.filter((type) => type.user_type.toLowerCase() !== "admin") // Exclude admin
                    .map((type) => (
                      <option key={type.id} value={type.user_type}>
                        {type.user_type}
                      </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {formData.userType === "vendor" && (
                <div className="relative mb-4">
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
              )}

              {/* Password */}
              <div className="flex mb-4 px-4 bg-gray-50 rounded border border-gray-200">
                <input
                  className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-gray-50 outline-none"
                  type={isPasswordVisible ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="ml-4"
                >
                  <FontAwesomeIcon
                    icon={faEye}
                    className="h-6 w-6 ml-4 my-auto text-gray-300 stroke-[0.5]"
                  />
                </button>
              </div>

              {/* Confirm Password */}
              <div className="flex mb-4 px-4 bg-gray-50 rounded border border-gray-200">
                <input
                  className="w-full py-4 text-sm placeholder-gray-400 font-semibold leading-none bg-gray-50 outline-none"
                  type={isConfirmPasswordVisible ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm Password"
                  required
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="ml-4"
                >
                  <FontAwesomeIcon
                    icon={faEye}
                    className="h-6 w-6 ml-4 my-auto text-gray-300 stroke-[0.5]"
                  />
                </button>
              </div>

              <div className="mb-6 text-left">
                <label className="inline-flex items-center text-sm">
                  <input type="checkbox" className="form-checkbox" required />
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

              {/* Submit */}
              <button
                type="submit"
                className="transition duration-300 ease-in-out transform hover:-translate-y-1 block w-full p-4 text-center text-sm text-white font-semibold leading-none bg-blue-500 hover:bg-blue-700 rounded"
              >
                {loading ? "Signing Up..." : "Sign Up"}
              </button>
            </form>

            {error && <p className="text-red-500 my-4">{error}</p>}

            <p className="my-6 text-sm text-gray-400 text-center font-semibold">
              or continue with
            </p>

            {/* Third-Party Authentication */}
            <div className="mb-4">
              <div className="relative mb-2">
                <select
                  className="block w-full text-sm font-semibold cursor-pointer bg-gray-50 border border-gray-300 text-gray-700 py-3.5 px-3 pr-8 rounded appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={thirdPartyOption || ""}
                  onChange={(e) => setThirdPartyOption(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select User Type
                  </option>
                  {userTypes
                    ?.filter((type) => type.user_type.toLowerCase() !== "admin") // Exclude admin
                    .map((type) => (
                      <option key={type.id} value={type.user_type}>
                        {type.user_type}
                      </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {thirdPartyOption === "vendor" && (
                <div className="relative mb-4">
                  <Select
                    options={vendorTypeOptions}
                    isMulti
                    value={thirdPartyVendorTypes}
                    onChange={handleThirdPartyVendorTypeChange}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    placeholder="Select Vendor Type"
                  />
                </div>
              )}

              <button
                onClick={() => handleSignUpWithThirdParty()}
                className="transition duration-300 ease-in-out transform hover:-translate-y-0.5 flex items-center w-full px-4 py-3 mb-2 text-sm text-gray-500 font-semibold leading-none border border-gray-200 hover:bg-gray-50 rounded"
              >
                <img
                  className="h-6 pr-10"
                  src="images/google.png"
                  alt="Google"
                />
                <span>Sign Up with Google</span>
              </button>
            </div>
          </div>
          <div>
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
    </section>
  );
};

export default Signup;
