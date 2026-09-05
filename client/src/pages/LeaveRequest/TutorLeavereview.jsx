import { useEffect, useState } from "react";
import axios from "axios";
import "./Leaves.css";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function TutorLeaveReview() {

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState({});

  const token =
    localStorage.getItem("token");

  // =========================
  // GET PROFILE PHOTO URL
  // =========================
  const getProfilePhotoUrl = (user) => {
    if (!user) return null;
    
    // GridFS profile photo
    if (user.profilePhoto && user.profilePhoto.fileId) {
      return `${API}/api/auth/photo/${user.profilePhoto.fileId}`;
    }
    
    // Fallback for old disk storage
    if (typeof user.profilePhoto === 'string' && user.profilePhoto) {
      return `${API}${user.profilePhoto}`;
    }
    
    return null;
  };

  // =========================
  // LOAD QUEUE
  // =========================
  const loadLeaves = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:5000/api/tutor-leaves/queue",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('📊 Loaded leaves:', res.data.leaves);
      
      setLeaves(res.data.leaves || []);
    } catch (err) {
      console.error("Error loading leaves:", err);
      alert(err.response?.data?.message || "Failed to load leaves");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  // =========================
  // APPROVE
  // =========================
  const approve = async (id) => {
    if (!window.confirm("Are you sure you want to approve this leave request?")) return;
    
    try {
      await axios.put(
        `http://localhost:5000/api/tutor-leaves/approve/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      alert("Leave request approved successfully!");
      loadLeaves();
    } catch (err) {
      console.error("Error approving leave:", err);
      alert(err.response?.data?.message || "Failed to approve leave");
    }
  };

  // =========================
  // REJECT
  // =========================
  const reject = async (id) => {
    const remarks =
      prompt("Reason for rejection?");
    if (remarks === null) return;
    if (!remarks.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/tutor-leaves/reject/${id}`,
        { remarks },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      alert("Leave request rejected successfully!");
      loadLeaves();
    } catch (err) {
      console.error("Error rejecting leave:", err);
      alert(err.response?.data?.message || "Failed to reject leave");
    }
  };

  // =========================
  // ATTENDANCE COLOR
  // =========================
  const getAttendanceClass = (percent) => {
    if (percent === undefined || percent === null) return "";
    return percent >= 75 ? "attendance-green" : "attendance-warning";
  };

  // =========================
  // GET STATUS BADGE CLASS
  // =========================
  const getStatusClass = (status) => {
    const statusMap = {
      'pending': 'status-pending',
      'approved': 'status-approved',
      'rejected': 'status-rejected',
      'cancelled': 'status-cancelled'
    };
    return statusMap[status?.toLowerCase()] || 'status-pending';
  };

  // =========================
  // FORMAT DATE
  // =========================
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  // =========================
  // HANDLE IMAGE ERROR
  // =========================
  const handleImageError = (studentId) => {
    setImageErrors(prev => ({
      ...prev,
      [studentId]: true
    }));
  };

  // =========================
  // RENDER
  // =========================
  if (loading) {
    return (
      <div className="my-leaves-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading leave requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-leaves-container">
      <div className="page-header">
        <h2>Tutor Leave Queue</h2>
        <span className="request-count">
          {leaves.length} pending request{leaves.length !== 1 ? 's' : ''}
        </span>
      </div>

      <table className="leaves-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Type</th>
            <th>Days</th>
            <th>Dates</th>
            <th>Attendance %</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {leaves.length === 0 ? (
            <tr>
              <td colSpan="7" className="no-leaves">
                <div className="empty-state">
                  <span className="empty-icon">📋</span>
                  <p>No pending leave requests</p>
                  <small>All caught up!</small>
                </div>
              </td>
            </tr>
          ) : (
            leaves.map((leave) => {
              const attendance = leave.student?.attendancePercentage || 0;
              const student = leave.student || {};
              const user = student.user || {};
              
              // Get profile photo URL
              const photoUrl = getProfilePhotoUrl(user);
              const hasImageError = imageErrors[student._id];
              
              console.log(`📸 Student: ${student.fullName}, Photo URL:`, photoUrl);

              return (
                <tr key={leave._id}>
                  {/* ===========================
                      STUDENT WITH PHOTO
                  =========================== */}
                  <td>
                    <div className="student-info">
                      {photoUrl && !hasImageError ? (
                        <img
                          className="student-avatar"
                          src={photoUrl}
                          alt={student.fullName || 'Student'}
                          onError={() => handleImageError(student._id)}
                          loading="lazy"
                        />
                      ) : (
                        <div className="student-avatar-placeholder">
                          {(student.fullName || 'S').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="student-details">
                        <strong>
                          {student.fullName || 'Unknown Student'}
                        </strong>
                        <br/>
                        <small>
                          Admission No: {student.admissionNo || 'N/A'}
                        </small>
                        <br/>
                        <small>
                          {student.department || 'No Department'}
                        </small>
                      </div>
                    </div>
                  </td>

                  {/* Leave Type */}
                  <td>
                    <span className="leave-type-badge">
                      {leave.leaveType || 'N/A'}
                    </span>
                  </td>

                  {/* Days */}
                  <td className="days-cell">
                    {leave.daysRequested || leave.days || 0}
                  </td>

                  {/* Dates */}
                  <td className="dates-cell">
                    <div>
                      <span className="date-label">From:</span>
                      {formatDate(leave.startDate)}
                    </div>
                    <div>
                      <span className="date-label">To:</span>
                      {formatDate(leave.endDate)}
                    </div>
                  </td>

                  {/* Attendance */}
                  <td className={getAttendanceClass(attendance)}>
                    {attendance}%
                  </td>

                  {/* Status */}
                  <td>
                    <span className={`status-badge ${getStatusClass(leave.status)}`}>
                      {leave.status || 'Pending'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td>
                    <button
                      className="approve-btn"
                      onClick={() => approve(leave._id)}
                    >
                      Approve
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => reject(leave._id)}
                    >
                      Reject
                    </button>
                    {leave.remarks && (
                      <button
                        className="remarks-btn"
                        onClick={() => alert(`Remarks: ${leave.remarks}`)}
                        title="View remarks"
                      >
                        💬
                      </button>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div className="table-footer">
        <button className="refresh-btn" onClick={loadLeaves}>
          🔄 Refresh
        </button>
      </div>
    </div>
  );
}

export default TutorLeaveReview;