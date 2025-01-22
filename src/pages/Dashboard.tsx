import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser || !auth.currentUser.emailVerified) {
      navigate("/login");
    }
  }, [navigate]);

  return <div>Welcome to the Dashboard!</div>;
};

export default Dashboard;
