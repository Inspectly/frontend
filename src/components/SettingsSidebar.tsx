import React from "react";

interface SettingsSidebarProps {
  selected: string;
  onSelect: (section: string) => void;
}

const sections = [
  "Profile Settings",
  // "Account & Security",
  // "Payment Settings",
  // "Notification Preferences",
  // "Work Preferences",
  // "Feature Preferences",
  // "Legal & Compliance",
];

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ selected, onSelect }) => {
  return (
    <aside className="w-[250px] h-screen bg-white border-r border-gray-200 px-4 py-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-white">
      <h2 className="text-3xl font-semibold text-neutral-900 mb-4 px-1">Settings</h2>
      <ul className="flex flex-col space-y-2">
        {sections.map((section) => (
          <li key={section}>
            <button
              onClick={() => onSelect(section)}
              className={`w-full flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition duration-150 ease-in-out ${selected === section
                  ? "bg-blue-500 text-white"
                  : "text-neutral-600 hover:text-blue-400"
                }`}
            >
              {section}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default SettingsSidebar;
