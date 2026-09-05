import './about.css';

function About() {
  return (
    <div className="about-container">
      {/* 1. PAGE HEADER */}
      <header className="about-header">
        <div className="header-overlay">
          <h1>About Our College</h1>
          <p className="breadcrumbs">Home / About Us</p>
        </div>
      </header>

      {/* 2. WELCOME & PRESIDENTIAL ADDRESS */}
      <section className="about-intro">
        <div className="intro-grid">
          <div className="intro-text">
            <span className="section-tagline">A Legacy of Technical Excellence</span>
            <h2>Over 25 Years of Educational Dedication</h2>
            <p>
              St. Mary's Polytechnic College, located in Valliyode, Palakkad, is an AICTE-approved institution 
              functioning under the dedicated patronage and governance of the Catholic Diocese of Palakkad. 
              We take pride in fostering an inclusive, discipline-centered, and practical learning environment where 
              technical potential is realized and engineering competence is honed.
            </p>
            <p>
              Our comprehensive 3-year diploma curriculum balances hands-on workshop training with foundational engineering 
              theories, industrial internships, and ethical values. This guarantees that our graduates are fully prepared to 
              excel in high-demand technical sectors and corporate manufacturing environments.
            </p>
          </div>
          <div className="intro-quote-card">
            <blockquote>
              "Technical education is not merely the accumulation of specialized mechanical knowledge, but the development of critical character and professional competence. At St. Mary's, we prepare students to meet tomorrow's industrial challenges."
            </blockquote>
            <cite>— Mar Peter Kochupurakkal, Chairman</cite>
          </div>
        </div>
      </section>

      {/* 3. MISSION, VISION, & VALUES */}
      <section className="mission-vision-section">
        <div className="mv-grid">
          <div className="mv-card">
            <h3>Our Institutional Vision</h3>
            <p>
              To consolidate itself as a center of excellence in technical education which transforms students 
              into globally competent professionals with an impeccable value system.
            </p>
          </div>
          <div className="mv-card">
            <h3>Our Institutional Mission</h3>
            <p>
              To impart quality technical education with an emphasis on engineering practices, ensure a good learning 
              environment with qualified and highly dedicated faculty, and train students to meet industrial requirements.
            </p>
          </div>
          <div className="mv-card">
            <h3>Our Quality Policy</h3>
            <p>
              The institution has been assessed for its quality management system – providing technical education 
              and practical training through continual improvement of performance and student-centered growth.
            </p>
          </div>
        </div>
      </section>

      {/* 4. HISTORICAL MILESTONES */}
      <section className="history-section">
        <h2>Our Institutional Trajectory</h2>
        <p className="section-subtitle">How a dedicated technical complex in Valliyode evolved into a premier polytechnic benchmark.</p>
        
        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-year">1996</div>
            <div className="timeline-content">
              <h4>Foundational Inception</h4>
              <p>The technical training foundation stone was laid by Mar Joseph Irimpen, the first Bishop of Palakkad, under the patronship of Bishop Mar Jacob Manathodath.</p>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-year">2011</div>
            <div className="timeline-content">
              <h4>Polytechnic Charter (LOA)</h4>
              <p>St. Mary's Polytechnic College received official Letter of Approval from AICTE and SBTE affiliation, launching 3-year diploma engineering disciplines.</p>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-year">2021</div>
            <div className="timeline-content">
              <h4>Silver Jubilee Milestone</h4>
              <p>Celebrated 25 years of technical education service under SITS, introducing specialized diploma streams like Fire Technology & Safety and modernized lab wings.</p>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-year">2026</div>
            <div className="timeline-content">
              <h4>Industry 4.0 & Smart Campus</h4>
              <p>Equipping classrooms with multimedia smart infrastructure, scaling industrial recruitment tie-ups with Ashok Leyland, and driving 100% placement support.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. LEADERSHIP & ADMINISTRATION */}
      <section className="leadership-section">
        <h2>Institutional Leadership</h2>
        <p className="section-subtitle">Meet the visionary administrators guiding our educational standards, technical excellence, and student development.</p>
        
        <div className="leadership-grid">
          <div className="leader-card">
            <div className="leader-image-placeholder">
              <i className="fas fa-user-tie" aria-hidden="true"></i>
            </div>
            <h4>Mar Peter Kochupurakkal</h4>
            <p className="leader-title">Chairman</p>
            <p className="leader-bio">Bishop of the Catholic Diocese of Palakkad, providing visionary pastoral guidance and ethical leadership to the educational mission of St. Mary's.</p>
          </div>

          <div className="leader-card">
            <div className="leader-image-placeholder">
              <i className="fas fa-user-shield" aria-hidden="true"></i>
            </div>
            <h4>Rev. Fr. Mathew Illathuparampil</h4>
            <p className="leader-title">Director</p>
            <p className="leader-bio">Oversees campus development, institutional governance, student welfare, and long-term strategic enhancements across all technical departments.</p>
          </div>

          <div className="leader-card">
            <div className="leader-image-placeholder">
              <i className="fas fa-user-graduate" aria-hidden="true"></i>
            </div>
            <h4>Ms. Indukala M. P.</h4>
            <p className="leader-title">Principal</p>
            <p className="leader-bio">Heads academic administration, faculty development, SBTE curriculum execution, and ensures laboratory excellence across all diploma disciplines.</p>
          </div>

          <div className="leader-card">
            <div className="leader-image-placeholder">
              <i className="fas fa-church" aria-hidden="true"></i>
            </div>
            <h4>Rev. Fr. Jeejo Chalakkal</h4>
            <p className="leader-title">President</p>
            <p className="leader-bio">Inspires campus spiritual enrichment, holistic student formation, and ethical governance across St. Mary's technical complex.</p>
          </div>
        </div>
      </section>

      {/* 6. ACCREDITATIONS & APPROVALS */}
      <section className="accreditation-section">
        <div className="accreditation-wrapper">
          <h2>Approvals & Affiliations</h2>
          <p className="section-subtitle">Our academic programs adhere strictly to national technical directives and state curriculum standards.</p>
          
          <div className="accreditation-grid">
            <div className="accred-item">
              <i className="fas fa-certificate" aria-hidden="true"></i>
              <h4>AICTE New Delhi</h4>
              <p>Approved by the All India Council for Technical Education, ensuring national technical compliance.</p>
            </div>
            <div className="accred-item">
              <i className="fas fa-university" aria-hidden="true"></i>
              <h4>SBTE Kerala</h4>
              <p>Affiliated to the State Board of Technical Education / SITTTR, Directorate of Technical Education, Kerala.</p>
            </div>
            <div className="accred-item">
              <i className="fas fa-award" aria-hidden="true"></i>
              <h4>Catholic Diocese of Palakkad</h4>
              <p>Governed by the Catholic Diocese of Palakkad, fostering academic prestige and value-based education.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CAMPUS INFRASTRUCTURE & FACILITIES */}
      <section className="global-footprint-section">
        <div className="global-grid">
          <div className="global-content-text">
            <span className="section-tagline">Campus Ecosystem</span>
            <h2>Comprehensive Student Infrastructure</h2>
            <p>
              St. Mary's Polytechnic College provides a secure and nurturing 
              campus atmosphere equipped with world-class technical facilities at Valliyode.
            </p>
            <ul className="global-stats-list">
              <li><strong>6</strong> Dedicated Engineering Workshops & Labs</li>
              <li><strong>1,200</strong> Capacity Modern Campus Auditorium</li>
              <li><strong>100%</strong> Secured Hostels for Boys & Girls Managed by Priests & Sisters</li>
            </ul>
          </div>
          <div className="global-map-placeholder">
            <div className="map-overlay-content">
              <i className="fas fa-tools" aria-hidden="true"></i>
              <p>Equipping scholars with industry-ready skills at St. Mary's Polytechnic College, Valliyode, Palakkad.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;