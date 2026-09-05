import { useEffect, useState } from "react";
import axios from "axios";
import "./SpecialAttendance.css";

function SpecialAttendanceDashboard() {

  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("");
  const [reason, setReason] = useState("");
  const [reasonType, setReasonType] = useState("medical");
  const [loading, setLoading] = useState(false);
  const [semesterFilter, setSemesterFilter] = useState("");
  const [semesters, setSemesters] = useState([]);
  const [studentsBySemester, setStudentsBySemester] = useState({});

  useEffect(() => {
    fetchStudents();
  }, []);

  // =============================
  // LOAD STUDENTS
  // =============================

  const fetchStudents = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/attendance/students",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      const studentData = res.data.students || [];
      setStudents(studentData);
      
      // Group students by semester
      const grouped = groupStudentsBySemester(studentData);
      setStudentsBySemester(grouped);
      
      // Extract unique semesters
      const uniqueSemesters = Object.keys(grouped).sort();
      setSemesters(uniqueSemesters);
      
      // Set default filter to first semester if available
      if (uniqueSemesters.length > 0) {
        setSemesterFilter(uniqueSemesters[0]);
        setFilteredStudents(grouped[uniqueSemesters[0]] || []);
      } else {
        setFilteredStudents(studentData);
      }

    } catch (error) {
      console.log(error);
      alert("Failed to fetch students");
    }
  };

  // =============================
  // GROUP STUDENTS BY SEMESTER
  // =============================

  const groupStudentsBySemester = (studentList) => {
    return studentList.reduce((acc, student) => {
      const semester = student.semester || "Unknown";
      if (!acc[semester]) {
        acc[semester] = [];
      }
      acc[semester].push(student);
      return acc;
    }, {});
  };

  // =============================
  // HANDLE SEMESTER FILTER CHANGE
  // =============================

  const handleSemesterFilter = (semester) => {
    setSemesterFilter(semester);
    if (semester === "all") {
      setFilteredStudents(students);
    } else {
      setFilteredStudents(studentsBySemester[semester] || []);
    }
    // Reset selected student when filter changes
    setSelectedStudent(null);
  };

  // =============================
  // SUBMIT SPECIAL ATTENDANCE
  // =============================

  const submitRequest = async () => {
    if (!date || !hour) {
      alert("Please select date and hour");
      return;
    }

    if (reason.trim().length < 10) {
      alert("Reason must contain minimum 10 characters");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        "http://localhost:5000/api/attendance/correction/request",
        {
          student: selectedStudent._id,
          date,
          hour: Number(hour),
          reason,
          reasonType,
          newStatus: "present",
          semester: selectedStudent.semester // Include semester in request
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      alert("Special attendance request submitted");
      setDate("");
      setHour("");
      setReason("");
      setSelectedStudent(null);

    } catch (error) {
      console.log(error);
      alert(
        error.response?.data?.message ||
        "Request failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // RENDER STUDENTS BY SEMESTER
  // =============================

  const renderStudentsBySemester = () => {
    if (semesterFilter === "all") {
      // Show all students grouped by semester
      return Object.entries(studentsBySemester).map(([semester, studentList]) => (
        <div key={semester} className="semester-section">
          <h3 className="semester-title">Semester {semester}</h3>
          <div className="dashboard-grid">
            {studentList.map(student => (
              <div
                className="module-card student-card"
                key={student._id}
                onClick={() => setSelectedStudent(student)}
              >
                <h4>{student.fullName}</h4>
                <p>Admission No: {student.admissionNo}</p>
                <p>Semester: {student.semester}</p>
                <p>Department: {student.department}</p>
                <div className="student-badge">
                  <span className="badge">{student.semester}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ));
    } else {
      // Show filtered students
      const semesterStudents = studentsBySemester[semesterFilter] || [];
      return (
        <div className="semester-section">
          <h3 className="semester-title">Semester {semesterFilter}</h3>
          <div className="dashboard-grid">
            {semesterStudents.map(student => (
              <div
                className="module-card student-card"
                key={student._id}
                onClick={() => setSelectedStudent(student)}
              >
                <h4>{student.fullName}</h4>
                <p>Admission No: {student.admissionNo}</p>
                <p>Semester: {student.semester}</p>
                <p>Department: {student.department}</p>
                <div className="student-badge">
                  <span className="badge">{student.semester}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="workspace-container">
      <h2>Special Attendance Request</h2>

      {!selectedStudent ? (
        <>
          <div className="filter-section">
            <h3>Select Student</h3>
            
            {/* Semester Filter */}
            <div className="semester-filter-container">
              <label>Filter by Semester:</label>
              <select
                value={semesterFilter}
                onChange={(e) => handleSemesterFilter(e.target.value)}
                className="semester-filter-select"
              >
                <option value="all">All Semesters</option>
                {semesters.map(sem => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
              
              <span className="student-count">
                {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
              </span>
            </div>
          </div>

          {/* Student Grid - Semester Wise */}
          <div className="students-container">
            {filteredStudents.length > 0 ? (
              renderStudentsBySemester()
            ) : (
              <div className="no-students">
                <p>No students found for this semester</p>
              </div>
            )}
          </div>
        </>
      ) : (
        // Selected Student Form
        <div className="module-card">
          <div className="selected-student-header">
            <h3>Student Profile</h3>
            <button 
              className="back-btn"
              onClick={() => setSelectedStudent(null)}
            >
              ← Back to Students
            </button>
          </div>
          
          <div className="student-profile-info">
            <div className="info-row">
              <span className="label">Name:</span>
              <span className="value">{selectedStudent.fullName}</span>
            </div>
            <div className="info-row">
              <span className="label">Admission No:</span>
              <span className="value">{selectedStudent.admissionNo}</span>
            </div>
            <div className="info-row">
              <span className="label">Semester:</span>
              <span className="value semester-badge">{selectedStudent.semester}</span>
            </div>
            <div className="info-row">
              <span className="label">Department:</span>
              <span className="value">{selectedStudent.department}</span>
            </div>
          </div>

          <hr />

          <h3>Attendance Request Details</h3>

          <label>Select Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />

          <label>Select Hour</label>
          <select
            value={hour}
            onChange={e => setHour(e.target.value)}
          >
            <option value="">Select Hour</option>
            <option value="1">Hour 1</option>
            <option value="2">Hour 2</option>
            <option value="3">Hour 3</option>
            <option value="4">Hour 4</option>
            <option value="5">Hour 5</option>
            <option value="6">Hour 6</option>
            <option value="7">Hour 7</option>
            <option value="8">Hour 8</option>
          </select>

          <label>Reason Type</label>
          <select
            value={reasonType}
            onChange={e => setReasonType(e.target.value)}
          >
            <option value="medical">Medical Room Visit</option>
            <option value="sports">Sports Representation</option>
            <option value="official">Official Duty</option>
            <option value="event">College Event</option>
          </select>

          <label>Mandatory Reason</label>
          <textarea
            placeholder="Example: Medical room visit during second hour"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />

          <button
            disabled={loading}
            onClick={submitRequest}
            className="submit-btn"
          >
            {loading ? "Submitting..." : "Request Special Attendance"}
          </button>
        </div>
      )}
    </div>
  );
}

export default SpecialAttendanceDashboard;