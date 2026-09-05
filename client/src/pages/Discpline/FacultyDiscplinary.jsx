import { useState, useMemo } from "react";
import axios from "axios";
import debounce from "lodash.debounce";
import "./discipline.css";

function FacultyDisciplinary() {
  const [form, setForm] = useState({
    studentId: "",
    remark: "",
    category: "MINOR"
  });

  const [students, setStudents] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchText, setSearchText] = useState("");

  const token = localStorage.getItem("token");

  // 🔥 SEARCH API
  const searchStudents = async (text) => {
    if (!text) {
      setStudents([]);
      setShowDropdown(false);
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:5000/api/student/search?q=${text}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setStudents(res.data.students || []);
      setShowDropdown(true);
    } catch (err) {
      console.log("Search error:", err.message);
    }
  };

  // 🔥 STABLE DEBOUNCE (IMPORTANT FIX)
  const debouncedSearch = useMemo(
    () => debounce(searchStudents, 300),
    []
  );

  const handleSearch = (text) => {
    setSearchText(text);
    debouncedSearch(text);
  };

  const selectStudent = (student) => {
    setForm({
      ...form,
      studentId: student._id 
    });

    setSearchText(`${student.fullName} (${student.admissionNo})`);
    setShowDropdown(false);
    setStudents([]);
  };

  const submit = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/disciplinary/create",
        form,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert("Draft submitted to HOD");

      // reset
      setForm({
        studentId: "",
        remark: "",
        category: "MINOR"
      });

      setSearchText("");

    } catch (err) {
      alert(err.response?.data?.message || "Error submitting");
    }
  };

  return (
    <div className="leave-form">
      <h2>Disciplinary Action</h2>

      {/* SEARCH INPUT */}
      <input
        value={searchText}
        placeholder="Search student (Name or Admission No)"
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => {
          if (students.length > 0) setShowDropdown(true);
        }}
      />

      {/* DROPDOWN */}
      {showDropdown && students.length > 0 && (
        <div className="dropdown">
          {students.map((student) => (
            <div
              key={student._id}
              className="dropdown-item"
              onClick={() => selectStudent(student)}
            >
              <strong>{student.fullName}</strong>
              <span> ({student.admissionNo})</span>
            </div>
          ))}
        </div>
      )}

      {/* CATEGORY */}
      <select
        value={form.category}
        onChange={(e) =>
          setForm({ ...form, category: e.target.value })
        }
      >
        <option value="MINOR">MINOR</option>
        <option value="MAJOR">MAJOR</option>
        <option value="WARNING">WARNING</option>
      </select>

      {/* REMARK */}
      <textarea
        placeholder="Remark"
        onChange={(e) =>
          setForm({ ...form, remark: e.target.value })
        }
      />

      <button onClick={submit}>Submit</button>
    </div>
  );
}

export default FacultyDisciplinary;