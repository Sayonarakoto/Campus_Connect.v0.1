import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import "./ProfileCard.css";

const API_BASE = "http://localhost:5000";

/**
 * Interactive ProfileCard Component
 * Displays user institutional credentials, allows editing personal details
 * (Full Name, Phone Number) and changing Profile Photo.
 */
export default function ProfileCard({ user: propUser, isOpen = true, onClose, onUserUpdate }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(() => {
    if (propUser) return propUser;
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: ""
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (propUser) {
      setCurrentUser(propUser);
    }
  }, [propUser]);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        fullName: currentUser.fullName || "",
        phoneNumber: currentUser.phoneNumber || currentUser.customData?.phoneNumber || ""
      });
    }
  }, [currentUser]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !currentUser) {
    return null;
  }

  // Compute profile photo URL
  const photoSrc = currentUser.profilePhotoUrl
    ? `${API_BASE}${currentUser.profilePhotoUrl}`
    : currentUser.profilePhoto?.url
    ? `${API_BASE}${currentUser.profilePhoto.url}`
    : typeof currentUser.profilePhoto === "string" && currentUser.profilePhoto
    ? `${API_BASE}${currentUser.profilePhoto}`
    : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%2394a3b8'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  /**
   * Submit updated profile information (fullName, phoneNumber)
   */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Authentication session expired. Please log in again.", "error");
      navigate("/login");
      return;
    }

    const cleanName = formData.fullName.trim();
    if (!cleanName) {
      showToast("Full name cannot be empty.", "warning");
      return;
    }

    const cleanPhone = formData.phoneNumber.trim();
    if (cleanPhone && !/^[6-9]\d{9}$/.test(cleanPhone)) {
      showToast("Please enter a valid 10-digit mobile number (starting with 6, 7, 8, or 9).", "warning");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: cleanName,
          phoneNumber: cleanPhone
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile.");
      }

      const updatedUser = {
        ...currentUser,
        ...data.user
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setIsEditing(false);
      showToast("Profile details updated successfully!", "success");

      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }
    } catch (err) {
      showToast(err.message || "Could not save profile changes.", "error");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Upload and update profile photo
   */
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Profile photo should be smaller than 5MB.", "warning");
      e.target.value = "";
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Please log in again to update your photo.", "error");
      return;
    }

    const form = new FormData();
    form.append("profilePhoto", file);

    setUploadingPhoto(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/profile/photo`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: form
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to upload photo.");
      }

      const updatedUser = {
        ...currentUser,
        profilePhoto: data.profilePhoto,
        profilePhotoUrl: data.profilePhotoUrl
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      showToast("Profile photo updated successfully!", "success");

      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }
    } catch (err) {
      showToast(err.message || "Failed to update profile photo.", "error");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  /**
   * Clean Logout
   */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("promotionViewsRecorded");
    showToast("You have been securely signed out.", "info");
    if (onClose) onClose();
    navigate("/login");
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="profile-card-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="profile-modal-header">
          <h3>
            <i className="fas fa-id-badge" aria-hidden="true" style={{ marginRight: 8 }}></i>
            Institutional Profile
          </h3>
          {onClose && (
            <button
              type="button"
              className="profile-modal-close-btn"
              onClick={onClose}
              aria-label="Close Profile"
            >
              <i className="fas fa-times" aria-hidden="true"></i>
            </button>
          )}
        </div>

        {/* Hero & Photo */}
        <div className="profile-hero-section">
          <div className="profile-avatar-container">
            <img
              className="profile-card-image"
              src={photoSrc}
              alt={currentUser.fullName || "User Profile"}
            />
            <button
              type="button"
              className="profile-photo-edit-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Change Profile Photo"
              aria-label="Change Profile Photo"
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? (
                <i className="fas fa-circle-notch fa-spin" aria-hidden="true"></i>
              ) : (
                <i className="fas fa-camera" aria-hidden="true"></i>
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: "none" }}
            />
          </div>

          <h4 className="profile-user-name">{currentUser.fullName}</h4>
          <span className="profile-role-pill">{currentUser.role}</span>
        </div>

        {/* Body Details */}
        <div className="profile-modal-body">
          {isEditing ? (
            <form id="profile-edit-form" onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="profile-edit-field">
                <label htmlFor="edit-fullName">Full Name</label>
                <input
                  id="edit-fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="profile-edit-field">
                <label htmlFor="edit-phoneNumber">Mobile Number</label>
                <input
                  id="edit-phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  maxLength={10}
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="10-digit mobile number"
                />
              </div>

              <div className="profile-info-row">
                <span className="profile-info-label">Email</span>
                <span className="profile-info-value" style={{ color: "#64748b" }}>{currentUser.email}</span>
              </div>
              {currentUser.department && (
                <div className="profile-info-row">
                  <span className="profile-info-label">Department</span>
                  <span className="profile-info-value" style={{ color: "#64748b" }}>{currentUser.department}</span>
                </div>
              )}
            </form>
          ) : (
            <>
              <div className="profile-info-row">
                <span className="profile-info-label">Email</span>
                <span className="profile-info-value">{currentUser.email || "—"}</span>
              </div>

              {currentUser.department && (
                <div className="profile-info-row">
                  <span className="profile-info-label">Department</span>
                  <span className="profile-info-value">{currentUser.department}</span>
                </div>
              )}

              <div className="profile-info-row">
                <span className="profile-info-label">Mobile</span>
                <span className="profile-info-value">
                  {currentUser.phoneNumber || currentUser.customData?.phoneNumber || "Not registered"}
                </span>
              </div>

              {(currentUser.customData?.admissionNo || currentUser.customData?.rollNumber) && (
                <div className="profile-info-row">
                  <span className="profile-info-label">Admission No</span>
                  <span className="profile-info-value">
                    {currentUser.customData.admissionNo || currentUser.customData.rollNumber}
                  </span>
                </div>
              )}

              {currentUser.customData?.regNo && (
                <div className="profile-info-row">
                  <span className="profile-info-label">Register No</span>
                  <span className="profile-info-value">{currentUser.customData.regNo}</span>
                </div>
              )}

              {currentUser.customData?.employeeId && (
                <div className="profile-info-row">
                  <span className="profile-info-label">Faculty ID</span>
                  <span className="profile-info-value">{currentUser.customData.employeeId}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="profile-modal-footer">
          {isEditing ? (
            <>
              <button
                type="button"
                className="btn-profile-secondary"
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                <i className="fas fa-times" aria-hidden="true" style={{ marginRight: 6 }}></i>
                Cancel
              </button>
              <button
                type="submit"
                form="profile-edit-form"
                className="btn-profile-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <i className="fas fa-spinner fa-spin" aria-hidden="true" style={{ marginRight: 6 }}></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save" aria-hidden="true" style={{ marginRight: 6 }}></i>
                    Save Changes
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn-profile-primary"
                onClick={() => setIsEditing(true)}
              >
                <i className="fas fa-user-edit" aria-hidden="true" style={{ marginRight: 6 }}></i>
                Edit Details
              </button>
              <button
                type="button"
                className="btn-profile-logout"
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt" aria-hidden="true" style={{ marginRight: 6 }}></i>
                Sign Out
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}