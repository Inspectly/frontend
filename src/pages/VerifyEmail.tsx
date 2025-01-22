import React, { useEffect } from "react";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(async () => {
      await auth.currentUser?.reload();
      if (auth.currentUser?.emailVerified) {
        clearInterval(interval);
        navigate("/dashboard"); // Redirect to dashboard after verification
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh_-_444px)]">
      <div className="max-w-md m-auto p-8 bg-white rounded shadow text-center h-fit">
        <h2 className="text-2xl font-bold mb-4">Verify Your Email</h2>
        <p className="text-gray-600 mb-4">
          A verification link has been sent to your email. Please verify your
          email to continue.
        </p>
        <p className="text-gray-500">
          You will be redirected once your email is verified.
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
