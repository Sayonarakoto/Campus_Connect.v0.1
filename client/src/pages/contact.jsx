import { useState } from "react";
import "./contact.css";
import axios from "axios";

function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", role: "Diploma", message: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {

  e.preventDefault();

  try {

    await axios.post(
      "http://localhost:5000/api/contact",
      formData
    );

    alert(
      "Thank you. Your inquiry has been submitted."
    );

    setFormData({

      name: "",
      email: "",
      role: "Diploma",
      message: ""

    });

  }

  catch (err) {

    alert(

      err.response?.data?.message ||

      "Submission failed."

    );

  }

};

  return (
    <div className="contact-page-wrapper">
      <div className="contact-container">
        
        {/* INTERACTIVE SPLIT PANELS */}
        <div className="contact-split-layout">
          
          {/* PANEL 1: OFFICIAL DIRECTORY DETAILS */}
          <div className="contact-details-panel">
            <span className="contact-tagline">Connect With Us</span>
            <h1>University Directory</h1>
            <p className="panel-subtitle">
              Have questions regarding enrollment, degree programs, credit transfers, or campus tours? Reach out to our administrative offices directly.
            </p>

            <div className="info-directory-list">
              
              {/* Directory Item: Address */}
              <div className="directory-item">
                <div className="directory-icon">
                  <i className="fas fa-map-marker-alt" aria-hidden="true"></i>
                </div>
                <div className="directory-text">
                  <h3>Main Campus Address</h3>
                  <p>St. Mary's Polytechnic College</p>
                  <p>Valliyode, Palakkad, Kerala – 678705</p>
                </div>
              </div>

              {/* Directory Item: Phone */}
              <div className="directory-item">
                <div className="directory-icon">
                  <i className="fas fa-phone-alt" aria-hidden="true"></i>
                </div>
                <div className="directory-text">
                  <h3>Communications Hotlines</h3>
                  <p><strong>Mobile / WhatsApp:</strong> +91 9544200103, +91 8547280102</p>
                  <p><strong>College Office:</strong> 04922-256240</p>
                </div>
              </div>

              {/* Directory Item: Emails */}
              <div className="directory-item">
                <div className="directory-icon">
                  <i className="fas fa-envelope" aria-hidden="true"></i>
                </div>
                <div className="directory-text">
                  <h3>Academic Correspondence</h3>
                  <p><strong>Official Desk:</strong> smpcpkd@gmail.com</p>
                  <p><strong>Admissions:</strong> admissions@stmaryspolytechnic.in</p>
                </div>
              </div>

              {/* Directory Item: Hours */}
              <div className="directory-item">
                <div className="directory-icon">
                  <i className="fas fa-clock" aria-hidden="true"></i>
                </div>
                <div className="directory-text">
                  <h3>Hours of Operation</h3>
                  <p>Monday – Friday: 9:00 AM – 4:30 PM IST</p>
                  <p>Saturday: 9:00 AM – 1:00 PM IST</p>
                </div>
              </div>
              
            </div>
          </div>

          {/* PANEL 2: ADMISSIONS & GENERAL INQUIRY FORM */}
          <div className="contact-form-panel">
            <h2>Submit an Academic Inquiry</h2>
            <p>Complete the inquiry form below, and an admissions officer or departmental counselor will assist you shortly.</p>

            <form onSubmit={handleSubmit} className="institutional-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  required 
                  placeholder="e.g., John Doe" 
                  value={formData.name} 
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  required 
                  placeholder="name@example.com" 
                  value={formData.email} 
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Applicant Status</label>
                <select id="role" name="role" value={formData.role} onChange={handleChange}>
                  <option value="Diploma">Prospective Diploma Student</option>
                  <option value="Lateral">Lateral Entry Applicant</option>
                  <option value="Parent">Parent / Guardian</option>
                  <option value="Corporate">Industrial / Placement Partner</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="message">Inquiry Details / Intended Field of Study</label>
                <textarea 
                  id="message" 
                  name="message" 
                  rows="5" 
                  required 
                  placeholder="Please specify your intended major, degree type, or general questions..." 
                  value={formData.message} 
                  onChange={handleChange}
                ></textarea>
              </div>

              <button type="submit" className="form-submit-btn">
                <i className="fas fa-paper-plane" style={{ marginRight: "8px" }} aria-hidden="true"></i>
                Submit Inquiry Dossier
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Contact;