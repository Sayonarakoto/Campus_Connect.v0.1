import axios from "axios";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const attendanceApi = axios.create({
  baseURL: `${API}/api/attendance-corrections`
});

// Automatically attach JWT token
attendanceApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ===========================================
// REQUEST CORRECTION
// ===========================================

export const requestCorrection = async (data) => {
  const response = await attendanceApi.post(
    "/request",
    data
  );

  return response.data;
};

// ===========================================
// PENDING CORRECTIONS
// ===========================================

export const getPendingCorrections = async (filters = {}) => {
  const response = await attendanceApi.get(
    "/pending",
    {
      params: filters
    }
  );

  return response.data;
};

// ===========================================
// APPROVE
// ===========================================

export const approveCorrection = async (
  correctionId,
  remarks = ""
) => {
  const response = await attendanceApi.put(
    `/approve/${correctionId}`,
    {
      remarks
    }
  );

  return response.data;
};

// ===========================================
// REJECT
// ===========================================

export const rejectCorrection = async (
  correctionId,
  rejectionReason
) => {
  const response = await attendanceApi.put(
    `/reject/${correctionId}`,
    {
      rejectionReason
    }
  );

  return response.data;
};

// ===========================================
// APPLY
// ===========================================

export const applyCorrection = async (
  correctionId
) => {
  const response = await attendanceApi.put(
    `/apply/${correctionId}`
  );

  return response.data;
};

// ===========================================
// STUDENT HISTORY
// ===========================================

export const getStudentCorrectionHistory = async (
  studentId
) => {
  const response = await attendanceApi.get(
    `/history/${studentId}`
  );

  return response.data;
};

// ===========================================
// AUDIT HISTORY
// ===========================================

export const getAuditHistory = async (
  studentId
) => {
  const response = await attendanceApi.get(
    `/audit/${studentId}`
  );

  return response.data;
};

export default attendanceApi;