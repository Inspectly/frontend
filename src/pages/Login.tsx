import { faEye } from "@fortawesome/free-regular-svg-icons";
import { faAt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAgreeToTerms(e.target.checked);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ email, password, agreeToTerms });
  };

  const handleSignUp = () => {
    navigate("/", { state: { targetSection: "plansRef", offset: -20 } });
  };

  return (
    <section className="relative container pb-20 mx-auto px-4 md:px-8 xl:px-16 2xl:px-32">
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
        <div className="relative flex flex-wrap pt-12">
          <div className="lg:flex lg:flex-col w-full lg:w-1/2 py-6 lg:pr-20">
            <div className="w-full max-w-lg mx-auto lg:mx-0 my-auto">
              <span className="text-sm text-gray-400">Sign In</span>
              <h4 className="mb-6 text-3xl">Join our community</h4>
              <form onSubmit={handleSubmit}>
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
                >
                  Sign In
                </button>
              </form>
              <p className="my-6 text-xs text-gray-400 text-center font-semibold">
                or continue with
              </p>
              <button className="transition duration-300 ease-in-out transform hover:-translate-y-1 flex justify-center items-center px-4 py-3 w-full text-xs text-gray-500 font-semibold leading-none border border-gray-200 hover:bg-gray-50 hover:shadow-lg rounded">
                <img
                  className="h-6 pr-6"
                  src="/images/google.png"
                  alt="Google Login"
                />
                <span>Sign In with Google</span>
              </button>
            </div>

            <div className="w-full mt-12 mx-auto text-center">
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
