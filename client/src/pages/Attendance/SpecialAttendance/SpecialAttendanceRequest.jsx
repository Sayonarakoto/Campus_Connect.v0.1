import {
    useEffect,
    useState
} from "react";

import {
    useParams,
    useNavigate
} from "react-router-dom";

import axios from "axios";

import "./SpecialAttendance.css";

function SpecialAttendanceRequest() {

    const {
        attendanceId
    } = useParams();

    const navigate = useNavigate();

    const [attendance, setAttendance] = useState(null);
    const [reason, setReason] = useState("");
    const [reasonType, setReasonType] = useState("medical");
    const [newStatus, setNewStatus] = useState("present");
    const [semesterFilter, setSemesterFilter] = useState("");
    const [semesters, setSemesters] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentsAttendance, setStudentsAttendance] = useState([]);

    const token = localStorage.getItem("token");

    useEffect(() => {
        console.log("SPECIAL ATTENDANCE PAGE LOADED");
        console.log("ATTENDANCE ID:", attendanceId);
        console.log("TOKEN:", token);

        fetchAttendance();
        fetchSemesters();
    }, [attendanceId]);

    const fetchSemesters = async () => {
        try {
            const res = await axios.get(
                "http://localhost:5000/api/attendance/semesters",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setSemesters(res.data.semesters || []);
            if (res.data.semesters && res.data.semesters.length > 0) {
                setSemesterFilter(res.data.semesters[0]);
            }
        } catch (error) {
            console.log("SEMESTERS LOAD ERROR:", error.response?.data || error.message);
        }
    };

    const fetchAttendance = async () => {
        try {
            console.log("Calling attendance API...");

            const res = await axios.get(
                `http://localhost:5000/api/attendance/record/${attendanceId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log("SERVER RESPONSE:", res.data);
            setAttendance(res.data.attendance);
            
            // If the response contains multiple students, set them
            if (res.data.students) {
                setStudentsAttendance(res.data.students);
            } else if (res.data.attendance) {
                // If it's a single attendance record, wrap it
                setStudentsAttendance([res.data.attendance]);
            }

        } catch (error) {
            console.log("ATTENDANCE LOAD ERROR:", error.response?.data || error.message);
        }
    };

    const fetchStudentsBySemester = async (semester) => {
        try {
            const res = await axios.get(
                `http://localhost:5000/api/attendance/students/semester/${semester}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setStudentsAttendance(res.data.students || []);
            setSemesterFilter(semester);
        } catch (error) {
            console.log("STUDENTS BY SEMESTER ERROR:", error.response?.data || error.message);
        }
    };

    const submitRequest = async () => {
        try {
            // If a specific student is selected, submit for that student
            const studentId = selectedStudent?._id || attendance?.student?._id;
            
            if (!studentId) {
                alert("No student selected");
                return;
            }

            await axios.post(
                "http://localhost:5000/api/attendance/correction/request",
                {
                    attendanceRecordId: attendance?._id,
                    student: studentId,
                    date: attendance?.date,
                    hour: attendance?.hour,
                    reason,
                    reasonType,
                    newStatus,
                    semester: semesterFilter // Include semester in the request
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert("Special attendance request submitted");
            navigate(-1);

        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Request failed"
            );
        }
    };

    const handleStudentSelect = (student) => {
        setSelectedStudent(student);
        // Update attendance with selected student's data
        if (student) {
            setAttendance({
                ...attendance,
                student: student
            });
        }
    };

    if (!attendance && studentsAttendance.length === 0) {
        return (
            <h3>
                Loading attendance record...
            </h3>
        );
    }

    // Group students by semester for display
    const studentsBySemester = studentsAttendance.reduce((acc, student) => {
        const semester = student.semester || "Unknown";
        if (!acc[semester]) {
            acc[semester] = [];
        }
        acc[semester].push(student);
        return acc;
    }, {});

    // Get unique semesters from the data
    const uniqueSemesters = Object.keys(studentsBySemester);

    return (
        <div className="workspace-container">
            <h2>
                Request Special Attendance
            </h2>

            {/* Semester Filter */}
            <div className="module-card">
                <h3>Filter by Semester</h3>
                <div className="semester-filter">
                    <select
                        value={semesterFilter}
                        onChange={(e) => {
                            setSemesterFilter(e.target.value);
                            fetchStudentsBySemester(e.target.value);
                        }}
                    >
                        <option value="">All Semesters</option>
                        {semesters.length > 0 ? (
                            semesters.map((sem) => (
                                <option key={sem} value={sem}>
                                    Semester {sem}
                                </option>
                            ))
                        ) : (
                            uniqueSemesters.map((sem) => (
                                <option key={sem} value={sem}>
                                    {sem}
                                </option>
                            ))
                        )}
                    </select>
                </div>
            </div>

            {/* Student Details - Semester Wise */}
            <div className="module-card">
                <h3>Student Details</h3>
                
                {Object.keys(studentsBySemester).length > 0 ? (
                    Object.entries(studentsBySemester).map(([semester, students]) => (
                        <div key={semester} className="semester-section">
                            <h4>Semester: {semester}</h4>
                            <div className="student-list">
                                {students.map((student, index) => (
                                    <div 
                                        key={student._id || index}
                                        className={`student-item ${selectedStudent?._id === student._id ? 'selected' : ''}`}
                                        onClick={() => handleStudentSelect(student)}
                                    >
                                        <div className="student-info">
                                            <span className="student-name">
                                                {student.fullName || student.name}
                                            </span>
                                            <span className="student-admission">
                                                Admission: {student.admissionNo}
                                            </span>
                                            <span className="student-status">
                                                Status: {student.status || 'Present'}
                                            </span>
                                            <span className="student-date">
                                                Date: {student.date ? new Date(student.date).toLocaleDateString() : 'N/A'}
                                            </span>
                                            <span className="student-hour">
                                                Hour: {student.hour || 'N/A'}
                                            </span>
                                        </div>
                                        <button 
                                            className="select-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStudentSelect(student);
                                            }}
                                        >
                                            Select
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No students found for this semester</p>
                )}

                {selectedStudent && (
                    <div className="selected-student">
                        <h4>Selected Student</h4>
                        <p>Name: {selectedStudent.fullName || selectedStudent.name}</p>
                        <p>Admission No: {selectedStudent.admissionNo}</p>
                        <p>Semester: {selectedStudent.semester || semesterFilter}</p>
                    </div>
                )}
            </div>

            {/* Request Form */}
            <div className="module-card">
                <label>
                    Reason Type
                </label>
                <select
                    value={reasonType}
                    onChange={e => setReasonType(e.target.value)}
                >
                    <option value="medical">Medical</option>
                    <option value="sports">Sports Duty</option>
                    <option value="official_duty">Official Duty</option>
                    <option value="event">Event</option>
                </select>

                <label>
                    New Attendance Status
                </label>
                <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                >
                    <option value="present">Present</option>
                    <option value="special_excused">Special Excused</option>
                    <option value="medical">Medical</option>
                    <option value="official_duty">Official Duty</option>
                </select>

                <label>
                    Mandatory Reason
                </label>
                <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Enter reason (minimum 10 characters)..."
                />

                <button
                    onClick={submitRequest}
                    disabled={reason.length < 10 || !selectedStudent}
                >
                    Submit Request for {selectedStudent ? selectedStudent.fullName || selectedStudent.name : 'Selected Student'}
                </button>
                {!selectedStudent && (
                    <p className="warning-text">Please select a student first</p>
                )}
            </div>
        </div>
    );
}

export default SpecialAttendanceRequest;