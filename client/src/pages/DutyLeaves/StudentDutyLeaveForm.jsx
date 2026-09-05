import { useState } from "react";
import axios from "axios";

function StudentDutyLeaveForm() {

  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    eventName: "",
    dutyType: "Hackathon",
    organizer: "",
    location: "",
    fromDate: "",
    toDate: "",
    remarks: "",
    proofFile: null
  });

  const submit = async (e) => {

    e.preventDefault();

    try {

      const data = new FormData();

      data.append("eventName", form.eventName);
      data.append("dutyType", form.dutyType);
      data.append("organizer", form.organizer);
      data.append("location", form.location);
      data.append("fromDate", form.fromDate);
      data.append("toDate", form.toDate);
      data.append("remarks", form.remarks);

      if (form.proofFile) {
        data.append("proofFile", form.proofFile);
      }

      await axios.post(
        "http://localhost:5000/api/duty-leaves/apply",
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
                    }
        }
      );

      alert("Duty Leave Submitted");

      setForm({
        eventName: "",
        dutyType: "Hackathon",
        organizer: "",
        location: "",
        fromDate: "",
        toDate: "",
        remarks: "",
        proofFile: null
      });

    } catch (err) {

      console.log(err.response);

      alert(
        err.response?.data?.message ||
        "Submission Failed"
      );
    }

  };

  return (

    <div className="container mt-4">

      <h2>Apply Duty Leave</h2>

      <form onSubmit={submit}>

        <div className="mb-3">
          <label>Event Name</label>

          <input
            className="form-control"
            value={form.eventName}
            onChange={(e)=>
              setForm({
                ...form,
                eventName:e.target.value
              })
            }
            required
          />
        </div>

        <div className="mb-3">
          <label>Duty Type</label>

          <select
            className="form-control"
            value={form.dutyType}
            onChange={(e)=>
              setForm({
                ...form,
                dutyType:e.target.value
              })
            }
          >
            <option>Sports</option>
            <option>Hackathon</option>
            <option>NSS</option>
            <option>Placement</option>
            <option>Industrial Visit</option>
            <option>Workshop</option>
            <option>Seminar</option>
            <option>Competition</option>
            <option>Cultural</option>
            <option>Other</option>
          </select>
        </div>

        <div className="mb-3">
          <label>Organizer</label>

          <input
            className="form-control"
            value={form.organizer}
            onChange={(e)=>
              setForm({
                ...form,
                organizer:e.target.value
              })
            }
          />
        </div>

        <div className="mb-3">
          <label>Location</label>

          <input
            className="form-control"
            value={form.location}
            onChange={(e)=>
              setForm({
                ...form,
                location:e.target.value
              })
            }
          />
        </div>

        <div className="mb-3">
          <label>From Date</label>

          <input
            type="date"
            className="form-control"
            value={form.fromDate}
            onChange={(e)=>
              setForm({
                ...form,
                fromDate:e.target.value
              })
            }
            required
          />
        </div>

        <div className="mb-3">
          <label>To Date</label>

          <input
            type="date"
            className="form-control"
            value={form.toDate}
            onChange={(e)=>
              setForm({
                ...form,
                toDate:e.target.value
              })
            }
            required
          />
        </div>

        <div className="mb-3">
          <label>Remarks</label>

          <textarea
            rows="4"
            className="form-control"
            value={form.remarks}
            onChange={(e)=>
              setForm({
                ...form,
                remarks:e.target.value
              })
            }
          />
        </div>

        <div className="mb-3">

          <label>Upload Proof (PDF / JPG / PNG)</label>

          <input
            type="file"
            className="form-control"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e)=>
              setForm({
                ...form,
                proofFile:e.target.files[0]
              })
            }
          />

        </div>

        <button className="btn btn-primary">
          Submit Duty Leave
        </button>

      </form>

    </div>

  );

}

export default StudentDutyLeaveForm;