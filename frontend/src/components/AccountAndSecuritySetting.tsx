import React, { useState } from "react";

const AccountAndSecuritySetting: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add validation and submit logic
    console.log({ currentPassword, newPassword, confirmPassword });
  };

  return (
    <div className="space-y-8">
      {/* Change Password */}
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Change Password</h3>
        <form className="space-y-4 max-w-md" onSubmit={handlePasswordSubmit}>
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-neutral-600 mb-1">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-600 mb-1">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-600 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="border border-red-600 bg-red-100 hover:bg-red-200 text-red-600 px-6 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Save
            </button>
          </div>
        </form>
      </section>

      {/* 2FA */}
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Two-Factor Authentication (2FA)</h3>
        <p className="text-sm text-neutral-600 mb-4">
          Add an extra layer of security to your account by enabling 2FA.
        </p>
        <button className="border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
          Enable 2FA
        </button>
      </section>

      {/* Login History */}
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Login History & Device Management</h3>
        <p className="text-sm text-neutral-600 mb-2">
          View and manage devices that accessed your account.
        </p>
        <div className="text-sm text-neutral-500 italic">Device history coming soon.</div>
      </section>

      {/* Deactivate Account */}
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Deactivate Account</h3>
        <p className="text-sm text-neutral-600 mb-4">
          Temporarily disable your account. You can reactivate by logging back in.
        </p>
        <button className="border border-red-600 bg-red-100 hover:bg-red-200 text-red-600 px-6 py-2 rounded-lg">
          Deactivate Account
        </button>
      </section>

      {/* Request Data Export */}
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Request Data Export</h3>
        <p className="text-sm text-neutral-600 mb-4">
          We'll email you a downloadable file of your data.
        </p>
        <button className="border border-gray-400 text-gray-700 hover:bg-gray-100 px-6 py-2 rounded-lg">
          Request Data Export
        </button>
      </section>
    </div>
  );
};

export default AccountAndSecuritySetting;
