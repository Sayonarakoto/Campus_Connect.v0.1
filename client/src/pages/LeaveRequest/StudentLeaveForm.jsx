import { useState }from "react";
import axios from "axios";
import "./Leaves.css"

function StudentLeaveForm() {

  const [form,
    setForm] =
    useState({
      leaveType:
        "casual",
      fromDate: "",
      toDate: "",
      reason: ""
    });

  const token =
    localStorage
      .getItem("token");

  const submit =
    async (e) => {

      e.preventDefault();

      try {

        await axios.post(
          "http://localhost:5000/api/student-leaves/apply",
          form,
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

        alert(
          "Leave Submitted"
        );

      } catch (err) {

        alert(
          err.response?.data?.message
        );

      }
    };

  return (
   <form className="leave-form" onSubmit={submit}>

      <h2>
        Apply Leave
      </h2>

      <select
        value={
          form.leaveType
        }
        onChange={(e)=>
          setForm({
            ...form,
            leaveType:
              e.target.value
          })
        }
      >
        <option value="casual">
          Casual
        </option>

        <option value="medical">
          Medical
        </option>
      </select>

      <input
        type="date"
        onChange={(e)=>
          setForm({
            ...form,
            fromDate:
              e.target.value
          })
        }
      />

      <input
        type="date"
        onChange={(e)=>
          setForm({
            ...form,
            toDate:
              e.target.value
          })
        }
      />

      <textarea
        placeholder="Reason"
        onChange={(e)=>
          setForm({
            ...form,
            reason:
              e.target.value
          })
        }
      />

      <button>
        Submit
      </button>

    </form>
  );
}

export default
StudentLeaveForm;