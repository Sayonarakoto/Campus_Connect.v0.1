import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

// Houses (Excel bulk replaces auto-allocate)
export const listHouses = () => axios.get(`${API_URL}/api/sports-houses`, { headers: auth() });
export const createHouse = (body) => axios.post(`${API_URL}/api/sports-houses`, body, { headers: auth() });
export const updateHouse = (id, body) => axios.put(`${API_URL}/api/sports-houses/${id}`, body, { headers: auth() });
export const deactivateHouse = (id) => axios.delete(`${API_URL}/api/sports-houses/${id}`, { headers: auth() });
export const assignHouseRoles = (id, body) => axios.put(`${API_URL}/api/sports-houses/${id}/assignments`, body, { headers: auth() });
export const houseStats = () => axios.get(`${API_URL}/api/sports-houses/stats`, { headers: auth() });
export const houseBulkTemplate = () => axios.get(`${API_URL}/api/sports-houses/template`, { headers: auth() });
export const bulkAssignHouses = (assignments) => axios.post(`${API_URL}/api/sports-houses/bulk-assign`, { assignments }, { headers: auth() });
export const exportHouseAssignments = (params) => axios.get(`${API_URL}/api/sports-houses/export`, { headers: auth(), params });
export const reassignStudent = (studentId, houseId) => axios.put(`${API_URL}/api/sports-houses/reassign`, { studentId, houseId }, { headers: auth() });

// Masters
export const listMasters = (academicYear, section) => axios.get(`${API_URL}/api/sports-masters`, { headers: auth(), params: { academicYear, section } });
export const seedMasters = (academicYear, keys) => axios.post(`${API_URL}/api/sports-masters/seed`, { academicYear, keys }, { headers: auth() });

// Student registration profile (house/semester for eligibility display)
export const getSportsProfile = () => axios.get(`${API_URL}/api/student-sports/profile`, { headers: auth() });

// Events (sports coordinator creates event types with section + semester scope)
export const createSportsEvent = (body) => axios.post(`${API_URL}/api/sports-events`, body, { headers: auth() });
export const updateSportsEvent = (id, body) => axios.put(`${API_URL}/api/sports-events/${id}`, body, { headers: auth() });

// Workflow — student
export const studentSubmit = (eventIds, teamNames) => axios.post(`${API_URL}/api/sports-workflow/submit`, { eventIds, teamNames }, { headers: auth() });
export const myStatus = () => axios.get(`${API_URL}/api/sports-workflow/my-status`, { headers: auth() });
// Captain
export const captainPending = () => axios.get(`${API_URL}/api/sports-workflow/captain-pending`, { headers: auth() });
export const captainRoster = (params) => axios.get(`${API_URL}/api/sports-workflow/captain-roster`, { headers: auth(), params });
export const captainDecide = (registrationIds, decision, remarks) => axios.post(`${API_URL}/api/sports-workflow/captain-decide`, { registrationIds, decision, remarks }, { headers: auth() });
export const captainAdd = (studentId, eventId, teamName) => axios.post(`${API_URL}/api/sports-workflow/captain-add`, { studentId, eventId, teamName }, { headers: auth() });
export const captainEdit = (id, body) => axios.put(`${API_URL}/api/sports-workflow/captain-edit/${id}`, body, { headers: auth() });
export const captainRemove = (id) => axios.delete(`${API_URL}/api/sports-workflow/captain-remove/${id}`, { headers: auth() });
// Coordinator + final
export const coordinatorPending = () => axios.get(`${API_URL}/api/sports-workflow/coordinator-pending`, { headers: auth() });
export const coordinatorDecide = (registrationIds, decision, remarks) => axios.post(`${API_URL}/api/sports-workflow/coordinator-decide`, { registrationIds, decision, remarks }, { headers: auth() });
export const finalPending = (params) => axios.get(`${API_URL}/api/sports-workflow/final-pending`, { headers: auth(), params });
export const finalDecide = (registrationIds, decision, remarks) => axios.post(`${API_URL}/api/sports-workflow/final-decide`, { registrationIds, decision, remarks }, { headers: auth() });

// Results
export const resultTemplate = () => axios.get(`${API_URL}/api/sports-results/template`, { headers: auth() });
export const importResults = (rows, academicYear) => axios.post(`${API_URL}/api/sports-results/import`, { rows, academicYear }, { headers: auth() });
export const exportResults = (params) => axios.get(`${API_URL}/api/sports-results/export`, { headers: auth(), params });

// Reports
export const tutorReport = (params) => axios.get(`${API_URL}/api/sports-reports/tutor`, { headers: auth(), params });
