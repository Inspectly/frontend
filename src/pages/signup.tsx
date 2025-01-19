import React, { useState } from "react";
import { SignUpFormData } from "../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpFromBracket } from "@fortawesome/free-solid-svg-icons";
import { useLocation } from "react-router-dom";

interface Feature {
  text: string;
  isAvailable: boolean;
}

interface Plan {
  title: string;
  description: string;
  price: string;
  features: Feature[];
}

const Signup: React.FC = () => {
  const location = useLocation();
  const selectedPlan = location.state?.selectedPlan as Plan;

  const [step, setStep] = useState(1); // State to track the current wizard step
  const totalSteps = 3; // Total number of steps in the wizard
  const [formData, setFormData] = useState<SignUpFormData>({
    name: "",
    email: "",
    phone: "",
    gender: "",
    resume: null,
    availability: "",
    salary: "",
    startAvailability: "",
    workPreference: "",
    willingToWorkRemotely: "",
    sendToRealtor: "",
    realtorEmail: "",
    promoCode: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name) newErrors.name = "Name is required.";
      if (!formData.email) {
        newErrors.email = "Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Enter a valid email address.";
      }
      if (!formData.phone) {
        newErrors.phone = "Phone number is required.";
      } else if (!/^\d{10,15}$/.test(formData.phone)) {
        newErrors.phone = "Enter a valid phone number.";
      }
      if (!formData.resume) newErrors.resume = "Resume is required.";
    }

    if (step === 2) {
      if (!formData.availability)
        newErrors.availability = "Please select an option.";
    }

    if (step === 3) {
      if (!formData.sendToRealtor) {
        newErrors.sendToRealtor = "This option is required.";
      } else if (formData.sendToRealtor === "Yes" && !formData.realtorEmail) {
        newErrors.realtorEmail = "Realtor's email is required.";
      } else if (
        formData.sendToRealtor === "Yes" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.realtorEmail)
      ) {
        newErrors.realtorEmail = "Enter a valid email address.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({ ...formData, resume: e.target.files[0] });
    }
  };

  const handleNext = () => {
    if (validate()) {
      if (step - 1 < totalSteps) {
        setStep((prev) => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  // Calculate progress percentage for the progress bar
  const progressPercentage = Math.round(((step - 1) / totalSteps) * 100);

  return (
    <div className="flex flex-col lg:flex-row lg:min-h-[calc(100vh_-_80px)]">
      {/* Left Panel */}
      <div className="bg-gradient-to-r from-gray-100/70 to-gray-100 -mt-24 w-full lg:w-1/3 lg:order-none order-1">
        <div className="flex justify-center items-center h-full min-h-full pt-32 px-14 pb-14 lg:p-14 text-center relative">
          <div>
            {selectedPlan ? (
              <div className="flex flex-col items-center">
                <h2 className="text-2xl font-bold mb-6">
                  {selectedPlan.title}
                </h2>
                <img
                  src={`/images/${selectedPlan.title.toLowerCase()}.svg`}
                  alt="Info Graphic"
                  className="h-40 mx-auto mb-8"
                />
                <p className="mb-6">{selectedPlan.description}</p>
                <p className="text-lg font-semibold mb-4">
                  ${selectedPlan.price}
                </p>
                <ul className="space-y-2">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          feature.isAvailable ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></span>
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-4">Select a Plan</h2>
                <p className="mb-6">
                  Choose the plan that best fits your needs to proceed with
                  registration.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex items-center h-full min-h-full p-4 sm:p-14 lg:justify-start justify-center lg:pl-28 xl:pl-56 sm:pt-28 w-full lg:w-2/3 order-2">
        <div className="w-[450px]">
          {/* Progress Indicator */}
          <div id="top-wizard" className="mt-3">
            <div className="text-sm font-semibold text-gray-700 mb-2">
              <span id="location">
                {step - 1} of {totalSteps} completed
              </span>
            </div>
            <div
              className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercentage}
            >
              <div
                className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300"
                style={{
                  width: `${progressPercentage}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-6">
            {step === 1 && (
              <>
                <h2 className="text-xl font-bold">Personal Information</h2>
                <div className="mt-4">
                  <label className="block text-gray-500 font-medium">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full border border-gray-300 rounded px-3 py-2 mt-1 ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="First and Last Name"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>
                <div className="mt-4">
                  <label className="block text-gray-500 font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full border border-gray-300 rounded px-3 py-2 mt-1 ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Email Address"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>
                <div className="mt-4">
                  <label className="block text-gray-500 font-medium">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full border border-gray-300 rounded px-3 py-2 mt-1 ${
                      errors.phone ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Phone"
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                  )}
                </div>
                <div className="mt-4">
                  <label className="block text-gray-500 font-medium mb-2">
                    Upload Inspection Report (PDF/DOCX)
                  </label>
                  <div
                    className={`flex items-center border border-gray-300 rounded p-1.5 ${
                      errors.resume ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <label
                      htmlFor="file-upload"
                      className="px-4 py-1 bg-blue-500 text-sm font-medium text-white rounded cursor-pointer hover:bg-blue-600 transition duration-300"
                    >
                      <FontAwesomeIcon
                        icon={faArrowUpFromBracket}
                        className="mr-2"
                      />
                      Choose File
                    </label>
                    <input
                      type="file"
                      name="resume"
                      id="file-upload"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      className="hidden" // Hides the default file input
                    />
                    <span className="ml-2 text-sm text-gray-400">
                      {formData.resume
                        ? formData.resume.name
                        : "No file chosen"}
                    </span>
                  </div>
                  {errors.resume && (
                    <p className="text-sm text-red-500 mt-1">{errors.resume}</p>
                  )}
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <h2 className="text-xl font-bold">Who are you?</h2>
                <div className="mt-4">
                  <div className="space-y-4">
                    {["Buyer", "Agent", "Broker", "Property Inspector"].map(
                      (option) => (
                        <label
                          key={option}
                          className={`relative block text-sm font-medium cursor-pointer pl-12 p-4 rounded-md border ${
                            formData.availability === option
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300 bg-white"
                          } transition-all duration-300`}
                        >
                          <input
                            type="radio"
                            name="availability"
                            value={option}
                            checked={formData.availability === option}
                            onChange={handleInputChange}
                            className="hidden peer"
                          />
                          {option}
                          <span className="absolute top-[13px] left-[10px] h-[24px] w-[24px] border border-gray-300 rounded-full peer-checked:border-transparent peer-checked:after:bg-blue-500 peer-checked:after:content-[''] peer-checked:after:absolute peer-checked:after:top-[0px] peer-checked:after:left-[0px] peer-checked:after:w-[24px] peer-checked:after:h-[24px] peer-checked:after:rounded-full peer-checked:before:content-[''] peer-checked:before:absolute peer-checked:before:top-[4px] peer-checked:before:left-[8px] peer-checked:before:w-[8px] peer-checked:before:h-[14px] peer-checked:before:border-r-[3px] peer-checked:before:border-b-[3px] peer-checked:before:border-white peer-checked:before:z-10 peer-checked:before:rotate-45 transition-all duration-300"></span>
                        </label>
                      )
                    )}
                  </div>
                  {errors.availability && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.availability}
                    </p>
                  )}
                </div>
              </>
            )}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-700">
                  Realtor Information
                </h2>

                {/* Radio Buttons */}
                <div className="space-y-2">
                  <label className="block text-gray-500 font-medium">
                    Do you want to send your report to a realtor?
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="relative flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="sendToRealtor"
                        value="Yes"
                        checked={formData.sendToRealtor === "Yes"}
                        onChange={handleInputChange}
                        className="peer absolute opacity-0"
                      />
                      <span className="block w-5 h-5 border border-gray-300 rounded-full relative"></span>
                      <span className="w-3 h-3 bg-blue-500 rounded-full absolute top-[6px] left-[4px] peer-checked:block hidden"></span>

                      <span className="ml-2">Yes</span>
                    </label>

                    <label className="relative flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="sendToRealtor"
                        value="No"
                        checked={formData.sendToRealtor === "No"}
                        onChange={handleInputChange}
                        className="peer hidden"
                      />
                      <span className="block w-5 h-5 border border-gray-300 rounded-full relative"></span>
                      <span className="w-3 h-3 bg-blue-500 rounded-full absolute top-[6px] left-[4px] peer-checked:block hidden"></span>
                      <span className="ml-2">No</span>
                    </label>
                  </div>
                  {errors.sendToRealtor && (
                    <span className="text-red-500 text-sm ml-2">
                      {errors.sendToRealtor}
                    </span>
                  )}
                </div>

                {/* Realtor's Email */}
                {formData.sendToRealtor === "Yes" && (
                  <div className="mt-4">
                    <label className="block text-gray-500 font-medium">
                      Realtor's Email
                    </label>
                    <input
                      type="email"
                      name="realtorEmail"
                      value={formData.realtorEmail}
                      onChange={handleInputChange}
                      placeholder="Realtor's Email"
                      className={`w-full border border-gray-300 rounded px-3 py-2 mt-1 ${
                        errors.realtorEmail
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {errors.realtorEmail && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.realtorEmail}
                      </p>
                    )}
                  </div>
                )}

                {/* Promo Code */}
                <div className="mt-4">
                  <label className="block text-gray-500 font-medium">
                    Do you have a promo code?
                  </label>
                  <input
                    type="text"
                    name="promoCode"
                    value={formData.promoCode}
                    onChange={handleInputChange}
                    placeholder="Enter Promo Code"
                    className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            <button
              disabled={step === 1}
              onClick={handleBack}
              className={`px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 ${
                step !== 1 ? "hover:bg-gray-300" : ""
              }`}
            >
              Previous
            </button>
            {/* {step < 2 ? ( */}
            <button
              onClick={handleNext}
              disabled={!selectedPlan && !validate() ? true : false}
              className="px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded"
            >
              Next
            </button>
            {/* ) : (
              <button
                onClick={() => alert("Form submitted!")}
                className="px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded"
              >
                Submit
              </button>
            )} */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
