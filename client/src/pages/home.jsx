import './home.css';

function Home() {
  return (
    <div className="home-container">
      {/* 1. HERO SECTION */}
      <header className="hero-section">
        <div className="hero-overlay">
          <div className="hero-content">
            <span className="hero-tagline">Center of Excellence in Technical Education</span>
            <h1>Welcome to St. Mary's Polytechnic College</h1>
            <p>
              Managed by the Catholic Diocese of Palakkad. Empowering students with industry-standard 
              practical engineering skills, strong moral values, and premier technical diploma education at Valliyode, Palakkad.
            </p>
            <div className="hero-buttons">
              <button className="btn btn-primary">Admissions Open 2026-2027</button>
              <button className="btn btn-secondary">Explore Diploma Programs</button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. QUICK STATS BANNER */}
      <section className="stats-banner">
        <div className="stat-item">
          <h3>25<span className="stat-suffix">+</span></h3>
          <p>Years of Technical Legacy</p>
        </div>
        <div className="stat-item">
          <h3>6<span className="stat-suffix"></span></h3>
          <p>Core Diploma Streams</p>
        </div>
        <div className="stat-item">
          <h3>100<span className="stat-suffix">%</span></h3>
          <p>Placement & Training Support</p>
        </div>
        <div className="stat-item">
          <h3>AICTE<span className="stat-suffix"></span></h3>
          <p>Approved & SBTE Affiliated</p>
        </div>
      </section>

      {/* 3. CORE VALUES / WHY CHOOSE US */}
      <section className="features-section">
        <h2>Why Choose St. Mary's Polytechnic College?</h2>
        <p className="section-subtitle">We cultivate a dedicated learning environment focused on practical engineering, industrial training, and holistic student development.</p>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-graduation-cap" aria-hidden="true"></i>
            </div>
            <h3>Expert Technical Faculty</h3>
            <p>Learn directly from experienced engineers and dedicated mentors focused on laboratory hands-on training and foundational theory.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-tools" aria-hidden="true"></i>
            </div>
            <h3>Modern Workshops & Labs</h3>
            <p>State-of-the-art facilities including Fitter Lab, Motor Vehicle (MMV) Lab, Electrical Machines Lab, and advanced Computer centers.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-briefcase" aria-hidden="true"></i>
            </div>
            <h3>Campus Placements</h3>
            <p>Strong industry tie-ups including regular campus recruitment drives with leading manufacturers like Ashok Leyland and tech firms.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-bus" aria-hidden="true"></i>
            </div>
            <h3>Campus & Student Facilities</h3>
            <p>Separate Boys & Girls hostels managed by Priests and Sisters, extensive college bus transportation across Palakkad and Thrissur, and athletic courts.</p>
          </div>
        </div>
      </section>

      {/* 4. ACADEMIC PILLARS */}
      <section className="academics-section">
        <div className="academics-section-wrapper">
          <h2>Our Diploma <span className="highlight">Disciplines</span></h2>
          <p className="section-subtitle">Three-year comprehensive technical diploma programs approved by AICTE and affiliated to SBTE Kerala.</p>
          <div className="academics-grid">
            <div className="academic-box">
              <h3>Mechanical & Automobile Engineering</h3>
              <p>Hands-on training in automotive mechanics, thermal engineering, workshop fabrication, and modern CAD/CAM computer design.</p>
            </div>
            <div className="academic-box">
              <h3>Computer Engineering</h3>
              <p>Comprehensive foundation in software development, computer networking, hardware maintenance, and data communication.</p>
            </div>
            <div className="academic-box">
              <h3>Electrical, Civil & Safety Engineering</h3>
              <p>Specialized streams covering power systems, structural drafting, construction technology, and industrial Fire Technology & Safety.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CAMPUS LIFE, NEWS & EVENTS */}
      <section className="news-events-section">
        <h2>Campus Life & Latest Updates</h2>
        <p className="section-subtitle">Stay connected with placement drives, technical exhibitions, and campus milestones at Valliyode.</p>
        
        <div className="news-grid">
          <div className="news-card">
            <div className="news-image placeholder-img">
              <span className="news-tag">Placements</span>
            </div>
            <div className="news-body">
              <span className="news-date">Campus Drive</span>
              <h3>Ashok Leyland Campus Recruitment Drive</h3>
              <p>Automobile and Mechanical diploma scholars participated in technical aptitude tests and corporate interviews conducted by Ashok Leyland.</p>
              <a href="#read-more" className="read-more-link">Read Story →</a>
            </div>
          </div>

          <div className="news-card">
            <div className="news-image placeholder-img">
              <span className="news-tag">Technical Expo</span>
            </div>
            <div className="news-body">
              <span className="news-date">Annual Exhibition</span>
              <h3>Annual Polytechnic Engineering Project Expo</h3>
              <p>Final-year students exhibited innovative engineering prototypes spanning IoT automated systems, EV conversions, and fire safety systems.</p>
              <a href="#read-more" className="read-more-link">Read Story →</a>
            </div>
          </div>

          <div className="news-card">
            <div className="news-image placeholder-img">
              <span className="news-tag">Athletics</span>
            </div>
            <div className="news-body">
              <span className="news-date">Sports Meet</span>
              <h3>Annual Inter-Department Sports & Athletics</h3>
              <p>Students competed across volleyball, basketball, badminton, and football championships hosted on the college athletic grounds.</p>
              <a href="#read-more" className="read-more-link">Read Story →</a>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS / STUDENT VOICES */}
      <section className="testimonials-section">
        <h2>What Our Scholars Say</h2>
        <p className="section-subtitle">Real experiences from students and alumni of St. Mary's Polytechnic College.</p>
        <div className="testimonials-container">
          <div className="testimonial-card">
            <p className="testimonial-text">
              "The practical training in the Automobile and Mechanical workshops at Valliyode gave me the confidence and hands-on skills needed to clear my campus placement interview on the very first attempt."
            </p>
            <div className="testimonial-author">
              <h4>Jithin Raj</h4>
              <p>Alumnus | Diploma in Automobile Engineering</p>
            </div>
          </div>

          <div className="testimonial-card">
            <p className="testimonial-text">
              "Dedicated instructors, modern computer laboratories, and disciplined campus life made my three years at St. Mary's a wonderful launching pad for my career in IT."
            </p>
            <div className="testimonial-author">
              <h4>Ananya Krishnan</h4>
              <p>Class of '25 | Diploma in Computer Engineering</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. ADMISSIONS CALL TO ACTION */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Begin Your Technical Career?</h2>
          <p>Admissions for the 2026-2027 Academic Year are open. Join St. Mary's Polytechnic College, Valliyode today.</p>
          <div className="cta-buttons">
            <button className="btn btn-primary-light">Apply for Admission</button>
            <button className="btn btn-outline-light">Download Prospectus</button>
            <button className="btn btn-outline-light">Contact Admissions Desk</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;