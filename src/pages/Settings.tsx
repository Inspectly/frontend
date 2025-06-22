import React, { useState } from "react";
import SettingsSidebar from "../components/SettingsSidebar";
import VendorProfileSettings from "../components/VendorProfileSettings";
import AccountAndSecuritySetting from "../components/AccountAndSecuritySetting";
import PaymentSettings from "../components/PaymentSettings";
import ClientProfileSettings from "../components/ClientProfileSettings";
import RealtorProfileSettings from "../components/RealtorProfileSettings";

const NotificationPreferences = () => (
  <div>
    <h2 className="text-xl font-semibold text-neutral-900 mb-2">Notification Preferences</h2>
    <p className="text-sm text-neutral-600">We are working on it!</p>
  </div>
);

const WorkPreferences = () => (
  <div>
    <h2 className="text-xl font-semibold text-neutral-900 mb-2">Work Preferences</h2>
    <p className="text-sm text-neutral-600">We are working on it!</p>
  </div>
);



// Render logic
const renderSection = (section: string, userType:string | null) => {
  switch (section) {
    case "Profile Settings":
      if (userType === "vendor") return <VendorProfileSettings />;
      if (userType === "client") return <ClientProfileSettings />;
      if (userType === "realtor") return <RealtorProfileSettings />;
      return <p>Unknown user type</p>;
    case "Account & Security":
        return <AccountAndSecuritySetting />;
    case "Payment Settings":
      return <PaymentSettings />;
    case "Notification Preferences":
      return <NotificationPreferences />;
    case "Work Preferences":
      return <WorkPreferences />;
    default:
      return <p className="text-neutral-600 text-sm">We are working on it!</p>;
  }
};

interface SettingsPageProps {
  userType: string | null ;
}


const SettingsPage:React.FC<SettingsPageProps> = ({userType}) => {
  const [selectedSection, setSelectedSection] = useState("Profile Settings");

  return (
    <div className="flex h-screen bg-white">
      <SettingsSidebar selected={selectedSection} onSelect={setSelectedSection} />
      <main className="flex-1 p-6 overflow-y-auto bg-gray-100">
        <section className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
          {renderSection(selectedSection, 'vendor')}
        </section>
      </main>
    </div>
  );
};

export default SettingsPage;
