import { useEffect, useState } from "react";
import axios from "axios";

function HodDisciplinaryQueue() {
  const [list, setList] = useState([]);

  const token = localStorage.getItem("token");

  const load = async () => {
    const res = await axios.get(
      "http://localhost:5000/api/disciplinary/hod-queue",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setList(res.data.list);
  };

  useEffect(() => {
    load();
  }, []);

  const action = async (id, type) => {
    const remarks = prompt("HOD remarks");

    await axios.put(
      `http://localhost:5000/api/disciplinary/hod/${id}`,
      { action: type, remarks },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    load();
  };

  return (
    <div className="admin-grid">
      <h2>HOD Disciplinary Queue</h2>

      {list.map((item) => (
        <div className="admin-card" key={item._id}>
          <h3>{item.studentId.fullName}</h3>
          <p>{item.remark}</p>

          <div className="action-buttons">
            <button
              className="approve-btn"
              onClick={() => action(item._id, "APPROVE")}
            >
              Approve
            </button>

            <button
              className="reject-btn"
              onClick={() => action(item._id, "REJECT")}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default HodDisciplinaryQueue;