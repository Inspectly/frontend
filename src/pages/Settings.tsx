import React, { useState } from "react";
import SettingsSidebar from "../components/SettingsSidebar";
import ProfileSettings from "../components/ProfileSettings";
import AccountAndSecuritySetting from "../components/AccountAndSecuritySetting";
import PaymentSettings from "../components/PaymentSettings";

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
const renderSection = (section: string) => {
  switch (section) {
    case "Profile Settings":
      return <ProfileSettings />;
    case "Account & Security":
        return <AccountAndSecuritySetting />;
    case "Payment Settings":
      return <PaymentSettings />;
    case "Notification Preferences":
      return <NotificationPreferences />;
    case "Work Preferences":
      return <WorkPreferences />;
    default:
      return <p className="text-neutral-600 text-sm">Settings section not implemented yet.</p>;
  }
};

const SettingsPage = () => {
  const [selectedSection, setSelectedSection] = useState("Profile Settings");

  return (
    <div className="flex h-screen bg-white">
      <SettingsSidebar selected={selectedSection} onSelect={setSelectedSection} />
      <main className="flex-1 p-6 overflow-y-auto bg-gray-100">
        <section className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
          {renderSection(selectedSection)}
        </section>
      </main>
    </div>
  );
};

export default SettingsPage;
