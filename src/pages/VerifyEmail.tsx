import React, { useEffect, useState } from "react";
import { auth } from "../../firebase";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useCreateUserSessionMutation,
  useGetUserSessionByUserIdQuery,
} from "../features/api/userSessionsApi";
import { getIdToken } from "firebase/auth";
import {
  useCreateUserMutation,
  useGetUserByFirebaseIdQuery,
} from "../features/api/usersApi";
import { useCreateUserLoginMutation } from "../features/api/userLoginsApi";
import { User } from "../types";
import { useCreateClientMutation } from "../features/api/clientsApi";
import { useCreateRealtorMutation } from "../features/api/realtorsApi";
import { useCreateVendorMutation } from "../features/api/vendorsApi";
import { login } from "../features/authSlice";
import { useDispatch } from "react-redux";

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams(); // Retrieve query parameters
  const userType = searchParams.get("userType") || "client";
  const vendorType = searchParams.get("vendorType") || "general";
  const vendorTypes = searchParams.get("vendorTypes") || "general";

  const [firebaseUser, setFirebaseUser] = useState(auth.currentUser);
  const [isVerified, setIsVerified] = useState(false);
  const [backendUserExists, setBackendUserExists] = useState(false);
  const [sessionExists, setSessionExists] = useState(false);

  const [createBackendUser] = useCreateUserMutation();
  const [createUserSession] = useCreateUserSessionMutation();
  const [createUserLogin] = useCreateUserLoginMutation();
  const [createClient] = useCreateClientMutation();
  const [createVendor] = useCreateVendorMutation();
  const [createRealtor] = useCreateRealtorMutation();

  // Fetch backend user only after email is verified
  const { data: backendUserData, refetch: refetchUser } =
    useGetUserByFirebaseIdQuery(firebaseUser?.uid as string, {
      skip: !isVerified || !firebaseUser,
    });
  let backendUser: User | undefined = backendUserData; // Extract only `data`

  // Fetch session after backend user exists
  const { data: userSession } = useGetUserSessionByUserIdQuery(
    (backendUser as User)?.id?.toString(),
    {
      skip: !backendUserExists, // Fetch session only after backend user exists
    }
  );

  // Create specific user type
  const createUserType = async (
    backendUser: any,
    userType: string,
    userData: any
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

      return createVendor({
        vendor_user_id: userId,
        vendor_type: {
          vendor_type: vendorType,
        },
        vendor_types: vendorTypes,
        code: "ad123",
        name: `${userData.first_name} ${userData.last_name}`,
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

  useEffect(() => {
    const interval = setInterval(async () => {
      await auth.currentUser?.reload();
      setFirebaseUser(auth.currentUser);

      // If email is verified, stop checking
      if (auth.currentUser?.emailVerified) {
        setIsVerified(true);
        clearInterval(interval);
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // When backend user is found, update state
  useEffect(() => {
    if (backendUser) {
      setBackendUserExists(true);
    }
  }, [backendUser]);

  // When session is found, update state
  useEffect(() => {
    if (userSession) {
      setSessionExists(true);
    }
  }, [userSession]);

  useEffect(() => {
    if (!isVerified || backendUserExists) return; // Only proceed if verified

    const createUserAfterVerification = async () => {
      try {
        if (!firebaseUser) return;

        console.log("Email verified! Creating backend user...");

        let newUser = backendUser as User; // Use existing backend user if already fetched

        if (!backendUser) {
          console.log("Backend user not found. Creating new backend user...");

          // Step 1: Create Backend User
          newUser = await createBackendUser({
            firebase_id: firebaseUser.uid,
            user_type: { user_type: userType },
            email: firebaseUser.email || "unknown@example.com",
            first_name: firebaseUser.displayName?.split(" ")[0] || "Unknown",
            last_name: firebaseUser.displayName?.split(" ")[1] || "User",
          }).unwrap();

          console.log("Backend user created:", newUser);
          await refetchUser(); // Refetch user after creation
        }

        setBackendUserExists(true);

        console.log("Backend user retrieved:", backendUser);

        // Step 2: Create User Type (Only if not created yet)
        console.log("Creating user type...");
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

        await createUserType(newUser, userType, updatedUserData);

        console.log("User type created");

        // Step 3: Log Login Method
        await createUserLogin({
          user_id: newUser.id,
          email_login: true,
          email: firebaseUser.email || "",
          phone_login: false,
          phone: "",
          gmail_login: false,
          gmail: "",
        }).unwrap();

        console.log("Login method logged");
      } catch (error) {
        console.error("Error creating user:", error);

        // Step 4: Delete Firebase User on Failure
        try {
          await firebaseUser?.delete();
          console.log("Firebase user deleted due to failure");
        } catch (firebaseError) {
          console.error("Failed to delete Firebase user:", firebaseError);
        }
      }
    };

    createUserAfterVerification();
  }, [isVerified, backendUserExists, backendUser, userType]);

  // If backend user exists but session is missing, create it
  useEffect(() => {
    if (!backendUserExists || sessionExists || !auth.currentUser?.emailVerified)
      return;

    const createSessionAfterUserCreation = async () => {
      try {
        if (!firebaseUser) return;

        console.log("Backend user exists. Checking session...");

        const token = await getIdToken(firebaseUser);

        await createUserSession({
          user_id: backendUser?.id,
          login: "email",
          authentication_code: token,
        }).unwrap();

        localStorage.setItem("authToken", token);
        setSessionExists(true);

        console.log("User session created! Dispatching login...");
        dispatch(login(backendUser)); // Ensure Redux is updated

        setTimeout(() => {
          console.log("Redirecting to dashboard...");
          navigate("/dashboard"); // Navigate only after Redux state update
        }, 1000);
      } catch (error) {
        console.error("Error creating session:", error);

        // Delete Firebase user if session fails
        try {
          await firebaseUser?.delete();
          console.log("Firebase user deleted due to session failure");
        } catch (firebaseError) {
          console.error("Failed to delete Firebase user:", firebaseError);
        }
      }
    };

    createSessionAfterUserCreation();
  }, [backendUserExists, sessionExists, firebaseUser]);

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh_-_444px)]">
      <div className="max-w-md m-auto p-8 bg-white rounded shadow text-center h-fit">
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
      </div>
    </div>
  );
};

export default VerifyEmail;
