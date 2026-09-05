import { useEffect, useState } from "react";
import axios from "axios";
import "./discipline.css";

function StudentDisciplinaryProfile() {
  const [records, setRecords] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/disciplinary/profile",
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        setRecords(res.data.records || []);
      } catch (err) {
        console.log(err);
      }
    };

    load();
  }, []);

  return (
    <div className="profile-container">
      <h2 className="title">Student Discipline Profile</h2>

      <div className="grid">
        {records.map((r) => (
          <div className="card" key={r._id}>
            <h3>{r.category}</h3>
            <p>{r.remark}</p>

            <span className="badge">
              APPROVED RECORD
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentDisciplinaryProfile;