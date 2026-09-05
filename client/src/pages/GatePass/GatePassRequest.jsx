import { useState, useEffect } from "react";
import axios from "axios";
import "./Gate.css";

function GatePassRequest() {
  const [formData, setFormData] = useState({
    purpose: "",
    departureTime: "",
    returnTime: "",
    selectedApproverRole: "faculty", // "faculty", "hod", "other"
    selectedApproverId: ""
  });

  const [approvers, setApprovers] = useState({
    hod: [],
    faculty: []
  });
  
  const [loading, setLoading] = useState(false);
  const [fetchingApprovers, setFetchingApprovers] = useState(true);

  // Fetch available approvers when component mounts
  useEffect(() => {
    fetchApprovers();
  }, []);

  const fetchApprovers = async () => {
    try {
      setFetchingApprovers(true);
      const token = localStorage.getItem("token");
      
      const response = await axios.get(
        "http://localhost:5000/api/gatepass/approvers",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setApprovers({
        hod: response.data.hod || [],
        faculty: response.data.faculty || []
      });
    } catch (error) {
      console.error("Error fetching approvers:", error);
      // If error, set empty arrays
      setApprovers({ hod: [], faculty: [] });
    } finally {
      setFetchingApprovers(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // Validate that if "other" is selected, a faculty is chosen
      if (formData.selectedApproverRole === "other" && !formData.selectedApproverId) {
        alert("Please select a faculty member");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        "http://localhost:5000/api/gatepass/request",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert(response.data.message || "Gate pass request submitted successfully!");

      // Reset form
      setFormData({
        purpose: "",
        departureTime: "",
        returnTime: "",
        selectedApproverRole: "faculty",
        selectedApproverId: ""
      });
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Failed to submit gate pass request"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gate-container">
      <h2 className="gate-title">
        Gate Pass Request
      </h2>

      <form
        className="gate-form"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          name="purpose"
          placeholder="Purpose of Leave"
          value={formData.purpose}
          onChange={handleChange}
          required
        />

        <input
          type="datetime-local"
          name="departureTime"
          value={formData.departureTime}
          onChange={handleChange}
          required
        />

        <input
          type="datetime-local"
          name="returnTime"
          value={formData.returnTime}
          onChange={handleChange}
          required
        />

        {/* Approver Selection Section */}
        <div className="approver-section">
          <label className="approver-label">Select Approver:</label>
          
          <div className="approver-options">
            <label className="approver-option">
              <input
                type="radio"
                name="selectedApproverRole"
                value="faculty"
                checked={formData.selectedApproverRole === "faculty"}
                onChange={handleChange}
              />
              Faculty Advisor
            </label>
            
            <label className="approver-option">
              <input
                type="radio"
                name="selectedApproverRole"
                value="hod"
                checked={formData.selectedApproverRole === "hod"}
                onChange={handleChange}
              />
              HOD
            </label>
            
            <label className="approver-option">
              <input
                type="radio"
                name="selectedApproverRole"
                value="other"
                checked={formData.selectedApproverRole === "other"}
                onChange={handleChange}
              />
              Other Authorized Faculty
            </label>
          </div>

          {/* Show faculty dropdown if "other" is selected */}
          {formData.selectedApproverRole === "other" && (
            <div className="faculty-select-container">
              <label className="faculty-select-label">
                Select Faculty Member:
              </label>
              <select
                name="selectedApproverId"
                className="faculty-select"
                value={formData.selectedApproverId}
                onChange={handleChange}
                required
              >
                <option value="">-- Select a faculty member --</option>
                {approvers.faculty.length > 0 ? (
                  approvers.faculty.map((faculty) => (
                    <option key={faculty._id} value={faculty._id}>
                      {faculty.fullName} - {faculty.email}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No faculty members available
                  </option>
                )}
              </select>
            </div>
          )}

          {/* Show selected approver info */}
          {formData.selectedApproverRole === "hod" && approvers.hod.length > 0 && (
            <div className="selected-approver-info">
              <span className="info-badge">
                HOD: {approvers.hod[0]?.fullName || "Not assigned"}
              </span>
            </div>
          )}

          {formData.selectedApproverRole === "faculty" && (
            <div className="selected-approver-info">
              <span className="info-badge">
                Will be assigned to faculty advisor
              </span>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}

export default GatePassRequest;