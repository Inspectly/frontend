import React from "react";
import VendorProfileSettings from "../components/VendorProfileSettings";
import ClientProfileSettings from "../components/ClientProfileSettings";
import RealtorProfileSettings from "../components/RealtorProfileSettings";

interface SettingsPageProps {
  userType: string | null;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ userType }) => {
  const renderProfile = () => {
    if (userType === "vendor") return <VendorProfileSettings />;
    if (userType === "client") return <ClientProfileSettings />;
    if (userType === "realtor") return <RealtorProfileSettings />;
    return <p>Unknown user type</p>;
  };

  return (
    <div className="flex-1 bg-neutral-50 min-h-full">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {renderProfile()}
      </div>
    </div>
  );
};

export default SettingsPage;
