import { useEffect, useState } from "react";
import axios from "axios";
import "./discipline.css";

function ParentDisciplinary() {
  const [records, setRecords] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const res = await axios.get(
          "http://localhost:5000/api/disciplinary/parent-view",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setRecords(res.data.records || []);
        setStudent(res.data.student || null);

      } catch (err) {
        console.log("PARENT DISCIPLINE ERROR:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="profile-container">
        <h2>Loading Student Details...</h2>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h2 className="title">Child Discipline Report</h2>

      {/* STUDENT INFO CARD */}
      {student && (
        <div className="card">
          <h3>{student.fullName}</h3>
          <p>Admission No: {student.admissionNo}</p>
          <p>Class: {student.className || "N/A"}</p>
        </div>
      )}

      {/* DISCIPLINARY RECORDS */}
      <div className="grid">
        {records.length === 0 ? (
          <div className="card">
            <p>No disciplinary records found </p>
          </div>
        ) : (
          records.map((r) => (
            <div className="card" key={r._id}>
              <h3>{r.category}</h3>

              <p>{r.remark}</p>

              <p style={{ marginTop: "10px", fontSize: "13px" }}>
                Status: <b>{r.status}</b>
              </p>

              {r.hodRemarks && (
                <p style={{ fontSize: "12px", color: "gray" }}>
                  HOD: {r.hodRemarks}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ParentDisciplinary;