import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase"; // Firebase initialized file
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAt,
  faCity,
  faLocationDot,
  faMapMarkedAlt,
  faMobileScreen,
} from "@fortawesome/free-solid-svg-icons";
import {
  faAddressCard,
  faBuilding,
  faCompass,
  faEye,
  faFlag,
  faMap,
  faUser,
} from "@fortawesome/free-regular-svg-icons";

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
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

  const navigate = useNavigate();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setIsConfirmPasswordVisible((prev) => !prev);
  };

  const handleSignUpWithThirdParty = async (
    providerType: "Google" | "Facebook"
  ) => {
    try {
      // Check if the user selected an option (Home Buyer or Realtor)
      if (!thirdPartyOption) {
        setError("Please select if you are a Home Buyer or a Realtor.");
        return;
      }

      // Add third party login logic here

      // Navigate to the dashboard after successful sign-up or login
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error during third-party sign-up:", error);
      setError(error.message || "Failed to sign up with third-party provider.");
    }
  };

  // Example function to save user details to the database
  const saveUserToDatabase = async (uid: string, data: Record<string, any>) => {
    // Use your preferred database service to save user data
    console.log(`Saving user to database: ${uid}`, data);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);
      // Create the user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Set the display name to the first name
      await updateProfile(userCredential.user, {
        displayName: formData.firstName + " " + formData.lastName,
      });

      // Send verification email
      await sendEmailVerification(userCredential.user);

      setLoading(false);
      // Redirect to email verification page
      navigate("/verify-email");
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to sign up.");
    }
  };

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

              {/* User Type */}
              <div className="relative mb-4">
                <select
                  className="block w-full text-sm font-semibold cursor-pointer bg-gray-50 border border-gray-300 text-gray-700 py-3.5 px-3 pr-8 rounded appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="userType"
                  value={formData.userType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="" disabled>
                    Are you an Individual Home Buyer or Realtor?
                  </option>
                  <option value="client">Individual Home Buyer</option>
                  <option value="realtor">Realtor</option>
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
                    Are you an Individual Home Buyer or Realtor?
                  </option>
                  <option value="Individual Home Buyer">
                    Individual Home Buyer
                  </option>
                  <option value="Realtor">Realtor</option>
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

              <button
                onClick={() => handleSignUpWithThirdParty("Google")}
                className="transition duration-300 ease-in-out transform hover:-translate-y-0.5 flex items-center w-full px-4 py-3 mb-2 text-sm text-gray-500 font-semibold leading-none border border-gray-200 hover:bg-gray-50 rounded"
              >
                <img
                  className="h-6 pr-10"
                  src="images/google.png"
                  alt="Google"
                />
                <span>Sign Up with Google</span>
              </button>
              <button
                onClick={() => handleSignUpWithThirdParty("Facebook")}
                className="transition duration-300 ease-in-out transform hover:-translate-y-0.5 flex items-center w-full px-4 py-3 text-sm text-gray-500 font-semibold leading-none border border-gray-200 hover:bg-gray-50 rounded"
              >
                <img
                  className="h-6 pr-11 -ml-1"
                  src="images/facebook.png"
                  alt="Facebook"
                />
                <span>Sign Up with Facebook</span>
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

export default SignUp;
