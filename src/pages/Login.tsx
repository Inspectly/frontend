import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAt } from "@fortawesome/free-solid-svg-icons";
import { faEye } from "@fortawesome/free-regular-svg-icons";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  getIdToken,
} from "firebase/auth";
import { auth } from "../../firebase";
import { useCreateUserSessionMutation } from "../features/api/userSessionsApi";
import { AxiosError } from "axios";
import { useCreateUserLoginMutation } from "../features/api/userLoginsApi";
import { useDispatch } from "react-redux";
import {
  login,
  logout,
  setLoading as setPageLoading,
} from "../features/authSlice";
import { useGetUserByFirebaseIdQuery } from "../features/api/usersApi";

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

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setEmail(e.target.value);
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPassword(e.target.value);
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setAgreeToTerms(e.target.checked);
  const togglePasswordVisibility = () => setIsPasswordVisible((prev) => !prev);

  // Fetch user session from backend after Firebase login
  const {
    data: backendUser,
    isLoading: backendLoading,
    error: backendError,
  } = useGetUserByFirebaseIdQuery(firebaseUser?.uid as string, {
    skip: !firebaseUser,
  });

  // Authenticate with Firebase & Backend
  const authenticateUser = async (user: any, loginMethod: string) => {
    try {
      setLoading(true);
      setIsBackendLoading(true);
      setError(null);

      const token = await getIdToken(user);
      setFirebaseUser(user); // Store user to trigger backend query
      setLoginMethod(loginMethod);
      localStorage.setItem("authToken", token);

      console.log("Waiting for backend user to load...");

      // Wait for backend user query to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Ensure backend user is fetched before proceeding
      if (backendError || !backendUser) {
        console.error("Backend user not found. Cannot proceed.");
        setError("User not found in backend. Please sign up.");
        setIsBackendLoading(false);
        return;
      }

      setIsBackendLoading(false); // Stop loading once user is created

      console.log("Backend user found. Proceeding with login...");

      await createUserLogin({
        user_id: backendUser?.id || "",
        email_login: loginMethod === "email",
        email: loginMethod === "email" ? user.email : "",
        phone_login: false,
        phone: "",
        gmail_login: loginMethod === "gmail",
        gmail: loginMethod === "gmail" ? user.email : "",
      })
        .unwrap()
        .then(async () => {
          console.log("User login recorded. Creating session...");
          await createUserSession({
            user_id: backendUser?.id,
            login: loginMethod,
            authentication_code: token,
          })
            .unwrap()
            .then(() => {
              console.log(
                "Session created. Dispatching login & redirecting..."
              );
              dispatch(login(backendUser));
              navigate("/dashboard");
            })
            .catch(async (sessionError) => {
              console.error("Session creation failed:", sessionError);
              setError("Session creation failed. Try again.");
              dispatch(logout());
              dispatch(setPageLoading(false));
            });
        })
        .catch(async (loginError) => {
          console.error("User login creation failed:", loginError);
          setError("Login creation failed. Try again.");
          dispatch(logout());
          dispatch(setPageLoading(false));
        });
    } catch (err) {
      console.log("Error authenticating user:", err);
      setError("Failed to authenticate. Please try again.");
      dispatch(logout());
      dispatch(setPageLoading(false));
    } finally {
      setLoading(false);
    }
  };

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
      await authenticateUser(user, "email");
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

  // Handle Google Login
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      await authenticateUser(user, "gmail");
    } catch (err) {
      const error = err as AxiosError;
      console.error("Email login failed:", err);
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
    if (firebaseUser && backendLoading) {
      setIsBackendLoading(true);
    }

    if (backendUser) {
      setIsBackendLoading(false);
    }
  }, [backendLoading, backendUser]);

  // Once `backendUser` is available, create user session
  useEffect(() => {
    if (firebaseUser && backendUser && !backendLoading) {
      console.log("Backend user found. Proceeding with session creation...");
      authenticateUser(firebaseUser, loginMethod);
    }

    if (!backendLoading && backendError) {
      console.error("User not found in backend.");
      setError("User not found in backend. Please sign up.");
      setLoading(false);
      setFirebaseUser(null);
    }
  }, [backendUser, backendLoading, backendError]);

  return (
    <section className="relative container pb-12 mx-auto px-4 md:px-8 xl:px-16 2xl:px-32">
      <div className="hidden lg:block absolute inset-0 w-1/2 ml-auto">
        <div className="flex items-center h-full">
          <img
            className="lg:max-w-lg mx-auto"
            src="/images/undraw_outer-space.svg"
            alt="Illustration"
          />
        </div>
      </div>
      <div className="container">
        <div className="relative flex flex-wrap pt-8">
          <div className="lg:flex lg:flex-col w-full lg:w-1/2 py-6 lg:pr-20">
            <div className="w-full max-w-lg mx-auto lg:mx-0 my-auto">
              <span className="text-sm text-gray-400">Sign In</span>
              <h4 className="mb-6 text-3xl">Join our community</h4>
              {error && !isBackendLoading && (
                <div className="mb-4 text-red-500">{error}</div>
              )}
              <form onSubmit={handleSignIn}>
                <div className="flex mb-4 px-4 bg-gray-50 rounded border border-gray-200">
                  <input
                    className="w-full py-4 text-xs placeholder-gray-400 font-semibold leading-none bg-gray-50 outline-none"
                    type="email"
                    placeholder="name@email.com"
                    value={email}
                    onChange={handleEmailChange}
                  />
                  <FontAwesomeIcon
                    icon={faAt}
                    className="h-5 w-5 ml-4 my-auto text-gray-300"
                  />
                </div>
                <div className="flex mb-6 px-4 bg-gray-50 rounded border border-gray-200">
                  <input
                    className="w-full py-4 text-xs placeholder-gray-400 font-semibold leading-none bg-gray-50 outline-none"
                    type={isPasswordVisible ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
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
                <div className="float-left mb-6">
                  <label className="inline-flex text-xs">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={agreeToTerms}
                      onChange={handleCheckboxChange}
                    />
                    <span className="ml-2">
                      I agree to{" "}
                      <a className="underline hover:text-gray-500" href="#">
                        Police privacy
                      </a>{" "}
                      and{" "}
                      <a className="underline hover:text-gray-500" href="#">
                        Terms of Use
                      </a>
                    </span>
                  </label>
                </div>
                <button
                  type="submit"
                  className="transition duration-300 ease-in-out transform hover:-translate-y-1 block w-full p-4 text-center text-xs text-white font-semibold leading-none bg-blue-500 hover:bg-blue-600 hover:shadow-lg rounded"
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </form>
              <p className="my-6 text-xs text-gray-400 text-center font-semibold">
                or continue with
              </p>
              <button
                onClick={() => handleGoogleSignIn()}
                className="transition duration-300 ease-in-out transform hover:-translate-y-0.5 flex items-center w-full px-4 py-3 mb-2 text-sm text-gray-500 font-semibold leading-none border border-gray-200 hover:bg-gray-50 rounded"
              >
                <img
                  className="h-6 pr-10"
                  src="images/google.png"
                  alt="Google"
                />
                <span>Sign In with Google</span>
              </button>
            </div>

            <div className="w-full mt-8 mx-auto text-center">
              <p>
                Don't Have an Account?{" "}
                <button
                  className="inline-block text-xs text-blue-600 hover:text-blue-700 font-semibold leading-none"
                  onClick={handleSignUp}
                >
                  Sign Up now
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
