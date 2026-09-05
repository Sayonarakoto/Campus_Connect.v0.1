import { useEffect, useState } from "react";
import axios from "axios";

function SportsEventManagement() {


  
  const token = localStorage.getItem("token");

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({

    eventName: "",

    category: "Track",

    eventType: "Individual",

    gender: "Male",

    academicYear: "2026-2027",

    maxParticipants: 1,

    venue: "",

    eventDate: "",

    registrationDeadline: "",

    eventStatus: "REGISTRATION_OPEN",

    pointsRule: {

      first: 10,

      second: 7,

      third: 5,

      participation: 2

    }

  });

  useEffect(() => {

    fetchEvents();

  }, []);

  // =========================
  // FETCH EVENTS
  // =========================

  const fetchEvents = async () => {

    try {

      const res = await axios.get(

        "http://localhost:5000/api/sports-events",

        {

          headers: {

            Authorization: `Bearer ${token}`

          }

        }

      );

      setEvents(res.data.events || []);

    }

    catch (err) {

      console.log(err);

    }

    finally {

      setLoading(false);

    }

  };

  // =========================
  // NORMAL INPUT CHANGE
  // =========================

  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm({

      ...form,

      [name]: value

    });

  };

  // =========================
  // POINTS CHANGE
  // =========================

  const handlePointsChange = (e) => {

    const { name, value } = e.target;

    setForm({

      ...form,

      pointsRule: {

        ...form.pointsRule,

        [name]: Number(value)

      }

    });

  };

  // =========================
  // CREATE EVENT
  // =========================

  const createEvent = async (e) => {

    e.preventDefault();

    try {

      await axios.post(

        "http://localhost:5000/api/sports-events",

        form,

        {

          headers: {

            Authorization: `Bearer ${token}`

          }

        }

      );

      alert("Sports Event Created");

      setForm({

        eventName: "",

        category: "Track",

        eventType: "Individual",

        gender: "Male",

        academicYear: "2026-2027",

        maxParticipants: 1,

        venue: "",

        eventDate: "",

        registrationDeadline: "",

        eventStatus: "REGISTRATION_OPEN",

        pointsRule: {

          first: 10,

          second: 7,

          third: 5,

          participation: 2

        }

      });

      fetchEvents();

    }

    catch (err) {

      alert(

        err.response?.data?.message ||

        "Unable to create event."

      );

    }

  };

  // =========================
  // DELETE EVENT
  // =========================

  const deleteEvent = async (id) => {

    if (!window.confirm("Delete this event?"))

      return;

    try {

      await axios.delete(

        `http://localhost:5000/api/sports-events/${id}`,

        {

          headers: {

            Authorization: `Bearer ${token}`

          }

        }

      );

      alert("Deleted Successfully");

      fetchEvents();

    }

    catch (err) {

      alert(

        err.response?.data?.message ||

        "Unable to delete."

      );

    }

  };

  return (
    <div className="sports-page">

      <div className="page-header">

        <h1>Sports Event Management</h1>

        <p>Create and manage sports events.</p>

      </div>

      <div className="sports-card">

        <h2>Create Sports Event</h2>

        <form
          className="sports-form"
          onSubmit={createEvent}
        >
          {/* Event Name */}

          <div className="form-group">

            <label>Event Name</label>

            <input
              type="text"
              name="eventName"
              value={form.eventName}
              onChange={handleChange}
              placeholder="100m Sprint"
              required
            />

          </div>

          {/* Category */}

          <div className="form-group">

            <label>Category</label>

            <select
              name="category"
              value={form.category}
              onChange={handleChange}
            >

              <option>Track</option>
              <option>Field</option>
              <option>Indoor</option>
              <option>Outdoor</option>
              <option>Team Game</option>

            </select>

          </div>

          {/* Event Type */}

          <div className="form-group">

            <label>Event Type</label>

            <select
              name="eventType"
              value={form.eventType}
              onChange={handleChange}
            >

              <option>Individual</option>
              <option>Team</option>

            </select>

          </div>

          {/* Gender */}

          <div className="form-group">

            <label>Gender</label>

            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
            >

              <option>Male</option>
              <option>Female</option>
              <option>Mixed</option>

            </select>

          </div>

          {/* Academic Year */}

          <div className="form-group">

            <label>Academic Year</label>

            <input
              type="text"
              name="academicYear"
              value={form.academicYear}
              onChange={handleChange}
              required
            />

          </div>

          {/* Venue */}

          <div className="form-group">

            <label>Venue</label>

            <input
              type="text"
              name="venue"
              value={form.venue}
              onChange={handleChange}
              placeholder="College Ground"
            />

          </div>

          {/* Maximum Participants */}

          <div className="form-group">

            <label>Maximum Participants</label>

            <input
              type="number"
              name="maxParticipants"
              min="1"
              value={form.maxParticipants}
              onChange={handleChange}
            />

          </div>

          {/* Event Date */}

          <div className="form-group">

            <label>Event Date</label>

            <input
              type="date"
              name="eventDate"
              value={form.eventDate}
              onChange={handleChange}
            />

          </div>

          {/* Registration Deadline */}

          <div className="form-group">

            <label>Registration Deadline</label>

            <input
              type="date"
              name="registrationDeadline"
              value={form.registrationDeadline}
              onChange={handleChange}
            />

          </div>

          {/* Registration Status */}

          <div className="form-group">

            <label>Registration Status</label>

            <select
              name="eventStatus"
              value={form.eventStatus}
              onChange={handleChange}
            >

              <option value="REGISTRATION_OPEN">
                Registration Open
              </option>

              <option value="REGISTRATION_CLOSED">
                Registration Closed
              </option>

              <option value="UPCOMING">
                Upcoming
              </option>

              <option value="ONGOING">
                Ongoing
              </option>

              <option value="COMPLETED">
                Completed
              </option>

            </select>

          </div>

          {/* Activity Points */}

          <h3 style={{ marginTop: "20px" }}>
            Activity Points
          </h3>

          <div className="form-group">

            <label>First Place</label>

            <input
              type="number"
              name="first"
              value={form.pointsRule.first}
              onChange={handlePointsChange}
            />

          </div>

          <div className="form-group">

            <label>Second Place</label>

            <input
              type="number"
              name="second"
              value={form.pointsRule.second}
              onChange={handlePointsChange}
            />

          </div>

          <div className="form-group">

            <label>Third Place</label>

            <input
              type="number"
              name="third"
              value={form.pointsRule.third}
              onChange={handlePointsChange}
            />

          </div>

          <div className="form-group">

            <label>Participation</label>

            <input
              type="number"
              name="participation"
              value={form.pointsRule.participation}
              onChange={handlePointsChange}
            />

          </div>

          <button
            type="submit"
            className="primary-btn"
          >
            Create Event
          </button>

        </form>

      </div>

      <div className="sports-card">

        <h2>Sports Events</h2>
        
        {

          loading ?

          (

            <p>Loading events...</p>

          )

          :

          (

            <table className="sports-table">

              <thead>

                <tr>

                  <th>Event</th>

                  <th>Category</th>

                  <th>Type</th>

                  <th>Gender</th>

                  <th>Venue</th>

                  <th>Event Date</th>

                  <th>Registration Deadline</th>

                  <th>Max Participants</th>

                  <th>Academic Year</th>

                  <th>Status</th>

                  <th>Activity Points</th>

                  <th>Action</th>

                </tr>

              </thead>

              <tbody>

                {

                  events.length === 0 ?

                  (

                    <tr>

                      <td
                        colSpan="12"
                        style={{
                          textAlign: "center"
                        }}
                      >

                        No sports events found.

                      </td>

                    </tr>

                  )

                  :

                  (

                    events.map((event) => (

                      <tr key={event._id}>

                        <td>

                          {event.eventName}

                        </td>

                        <td>

                          {event.category}

                        </td>

                        <td>

                          {event.eventType}

                        </td>

                        <td>

                          {event.gender}

                        </td>

                        <td>

                          {event.venue || "-"}

                        </td>

                        <td>

                          {

                            event.eventDate

                              ?

                              new Date(

                                event.eventDate

                              ).toLocaleDateString()

                              :

                              "-"

                          }

                        </td>

                        <td>

                          {

                            event.registrationDeadline

                              ?

                              new Date(

                                event.registrationDeadline

                              ).toLocaleDateString()

                              :

                              "-"

                          }

                        </td>

                        <td>

                          {

                            event.maxParticipants

                          }

                        </td>

                        <td>

                          {

                            event.academicYear

                          }

                        </td>

                        <td>

                          {

                            event.eventStatus

                          }

                        </td>

                        <td>

                          <div>

                            <strong>1st:</strong>{" "}

                            {

                              event.pointsRule?.first

                            }

                          </div>

                          <div>

                            <strong>2nd:</strong>{" "}

                            {

                              event.pointsRule?.second

                            }

                          </div>

                          <div>

                            <strong>3rd:</strong>{" "}

                            {

                              event.pointsRule?.third

                            }

                          </div>

                          <div>

                            <strong>P:</strong>{" "}

                            {

                              event.pointsRule?.participation

                            }

                          </div>

                        </td>

                        <td>

                          <button

                            className="danger-btn"

                            onClick={() =>

                              deleteEvent(

                                event._id

                              )

                            }

                          >

                            Delete

                          </button>

                        </td>

                      </tr>

                    ))

                  )

                }

              </tbody>

            </table>

          )

        }

      </div>

    </div>

  );

}

export default SportsEventManagement;