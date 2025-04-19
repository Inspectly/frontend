import React, { useEffect, useState } from "react";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import {
  useCreateUserSessionMutation,
  useGetUserSessionByUserIdQuery,
} from "../features/api/userSessionsApi";
import { getIdToken, sendEmailVerification } from "firebase/auth";
import {
  useCreateUserMutation,
  useGetUserByFirebaseIdQuery,
} from "../features/api/usersApi";
import { useCreateUserLoginMutation } from "../features/api/userLoginsApi";
import { useCreateClientMutation } from "../features/api/clientsApi";
import { useCreateRealtorMutation } from "../features/api/realtorsApi";
import {
  useCreateVendorMutation,
  useGetVendorsQuery,
} from "../features/api/vendorsApi";
import { login, logout, setLoading } from "../features/authSlice";
import { useDispatch } from "react-redux";
import { nanoid } from "nanoid";

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [firebaseUser, setFirebaseUser] = useState(auth.currentUser);
  const [isVerified, setIsVerified] = useState(false);
  const [backendUserExists, setBackendUserExists] = useState(false);
  const [sessionExists, setSessionExists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reauthNeeded, setReauthNeeded] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [cooldown, setCooldown] = useState(60); // Cooldown in seconds
  const [formData, setFormData] = useState<any>(null);
  const [vendorTypes, setVendorTypes] = useState<any[]>([]);

  const [createBackendUser] = useCreateUserMutation();
  const [createUserSession] = useCreateUserSessionMutation();
  const [createUserLogin] = useCreateUserLoginMutation();
  const [createClient] = useCreateClientMutation();
  const [createVendor] = useCreateVendorMutation();
  const [createRealtor] = useCreateRealtorMutation();

  const { data: vendors } = useGetVendorsQuery();

  const { refetch: refetchUser } = useGetUserByFirebaseIdQuery(
    firebaseUser?.uid as string,
    {
      skip: !isVerified || !firebaseUser,
    }
  );

  const { data: userSession } = useGetUserSessionByUserIdQuery(
    String(firebaseUser?.uid),
    {
      skip: !backendUserExists,
    }
  );

  // Load stored signup info
  useEffect(() => {
    const storedUserData = localStorage.getItem("signupUserData");
    const storedVendorTypes = localStorage.getItem("signupVendorTypes");

    if (storedUserData) setFormData(JSON.parse(storedUserData));
    if (storedVendorTypes) setVendorTypes(JSON.parse(storedVendorTypes));
  }, []);

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

  // Create specific user type
  const createUserType = async (
    backendUser: any,
    userType: string,
    userData: any
  ) => {
    const userId = backendUser.id;

    if (userType === "client") {
      return createClient({ user_id: userId, ...userData }).unwrap();
    }

    if (userType === "vendor") {
      const { first_name, last_name, ...vendorData } = userData;
      const vendorName = `${userData.first_name} ${userData.last_name}`;

      // Generate a unique vendor code before creating the vendor
      const uniqueCode = await generateUniqueVendorCode(vendorName);

      return createVendor({
        vendor_user_id: userId,
        vendor_type: {
          vendor_type: vendorTypes[0]?.value || "general",
        },
        vendor_types: vendorTypes.map((vt) => vt.value).join(", "),
        code: uniqueCode,
        name: vendorName,
        ...vendorData,
        rating: 5,
        review: "New Vendor",
      }).unwrap();
    }

    if (userType === "realtor") {
      return createRealtor({
        realtor_user_id: userId,
        realtor_firm_id: 1,
        ...userData,
        rating: 5,
        review: "New Realtor",
      }).unwrap();
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;

    try {
      await sendEmailVerification(auth.currentUser);
      console.log("Verification email sent!");

      // Start cooldown
      setResendDisabled(true);
      setCooldown(60);

      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setResendDisabled(false);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error("Error resending verification email:", err);

      if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a few minutes.");
        setResendDisabled(true);
        setTimeout(() => setResendDisabled(false), 300000);
      } else {
        setError("Failed to resend email. Try again later.");
      }
    }
  };

  // Polling for verification status
  useEffect(() => {
    const interval = setInterval(async () => {
      await auth.currentUser?.reload();
      setFirebaseUser(auth.currentUser);

      // If email is verified, stop checking
      if (auth.currentUser?.emailVerified) {
        setIsVerified(true);
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // After verification: Create backend user + session
  useEffect(() => {
    if (!isVerified || backendUserExists || !formData) return;

    const createUserAfterVerification = async () => {
      try {
        if (!firebaseUser) return;

        console.log("Email verified! Creating backend user...");

        // Create Backend User
        const createdUser = await createBackendUser({
          firebase_id: firebaseUser.uid,
          user_type: { user_type: formData.userType },
          email: firebaseUser.email || "unknown@example.com",
          first_name: formData.firstName,
          last_name: formData.lastName,
        }).unwrap();

        console.log("Backend user created:", createdUser);

        // Refetch to get complete backend user object
        const refreshedUser = await refetchUser().unwrap();
        console.log("Backend user retrieved:", refreshedUser);
        setBackendUserExists(true);

        // Create User Type (Only if not created yet)
        console.log("Creating user type...");
        const updatedUserData = {
          email: firebaseUser.email || "",
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postal_code: formData.postalCode,
        };

        await createUserType(refreshedUser, formData.userType, updatedUserData);

        // Create Login Record
        try {
          await createUserLogin({
            user_id: refreshedUser.id,
            email_login: true,
            email: firebaseUser.email || "",
            phone_login: false,
            phone: "",
            gmail_login: false,
            gmail: "",
          }).unwrap();

          console.log("Login method logged");
        } catch (loginErr: any) {
          if (
            loginErr?.status !== 400 &&
            !loginErr?.message?.includes("duplicate key value")
          ) {
            throw loginErr;
          } else {
            console.log("Login method already exists. Skipping.");
          }
        }

        // Create session
        const token = await getIdToken(firebaseUser);

        await createUserSession({
          user_id: refreshedUser.id,
          login: "email",
          login_time: new Date().toISOString(),
          authentication_code: token,
        }).unwrap();

        console.log("User session created! Dispatching login...");
        dispatch(login(refreshedUser));
        localStorage.setItem("authToken", token);

        // Clean up
        localStorage.removeItem("signupUserData");
        localStorage.removeItem("signupVendorTypes");

        setSessionExists(true);
        setTimeout(() => {
          console.log("Redirecting to dashboard...");
          navigate("/dashboard");
          dispatch(setLoading(false));
        }, 1000);
      } catch (error: any) {
        console.error("User creation failed:", error);
        if (error?.message?.includes("CREDENTIAL_TOO_OLD_LOGIN_AGAIN")) {
          setReauthNeeded(true);
        } else {
          // Only delete Firebase user if absolutely needed
          try {
            await firebaseUser?.delete();
            dispatch(logout());
            console.log("Firebase user deleted due to failure");
          } catch (firebaseErr) {
            console.error("Failed to delete Firebase user:", firebaseErr);
          }
        }
      }
    };

    createUserAfterVerification();
  }, [isVerified, backendUserExists, firebaseUser, formData]);

  useEffect(() => {
    if (userSession) setSessionExists(true);
  }, [userSession]);

  return (
    <div className="flex flex-col lg:flex-row mt-10">
      <div className="max-w-lg m-auto p-8 bg-white rounded shadow text-center h-fit">
        <h2 className="text-2xl font-bold mb-4">Verify Your Email</h2>
        <p className="text-gray-600 mb-4">
          A verification link has been sent to your email. Please verify your
          email to continue.
        </p>
        {!isVerified && (
          <p className="text-gray-500">Checking verification status...</p>
        )}
        {isVerified && !backendUserExists && (
          <p className="text-blue-500">
            Email verified! Creating backend user...
          </p>
        )}
        {backendUserExists && !sessionExists && (
          <p className="text-blue-500">
            User created! Setting up your session...
          </p>
        )}
        {sessionExists && (
          <p className="text-green-600">
            Account setup complete! Redirecting...
          </p>
        )}
        {reauthNeeded && (
          <button
            className="bg-red-500 text-white p-2 rounded mt-4"
            onClick={() => auth.signOut()}
          >
            Try to sign up again
          </button>
        )}
        {error && <p className="text-red-500">{error}</p>}

        <button
          className={`mt-4 px-4 py-2 bg-blue-500 text-white font-bold rounded ${
            resendDisabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-blue-700"
          }`}
          onClick={handleResendVerification}
          disabled={resendDisabled}
        >
          {resendDisabled
            ? `Resend in ${cooldown}s`
            : "Resend Verification Email"}
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;
