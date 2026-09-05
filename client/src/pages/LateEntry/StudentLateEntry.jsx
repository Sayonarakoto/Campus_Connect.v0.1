import { useState } from "react";
import axios from "axios";
import "./LateEntry.css";

function StudentLateEntryForm() {

  const token =
    localStorage.getItem("token");

  const [form, setForm] = useState({

    date: "",

    arrivalTime: "",

    reason: ""

  });

  const submit = async (e) => {

    e.preventDefault();

    try {

      await axios.post(

        "http://localhost:5000/api/late-entry/submit",

        form,

        {

          headers: {

            Authorization:
              `Bearer ${token}`

          }

        }

      );

      alert(
        "Late entry submitted successfully."
      );

      setForm({

        date: "",

        arrivalTime: "",

        reason: ""

      });

    }

    catch (err) {

      alert(

        err.response?.data?.message ||

        "Submission failed"

      );

    }

  };

  return (

    <form
      className="late-form"
      onSubmit={submit}
    >

      <h2>
        Late Entry Application
      </h2>

      <label>Date</label>

      <input

        type="date"

        value={form.date}

        onChange={(e)=>

          setForm({

            ...form,

            date:
              e.target.value

          })

        }

        required

      />

      <label>
        Arrival Time
      </label>

      <input

        type="time"

        value={form.arrivalTime}

        onChange={(e)=>

          setForm({

            ...form,

            arrivalTime:
              e.target.value

          })

        }

        required

      />

      <label>
        Reason
      </label>

      <textarea

        rows="5"

        value={form.reason}

        onChange={(e)=>

          setForm({

            ...form,

            reason:
              e.target.value

          })

        }

        placeholder="Explain why you arrived late..."

        required

      />

      <button>

        Submit Late Entry

      </button>

    </form>

  );

}

export default StudentLateEntryForm;