import { useState, useEffect } from "react";
import axios from "axios";
import "./Leaves.css";

function LeaveRequest() {
  const token = localStorage.getItem("token");

  const [facultyList, setFacultyList] = useState([]);

  const [formData, setFormData] = useState({
    leaveType: "",
    reason: "",
    startDate: "",
    endDate: "",
    daysRequested: "",
    emergencyFlag: false,
    coverageFaculty: ""  
  });


  const fetchFaculty = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/auth/faculty",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setFacultyList(res.data.users);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5000/api/staffleave/request",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert(res.data.message);

      setFormData({
        leaveType: "",
        reason: "",
        startDate: "",
        endDate: "",
        daysRequested: "",
        emergencyFlag: false,
        coverageFaculty: ""
      });

    } catch (error) {
      alert(error.response?.data?.message || "Request failed");
    }
  };

  useEffect(() => {
  if (
    formData.startDate &&
    formData.endDate
  ) {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    const diff =
      Math.ceil(
        (end - start) /
          (1000 * 60 * 60 * 24)
      ) + 1;

    if (diff > 0) {
      setFormData((prev) => ({
        ...prev,
        daysRequested: diff
      }));
    }
  }
}, [
  formData.startDate,
  formData.endDate
]);

  return (
    <div className="workspace-container">
      <h1>Leave Request Form</h1>

      <form className="leave-form" onSubmit={handleSubmit}>

        <input
          type="text"
          name="leaveType"
          placeholder="Leave Type"
          value={formData.leaveType}
          onChange={handleChange}
          required
        />

        <textarea
          name="reason"
          placeholder="Reason"
          value={formData.reason}
          onChange={handleChange}
          required
        />

        <input
          type="date"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          required
        />

        <input
          type="date"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="daysRequested"
          placeholder="Days Requested"
          value={formData.daysRequested}
          onChange={handleChange}
          required
        />

{!formData.emergencyFlag && (
  <select
    name="coverageFaculty"
    value={formData.coverageFaculty}
    onChange={handleChange}
    required
  >
    <option value="">
      Select Coverage Faculty
    </option>

    {facultyList.map((faculty) => (
      <option
        key={faculty._id}
        value={faculty._id}
      >
        {faculty.fullName}
      </option>
    ))}
  </select>
)}

        <label>
          Emergency Leave
          <input
            type="checkbox"
            name="emergencyFlag"
            checked={formData.emergencyFlag}
            onChange={handleChange}
          />
        </label>

        <button type="submit">Submit Request</button>
      </form>
    </div>
  );
}

export default LeaveRequest;