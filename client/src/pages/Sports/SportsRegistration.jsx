import { useEffect, useState } from "react";
import axios from "axios";
import "./SportsRegistration.css";

function SportsRegistration() {

  const token = localStorage.getItem("token");

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [studentHouse, setStudentHouse] = useState("");
  const [selectedHouse, setSelectedHouse] = useState("");

  const HOUSES = [
    "Green House",
    "Blue House",
    "Red House",
    "Yellow House"
  ];

  useEffect(() => {
    loadProfile();
    loadEvents();
  }, []);

  // ==========================
  // LOAD STUDENT PROFILE
  // ==========================
  const loadProfile = async () => {

    try {

      const res = await axios.get(
        "http://localhost:5000/api/student-sports/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setStudentHouse(res.data.profile.house || "");

    } catch (err) {

      console.error(err);

    }

  };

  // ==========================
  // LOAD EVENTS
  // ==========================
  const loadEvents = async () => {

    try {

      const res = await axios.get(
        "http://localhost:5000/api/student-sports/events",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setEvents(res.data.events || []);

    } catch (err) {

      alert(
        err.response?.data?.message ||
        "Unable to load events."
      );

    } finally {

      setLoading(false);

    }

  };

  // ==========================
  // REGISTER
  // ==========================
  const register = async (eventId) => {

    try {

      // Only ask for house if student doesn't already have one
      if (!studentHouse && !selectedHouse) {

        alert("Please select your Sports House.");

        return;

      }

      const payload = {

        eventId

      };

      if (!studentHouse) {

        payload.house = selectedHouse;

      }

      await axios.post(
        "http://localhost:5000/api/student-sports/register",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("Registration Successful");

      if (!studentHouse) {

        setStudentHouse(selectedHouse);

      }

      loadEvents();

    } catch (err) {

      alert(
        err.response?.data?.message ||
        "Registration Failed"
      );

    }

  };

  return (

    <div className="sports-registration">

      <h1>Sports Registration</h1>

      <p className="page-subtitle">
        Register for available sports events.
      </p>

      {/* ==========================
          HOUSE SELECTION
      ========================== */}

      {!studentHouse && (

        <div className="house-selection-card">

          <h3>Select Your Sports House</h3>

          <p>
            This can only be selected once.
          </p>

          <select
            value={selectedHouse}
            onChange={(e) =>
              setSelectedHouse(e.target.value)
            }
          >

            <option value="">
              Select House
            </option>

            {HOUSES.map((house) => (

              <option
                key={house}
                value={house}
              >
                {house}
              </option>

            ))}

          </select>

        </div>

      )}

      {studentHouse && (

        <div className="house-selection-card selected">

          <strong>
            Your Sports House:
          </strong>{" "}
          {studentHouse}

        </div>

      )}

      {/* ==========================
          EVENTS
      ========================== */}

      {loading ? (

        <p>Loading events...</p>

      ) : (

        <div className="events-grid">

          {events.length === 0 ? (

            <div className="empty-card">

              No active sports events available.

            </div>

          ) : (

            events.map((event) => (

              <div
                key={event._id}
                className="event-card"
              >

                <h3>{event.eventName}</h3>

                <p>
                  <strong>Category:</strong>{" "}
                  {event.category}
                </p>

                <p>
                  <strong>Gender:</strong>{" "}
                  {event.gender}
                </p>

                <p>
                  <strong>Academic Year:</strong>{" "}
                  {event.academicYear}
                </p>

                <button
                  className="register-btn"
                  onClick={() =>
                    register(event._id)
                  }
                >

                  Register

                </button>

              </div>

            ))

          )}

        </div>

      )}

    </div>

  );

}

export default SportsRegistration;