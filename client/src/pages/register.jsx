import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "../context/ToastContext";
import "../pages/Dashboard/WorkDashboard.css";

/* ===========================================================
   COMMON DEPARTMENTS
=========================================================== */

const DEPARTMENTS = [
  "Mechanical Engineering",
  "Computer Engineering",
  "Automobile Engineering",
  "Electrical and Electronics Engineering",
  "Civil Engineering",
  "Fire Technology and Safety"
];

const SEMESTERS = [
  { value: 1, label: "Semester 1" },
  { value: 2, label: "Semester 2" },
  { value: 3, label: "Semester 3" },
  { value: 4, label: "Semester 4" },
  { value: 5, label: "Semester 5" },
  { value: 6, label: "Semester 6" }
];

/* ===========================================================
   ROLE CONFIGURATION
=========================================================== */

const roleRegistrationSpecs = {
  /* ==========================
      STUDENT
  ========================== */
  student: {
    title: "Student Enrollment",
    badge: "Student",
    instructions: "Complete all academic information before creating your account.",
    customFields: [
      {
        name: "admissionNo",
        label: "Admission No",
        type: "text",
        placeholder: "e.g. 1001 (Max 4 digits)",
        required: true,
        maxLength: 4
      },
      {
        name: "regNo",
        label: "Register No",
        type: "text",
        placeholder: "e.g. 2101234567 (Max 10 digits)",
        required: true,
        maxLength: 10
      },
      {
        name: "department",
        label: "Department",
        type: "select",
        options: DEPARTMENTS,
        required: true
      },
      {
        name: "semester",
        label: "Semester",
        type: "select",
        options: SEMESTERS,
        required: true
      },
      {
        name: "batchYear",
        label: "Batch Year",
        type: "text",
        placeholder: "2024-2027",
        required: true
      },
      {
        name: "section",
        label: "Section",
        type: "select",
        required: false
      },
      {
        name: "parentEmail",
        label: "Parent Email",
        type: "email",
        placeholder: "parent@email.com",
        required: true
      }
    ]
  },

  /* ==========================
      PARENT
  ========================== */
  parent: {
    title: "Parent Registration",
    badge: "Parent",
    instructions: "Link your account with your child's admission number.",
    customFields: [
      {
        name: "studentRollNumber",
        label: "Student Roll Number",
        type: "text",
        placeholder: "STU2026001",
        required: true
      },
      {
        name: "governmentId",
        label: "Government ID",
        type: "text",
        placeholder: "National ID / Passport",
        required: true
      }
    ]
  },

  /* ==========================
      FACULTY
  ========================== */
  faculty: {
    title: "Faculty Registration",
    badge: "Faculty",
    instructions: "Register as a faculty member of your department.",
    customFields: [
      {
        name: "employeeId",
        label: "Faculty ID",
        type: "text",
        placeholder: "FAC1001",
        required: true
      },
      {
        name: "department",
        label: "Department",
        type: "select",
        options: DEPARTMENTS,
        required: true
      },
      {
        name: "dateOfJoining",
        label: "Date of Joining",
        type: "date",
        required: true
      },
      {
        name: "isLabStaff",
        label: "Lab Staff",
        type: "checkbox",
        required: false
      }
    ]
  },

  /* ==========================
      HOD
  ========================== */
  hod: {
    title: "Head of Department Registration",
    badge: "HOD",
    instructions: "Register your HOD account.",
    customFields: [
      {
        name: "employeeId",
        label: "Faculty ID",
        type: "text",
        placeholder: "HOD1001",
        required: true
      },
      {
        name: "department",
        label: "Department",
        type: "select",
        options: DEPARTMENTS,
        required: true
      },
      {
        name: "dateOfJoining",
        label: "Date of Joining",
        type: "date",
        required: true
      },
      {
        name: "clearanceToken",
        label: "Clearance Token",
        type: "password",
        placeholder: "Administrator Token",
        required: true
      }
    ]
  },

  /* ==========================
      PRINCIPAL
  ========================== */
  principal: {
    title: "Principal Registration",
    badge: "Principal",
    instructions: "Create the Principal account.",
    customFields: [
      {
        name: "employeeId",
        label: "Faculty ID",
        type: "text",
        placeholder: "PRI1001",
        required: true
      },
      {
        name: "institutionCode",
        label: "Institution Code",
        type: "text",
        placeholder: "College Code",
        required: true
      },
      {
        name: "dateOfJoining",
        label: "Date of Joining",
        type: "date",
        required: true
      }
    ]
  },

  /* ==========================
      DIRECTOR
  ========================== */
  director: {
    title: "Director Registration",
    badge: "Director",
    instructions: "Register the Director account.",
    customFields: [
      {
        name: "directorSignatureId",
        label: "Director Signature ID",
        type: "text",
        placeholder: "DIR1001",
        required: true
      },
      {
        name: "dateOfJoining",
        label: "Date of Joining",
        type: "date",
        required: true
      },
      {
        name: "rootPassphrase",
        label: "Root Passphrase",
        type: "password",
        placeholder: "********",
        required: true
      }
    ]
  },

  /* ==========================
      HR & ACCOUNTS
  ========================== */
  hraccounts: {
    title: "HR & Accounts Registration",
    badge: "HR & Accounts",
    instructions: "Register HR & Accounts staff account.",
    customFields: [
      {
        name: "staffId",
        label: "Staff ID",
        type: "text",
        placeholder: "HR1001",
        required: true
      },
      {
        name: "staffRole",
        label: "Role",
        type: "select",
        options: [
          "HR",
          "Accounts"
        ],
        required: true
      },
      {
        name: "dateOfJoining",
        label: "Date of Joining",
        type: "date",
        required: true
      }
    ]
  },

  /* ==========================
      SECURITY
  ========================== */
  security: {
    title: "Security Registration",
    badge: "Security",
    instructions: "Register as Security Staff.",
    customFields: []
  },

  /* ==========================
      ADMIN
  ========================== */
  admin: {
    title: "Administrator Registration",
    badge: "Administrator",
    instructions: "Create a system administrator account.",
    customFields: [
      {
        name: "adminClearanceLevel",
        label: "Clearance Level",
        type: "select",
        options: ["L1", "L2", "L3"],
        required: true
      },
      {
        name: "systemPasskey",
        label: "System Passkey",
        type: "password",
        placeholder: "********",
        required: true
      }
    ]
  }
};

function Register() {
  const { role } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  /* ==========================================
      NORMALIZE ROLE
  ========================================== */
  let normalizedRole = role ? role.toLowerCase() : "student";
  if (normalizedRole === "hr" || normalizedRole === "hraffiliatemanager") {
    normalizedRole = "hraccounts";
  }

  /* ==========================================
      FORM STATE (Unconditional Hooks)
  ========================================== */
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    department: "",
    programme: "",
    semester: "",
    batchYear: "",
    section: "",
    admissionNo: "",
    regNo: "",
    parentEmail: "",
    studentRollNumber: "",
    governmentId: "",
    employeeId: "",
    dateOfJoining: "",
    institutionCode: "",
    directorSignatureId: "",
    rootPassphrase: "",
    staffId: "",
    staffRole: "",
    adminClearanceLevel: "",
    systemPasskey: "",
    clearanceToken: "",
    isLabStaff: false
  });

  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  /* ==========================================
      BLOCK PUBLIC ADMIN REGISTRATION
  ========================================== */
  if (normalizedRole === "admin") {
    return (
      <div className="auth-page-wrapper" style={{ minHeight: "75vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ maxWidth: "520px", width: "100%", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "2.5rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.08)", textAlign: "center" }}>
          <div style={{ width: "68px", height: "68px", borderRadius: "50%", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", fontSize: "1.75rem" }}>
            <i className="fas fa-user-lock"></i>
          </div>
          <span style={{ display: "inline-block", background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", padding: "4px 12px", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
            Institutional Security Protocol
          </span>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.75rem" }}>
            Admin Self-Registration Restricted
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "1.75rem" }}>
            Administrative accounts hold master privileges and cannot be provisioned through public enrollment. Super Administrator accounts are established exclusively via secure backend initialization.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Link
              to="/auth/admin"
              style={{
                display: "inline-block",
                background: "#0f172a",
                color: "#ffffff",
                padding: "0.85rem 1.5rem",
                borderRadius: "8px",
                fontWeight: "600",
                textDecoration: "none",
                fontSize: "0.95rem"
              }}
            >
              Access Administration Console
            </Link>
            <Link
              to="/login"
              style={{
                display: "inline-block",
                color: "#64748b",
                fontSize: "0.875rem",
                textDecoration: "none",
                padding: "0.5rem"
              }}
            >
              ← Return to Public Gateways
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================
      CURRENT ROLE CONFIG
  ========================================== */
  const config = roleRegistrationSpecs[normalizedRole] || roleRegistrationSpecs.student;

  /* ==========================================
      PHOTO OPTIMIZATION FUNCTION
  ========================================== */
  const optimizeImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          // Set maximum dimensions
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          
          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }
          
          // Create canvas for optimization
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          // Draw image with optimization
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          
          // Determine quality based on file type
          let quality = 0.7; // Default quality (70%)
          let mimeType = 'image/jpeg';
          
          if (file.type === 'image/png') {
            quality = 0.8;
            mimeType = 'image/png';
          } else if (file.type === 'image/webp') {
            quality = 0.7;
            mimeType = 'image/webp';
          } else {
            quality = 0.75;
            mimeType = 'image/jpeg';
          }
          
          // Convert to optimized blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Check if optimized file is still within size limit
                if (blob.size > 5 * 1024 * 1024) {
                  reject(new Error('Image too large even after optimization'));
                  return;
                }
                
                // Create a new File object
                const optimizedFile = new File(
                  [blob],
                  file.name.replace(/\.[^.]+$/, '') + '_optimized.jpg',
                  { type: mimeType, lastModified: Date.now() }
                );
                
                resolve(optimizedFile);
              } else {
                reject(new Error('Failed to optimize image'));
              }
            },
            mimeType,
            quality
          );
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
    });
  };

  /* ==========================================
      PHOTO CHANGE WITH OPTIMIZATION
  ========================================== */
  const handlePhotoChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setUploadProgress(10);
    
    try {
      // Validate file size (max 10MB before optimization)
      if (file.size > 10 * 1024 * 1024) {
        showToast("Profile photo should be less than 10MB before optimization.", "warning");
        event.target.value = "";
        setUploadProgress(0);
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        showToast("Please select a valid image file (JPG, PNG, GIF, WEBP).", "warning");
        event.target.value = "";
        setUploadProgress(0);
        return;
      }
      
      setUploadProgress(30);
      
      // Optimize the image
      const optimizedFile = await optimizeImage(file);
      
      setUploadProgress(80);
      
      // Set the optimized file
      setProfilePhoto(optimizedFile);
      setPreview(URL.createObjectURL(optimizedFile));
      
      setUploadProgress(100);
      
      // Reset progress after a moment
      setTimeout(() => setUploadProgress(0), 1000);
      
    } catch (error) {
      console.error('Photo optimization error:', error);
      showToast(error.message || "Failed to process image. Please try another photo.", "error");
      event.target.value = "";
      setUploadProgress(0);
    }
  };

  /* ==========================================
      REMOVE PHOTO
  ========================================== */
  const removePhoto = () => {
    setProfilePhoto(null);
    setPreview(null);
    setUploadProgress(0);
    document.getElementById('profilePhotoInput').value = '';
  };

  /* ==========================================
      INPUT CHANGE
  ========================================== */
  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    let finalValue = type === "checkbox" ? checked : value;

    if (name === "admissionNo") {
      finalValue = finalValue.replace(/\D/g, "").slice(0, 4);
    } else if (name === "regNo") {
      finalValue = finalValue.replace(/\D/g, "").slice(0, 10);
    } else if (name === "phoneNumber") {
      finalValue = finalValue.replace(/\D/g, "").slice(0, 10);
    } else if (name === "password" && normalizedRole === "security") {
      finalValue = finalValue.replace(/\D/g, "").slice(0, 6);
    }

    setFormData(previous => ({
      ...previous,
      [name]: finalValue,
      ...(name === "department" && value !== "Mechanical Engineering" ? { section: "" } : {})
    }));
  };

  /* ==========================================
      SUBMIT
  ========================================== */
  const handleRegistrationSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email || !emailRegex.test(formData.email.trim())) {
        showToast("Please enter a valid email address.", "warning");
        setLoading(false);
        return;
      }

      if (normalizedRole !== "admin") {
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!formData.phoneNumber || !phoneRegex.test(formData.phoneNumber.trim())) {
          showToast("Please enter a valid 10-digit mobile number (starting with 6, 7, 8, or 9).", "warning");
          setLoading(false);
          return;
        }
      }

      if (normalizedRole === "security") {
        if (!formData.password || !/^\d{6}$/.test(formData.password.trim())) {
          showToast("Security passkey must be exactly 6 numeric digits.", "warning");
          setLoading(false);
          return;
        }
      } else {
        if (!formData.password || formData.password.length < 6) {
          showToast("Password must be at least 6 characters long.", "warning");
          setLoading(false);
          return;
        }
      }

      if (normalizedRole === "student") {
        if (!formData.admissionNo || !/^\d{1,4}$/.test(formData.admissionNo)) {
          showToast("Admission Number is required and must be a number with up to 4 digits (e.g. 1001).", "warning");
          setLoading(false);
          return;
        }

        if (!formData.regNo || !/^\d{1,10}$/.test(formData.regNo)) {
          showToast("Register Number is required and must be a number with up to 10 digits (e.g. 2101234567).", "warning");
          setLoading(false);
          return;
        }

        if (formData.parentEmail && !emailRegex.test(formData.parentEmail.trim())) {
          showToast("Please enter a valid parent email address.", "warning");
          setLoading(false);
          return;
        }

        if (formData.department === "Mechanical Engineering") {
          if (!formData.section || !["Mech-A", "Mech-B"].includes(formData.section)) {
            showToast("Section is mandatory for Mechanical Engineering. Please select Mech-A or Mech-B.", "warning");
            setLoading(false);
            return;
          }
        }
      }

      const form = new FormData();
      
      // Standard fields
      form.append("role", normalizedRole);
      form.append("fullName", formData.fullName.trim());
      form.append("email", formData.email.trim());
      form.append("password", formData.password);
      if (normalizedRole !== "admin" && formData.phoneNumber) {
        form.append("phoneNumber", formData.phoneNumber.trim());
      }
      
      // Append only custom fields declared for this specific role
      const declaredFields = config.customFields || [];
      declaredFields.forEach(field => {
        const val = formData[field.name];
        if (field.type === "checkbox") {
          if (val === true) {
            form.append(field.name, "true");
          }
        } else if (val !== null && val !== undefined && val !== '') {
          form.append(field.name, typeof val === "string" ? val.trim() : val);
        }
      });
      
      // Profile photo (already optimized)
      if (profilePhoto) {
        // Check final size
        if (profilePhoto.size > 5 * 1024 * 1024) {
          showToast("Profile photo is still too large. Please choose a smaller image.", "warning");
          setLoading(false);
          return;
        }
        form.append("profilePhoto", profilePhoto);
      }

      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          body: form
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || "Registration failed. Please review your details.", "error");
        return;
      }

      showToast("Registration successful! Redirecting to login...", "success");
      navigate(`/${normalizedRole}/auth`);
    } catch (error) {
      console.error(error);
      showToast("Unable to connect to college server. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================
      FIELD RENDERER
  ========================================== */
  const renderField = (field) => {
    if (field.name === "section") {
      const isMech = formData.department === "Mechanical Engineering";
      if (!isMech) {
        return (
          <input
            type="text"
            name="section"
            value=""
            disabled
            placeholder="Not applicable (Single division department)"
            style={{ ...styles.input, backgroundColor: "#f0f2f5", color: "#8c9ba5", cursor: "not-allowed" }}
          />
        );
      }
      return (
        <select
          name="section"
          value={formData.section || ""}
          required={true}
          style={styles.input}
          onChange={handleInputChange}
        >
          <option value="">Select Section</option>
          <option value="Mech-A">Mech-A</option>
          <option value="Mech-B">Mech-B</option>
        </select>
      );
    }

    if (field.type === "checkbox") {
      return (
        <input
          type="checkbox"
          name={field.name}
          checked={formData[field.name]}
          onChange={handleInputChange}
        />
      );
    }

    if (field.type === "select") {
      return (
        <select
          name={field.name}
          value={formData[field.name]}
          required={field.required}
          style={styles.input}
          onChange={handleInputChange}
        >
          <option value="">Select</option>
          {field.options.map(option => {
            const val = typeof option === "object" ? option.value : option;
            const label = typeof option === "object" ? option.label : option;
            return (
              <option key={val} value={val}>
                {label}
              </option>
            );
          })}
        </select>
      );
    }

    return (
      <input
        type={field.type}
        name={field.name}
        value={formData[field.name]}
        placeholder={field.placeholder}
        required={field.required}
        maxLength={field.maxLength}
        style={styles.input}
        onChange={handleInputChange}
      />
    );
  };

  /* ==========================================
      SHOULD SHOW PHOTO UPLOAD
  ========================================== */
  const shouldShowPhotoUpload = normalizedRole === "student" || normalizedRole === "faculty";

  /* ==========================================
      FORMAT FILE SIZE
  ========================================== */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="workspace-page-wrapper">
      <div className="workspace-container" style={{ maxWidth: "700px" }}>
        {/* ===========================
            TOP NAVIGATION
        =========================== */}
        <nav className="workspace-nav">
          <div className="nav-brand-group">
            <div>
              <h3>St. Mary's Polytechnic College</h3>
              <p>Registration Portal • Valliyode</p>
            </div>
          </div>
          <Link to="/" className="btn-back-portal">← Exit</Link>
        </nav>

        {/* ===========================
            HEADER
        =========================== */}
        <header className="workspace-hero" style={{ padding: "30px", marginBottom: "24px" }}>
          <div className="hero-identity-row" style={{ gap: "20px" }}>
            <div className="hero-text-block">
              <span
                className="role-badge-pill"
                style={{
                  borderColor: "var(--primary-color)",
                  color: "var(--primary-color)"
                }}
              >
                {config.badge}
              </span>
              <h1 style={{ fontSize: "1.8rem", marginTop: "10px" }}>
                {config.title}
              </h1>
              <p className="role-subtext">{config.instructions}</p>
            </div>
          </div>
        </header>

        {/* ===========================
            FORM
        =========================== */}
        <main className="transaction-execution-card" style={{ display: "block", padding: "40px" }}>
          <form onSubmit={handleRegistrationSubmit}>
            {/* FULL NAME */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="John Doe"
                required
              />
            </div>

            {/* EMAIL */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="john@college.edu"
                required
              />
            </div>

            {/* PHONE NUMBER (All roles except Admin) */}
            {normalizedRole !== "admin" && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone Number *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="10-digit mobile number"
                  required
                  maxLength={10}
                />
              </div>
            )}

            {/* PASSWORD */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                {normalizedRole === "security" ? "6-Digit Passkey *" : "Password *"}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                style={styles.input}
                placeholder={
                  normalizedRole === "security"
                    ? "Enter 6-digit numeric passkey"
                    : "Create Password (min 6 characters)"
                }
                required
                minLength="6"
                maxLength={normalizedRole === "security" ? 6 : undefined}
              />
            </div>

            {/* ===========================
                PROFILE PHOTO (Student/Faculty only)
            =========================== */}
            {shouldShowPhotoUpload && (
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Profile Photo
                  <span style={{ fontSize: "0.8rem", color: "#666", fontWeight: "normal" }}>
                    {" "}(Optional - Max 5MB, Optimized automatically)
                  </span>
                </label>
                
                <div style={styles.photoUploadContainer}>
                  <input
                    type="file"
                    id="profilePhotoInput"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={styles.fileInput}
                  />
                  <label htmlFor="profilePhotoInput" style={styles.fileLabel}>
                    <span style={{ fontSize: "1.5rem", marginRight: "10px" }}>📷</span>
                    Choose Photo
                  </label>
                  <small style={{ color: "#666", marginLeft: "10px" }}>
                    JPG, PNG, GIF, WEBP (Max 10MB before optimization)
                  </small>
                </div>

                {/* Upload Progress */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div style={styles.progressContainer}>
                    <div style={{
                      ...styles.progressBar,
                      width: `${uploadProgress}%`
                    }} />
                    <span style={styles.progressText}>
                      Optimizing... {uploadProgress}%
                    </span>
                  </div>
                )}

                {/* Preview */}
                {preview && (
                  <div style={styles.previewContainer}>
                    <img 
                      src={preview} 
                      alt="Profile preview" 
                      style={styles.previewImage}
                    />
                    <div style={styles.previewInfo}>
                      <span style={styles.previewFileName}>
                        {profilePhoto?.name || 'profile-photo.jpg'}
                      </span>
                      {profilePhoto && (
                        <span style={styles.previewFileSize}>
                          {formatFileSize(profilePhoto.size)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={removePhoto}
                      style={styles.removePhotoBtn}
                    >
                      × Remove
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ===========================
                ROLE SPECIFIC FIELDS
            =========================== */}
            {config.customFields.map(field => {
              const isSection = field.name === "section";
              const isMech = formData.department === "Mechanical Engineering";
              const isRequired = isSection ? isMech : field.required;

              return (
                <div key={field.name} style={styles.formGroup}>
                  <label style={styles.label}>
                    {field.label}
                    {isRequired && <span style={{ color: "red" }}> *</span>}
                  </label>
                  {renderField(field)}
                </div>
              );
            })}



            {/* ===========================
                SUBMIT BUTTON
            =========================== */}
            <button
              type="submit"
              className="btn-execute-action"
              style={{ width: "100%" }}
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            {/* ===========================
                LOGIN LINK
            =========================== */}
            <p style={{ marginTop: "20px", textAlign: "center", color: "var(--text-light)" }}>
              Already have an account?{" "}
              <Link
                to={`/${normalizedRole}/auth`}
                style={{
                  color: "var(--primary-color)",
                  fontWeight: "600",
                  textDecoration: "none"
                }}
              >
                Login Here
              </Link>
            </p>
          </form>
        </main>

      </div>
    </div>
  );
}

const styles = {
  formGroup: {
    marginBottom: "20px",
    textAlign: "left"
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontWeight: "600",
    fontSize: "0.9rem",
    color: "var(--primary-color)"
  },
  input: {
    width: "100%",
    padding: "12px",
    border: "2px solid #e2e8f0",
    borderRadius: "6px",
    background: "#fff",
    fontSize: "0.95rem",
    outline: "none",
    transition: "0.2s"
  },
  photoUploadContainer: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px"
  },
  fileInput: {
    display: "none"
  },
  fileLabel: {
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 20px",
    background: "#f1f5f9",
    border: "2px dashed #cbd5e1",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "0.2s",
    color: "#475569",
    ":hover": {
      background: "#e2e8f0"
    }
  },
  progressContainer: {
    marginTop: "10px",
    height: "24px",
    background: "#f1f5f9",
    borderRadius: "4px",
    overflow: "hidden",
    position: "relative"
  },
  progressBar: {
    height: "100%",
    background: "linear-gradient(90deg, #3b82f6, #2563eb)",
    borderRadius: "4px",
    transition: "width 0.3s ease"
  },
  progressText: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "0.8rem",
    fontWeight: "600",
    color: "#1e293b"
  },
  previewContainer: {
    marginTop: "10px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "10px",
    background: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0"
  },
  previewImage: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #e2e8f0"
  },
  previewInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1
  },
  previewFileName: {
    fontSize: "0.85rem",
    fontWeight: "500",
    color: "#1e293b"
  },
  previewFileSize: {
    fontSize: "0.75rem",
    color: "#64748b"
  },
  removePhotoBtn: {
    padding: "5px 12px",
    background: "#fee2e2",
    border: "none",
    borderRadius: "4px",
    color: "#991b1b",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "500",
    transition: "0.2s",
    ":hover": {
      background: "#fecaca"
    }
  }
};

export default Register;