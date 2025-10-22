"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useUser } from "../contexts/UserContext";
import Modal from "./Modal";

const CHANGE_PASSWORD = gql`
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(
      currentPassword: $currentPassword
      newPassword: $newPassword
    ) {
      success
      message
    }
  }
`;

const UPDATE_USER_NAME = gql`
  mutation UpdateUserName($name: String!) {
    updateUserName(name: $name) {
      success
      message
      user {
        id
        email
        name
      }
    }
  }
`;

export default function Profile() {
  const { user, setUser } = useUser();

  console.log("Profile component - current user:", user);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  const [changePassword, { loading: changingPassword }] =
    useMutation(CHANGE_PASSWORD);
  const [updateUserName, { loading: updatingName }] =
    useMutation(UPDATE_USER_NAME);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!currentPassword.trim()) {
      setError("Current password is required");
      return;
    }

    if (!newPassword.trim()) {
      setError("New password is required");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from current password");
      return;
    }

    try {
      const { data } = await changePassword({
        variables: {
          currentPassword,
          newPassword,
        },
      });

      if ((data as any)?.changePassword?.success) {
        setSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsChangingPassword(false);
        setPasswordChangeSuccess(true);
        // Close modal after a short delay to show success message
        setTimeout(() => {
          setIsChangingPassword(false);
        }, 2000);
        // Auto-dismiss success banner after 5 seconds
        setTimeout(() => {
          setPasswordChangeSuccess(false);
        }, 5000);
      } else {
        setError(
          (data as any)?.changePassword?.message || "Failed to change password"
        );
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to change password";
      setError(errorMessage);
      console.error("Change password error:", err);
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!newName.trim()) {
      setError("Name is required");
      return;
    }

    if (newName.trim() === user?.name) {
      setError("New name must be different from current name");
      return;
    }

    try {
      const { data } = await updateUserName({
        variables: {
          name: newName.trim(),
        },
      });

      if ((data as any)?.updateUserName?.success) {
        setSuccess("Name updated successfully!");
        console.log(
          "Updating user context with:",
          (data as any).updateUserName.user
        );
        setUser((data as any).updateUserName.user);
        setNewName("");
        setIsEditingName(false);
      } else {
        setError(
          (data as any)?.updateUserName?.message || "Failed to update name"
        );
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update name";
      setError(errorMessage);
      console.error("Update name error:", err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Profile Settings
        </h2>

        {/* Password Change Success Banner */}
        {passwordChangeSuccess && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Password Successfully Changed
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your password has been updated successfully.
                </p>
              </div>
              <button
                onClick={() => setPasswordChangeSuccess(false)}
                className="ml-auto text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                aria-label="Dismiss banner"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* User Information */}
        <div className="mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Account Information
          </h3>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <p className="text-gray-900 dark:text-white font-medium text-sm sm:text-base break-all">
                  {user?.email}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                {!isEditingName ? (
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900 dark:text-white font-medium text-sm sm:text-base">
                      {user?.name || "Not set"}
                    </p>
                    <button
                      onClick={() => {
                        console.log(
                          "Starting to edit name, current user name:",
                          user?.name
                        );
                        setIsEditingName(true);
                        setNewName(user?.name || "");
                        setError("");
                        setSuccess("");
                      }}
                      className="ml-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateName} className="space-y-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your name"
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={updatingName}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {updatingName ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingName(false);
                          setNewName("");
                          setError("");
                          setSuccess("");
                        }}
                        className="px-3 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Security
            </h3>
            <button
              onClick={() => {
                setIsChangingPassword(true);
                setError("");
                setSuccess("");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isChangingPassword}
        onClose={() => {
          setIsChangingPassword(false);
          setError("");
          setSuccess("");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }}
        title="Change Password"
        size="md"
      >
        <form
          onSubmit={handleChangePassword}
          className="space-y-4"
          autoComplete="off"
        >
          {/* Multiple hidden inputs to confuse password managers */}
          <input
            type="text"
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
            name="fake-username"
          />
          <input
            type="password"
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
            name="fake-password"
          />
          <input
            type="text"
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
            name="username"
          />
          <input
            type="password"
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
            name="password"
          />

          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter your current password"
              autoComplete="off"
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              name="current-password-field"
              required
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter your new password"
              autoComplete="off"
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              name="new-password-field"
              required
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Confirm your new password"
              autoComplete="off"
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              name="confirm-password-field"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
              {success}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={changingPassword}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 text-sm sm:text-base"
            >
              {changingPassword ? "Changing..." : "Change Password"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsChangingPassword(false);
                setError("");
                setSuccess("");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 text-sm sm:text-base"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
