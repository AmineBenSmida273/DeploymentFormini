import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/images/logo.png';

const Home = () => {
  const navigate = useNavigate();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);

  const handleEnrollClick = (courseName) => {
    setCurrentCourse(courseName);
    setIsEnrolling(true);
    
    // Simuler un appel API
    setTimeout(() => {
      alert(`Vous êtes maintenant inscrit au cours de ${courseName} !`);
      setIsEnrolling(false);
      // Rediriger vers le tableau de bord étudiant
      navigate('/student/dashboard');
    }, 1000);
  };

  const handleExploreCourses = () => {
    // Faire défiler jusqu'à la section des cours
    const coursesSection = document.getElementById('courses');
    if (coursesSection) {
      coursesSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/courses');
    }
  };
  return (
    <div style={styles.container}>
      
      {/* --- HERO SECTION --- */}
      <header style={styles.hero}>
        <nav style={styles.navbar}>
          <div style={styles.logo}>
            <img src={logo} alt="Formini" style={styles.logoImage} />
          </div>
          <div style={styles.navLinks}>
            <a href="#courses" style={styles.navLink}>Courses</a>
            <a href="#about" style={styles.navLink}>About</a>
            <a href="#contact" style={styles.navLink}>Contact</a>
            <Link to="/login" style={styles.loginBtn}>Login</Link>
            <Link to="/register" style={styles.signupBtn}>Sign Up</Link>
          </div>
        </nav>

        <div style={styles.heroContent}>
          <div style={styles.heroText}>
            <h1 style={styles.heroTitle}>
              Learn Without <span style={styles.highlight}>Limits</span>
            </h1>
            <p style={styles.heroSubtitle}>
              Start, switch, or advance your career with thousands of courses, 
              professional certificates, and degrees from world-class universities and companies.
            </p>
            <div style={styles.heroButtons}>
              <Link to="/register" style={styles.ctaButton}>
                Join For Free
              </Link>
              <button 
                style={styles.secondaryButton}
                onClick={handleExploreCourses}
              >
                Explore Courses
              </button>
            </div>
            <div style={styles.stats}>
              <div style={styles.stat}>
                <h3 style={styles.statNumber}>00K+</h3>
                <p style={styles.statText}>Students</p>
              </div>
              <div style={styles.stat}>
                <h3 style={styles.statNumber}>00+</h3>
                <p style={styles.statText}>Courses</p>
              </div>
              <div style={styles.stat}>
                <h3 style={styles.statNumber}>00+</h3>
                <p style={styles.statText}>Instructors</p>
              </div>
            </div>
          </div>
          <div style={styles.heroImage}>
            <div style={styles.imagePlaceholder}>
              <span style={styles.imageIcon}>🎓</span>
              <p>Learning Illustration</p>
            </div>
          </div>
        </div>
      </header>

      {/* --- FEATURES SECTION --- */}
      <section style={styles.features}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Why Choose Formini?</h2>
          <p style={styles.sectionSubtitle}>Learn at your own pace with our innovative platform</p>
        </div>
        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>⚡</div>
            <h3 style={styles.featureTitle}>Learn Fast</h3>
            <p style={styles.featureText}>
              Bite-sized lessons that fit your schedule and learning style.
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🎯</div>
            <h3 style={styles.featureTitle}>Expert Teachers</h3>
            <p style={styles.featureText}>
              Learn from industry experts and experienced educators.
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>📱</div>
            <h3 style={styles.featureTitle}>Anywhere, Anytime</h3>
            <p style={styles.featureText}>
              Access courses on any device, online or offline.
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🏆</div>
            <h3 style={styles.featureTitle}>Get Certified</h3>
            <p style={styles.featureText}>
              Earn certificates to showcase your skills and knowledge.
            </p>
          </div>
        </div>
      </section>

      {/* --- POPULAR COURSES --- */}
      <section style={styles.courses} id="courses">
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Popular Courses</h2>
          <p style={styles.sectionSubtitle}>Start learning with our most popular courses</p>
        </div>
        <div style={styles.coursesGrid}>
          <div style={styles.courseCard}>
            <div style={styles.courseImage}>
              <span style={styles.courseIcon}>💻</span>
            </div>
            <div style={styles.courseContent}>
              <h3 style={styles.courseTitle}>Web Development</h3>
              <p style={styles.courseDescription}>
                Learn HTML, CSS, JavaScript and modern frameworks.
              </p>
              <div style={styles.courseMeta}>
                <span style={styles.courseInfo}>📚 45 Lessons</span>
                <span style={styles.courseInfo}>⏱️ 20 Hours</span>
              </div>
              <button 
                style={styles.courseButton}
                onClick={() => handleEnrollClick('Web Development')}
                disabled={isEnrolling && currentCourse === 'Web Development'}
              >
                {isEnrolling && currentCourse === 'Web Development' ? 'Inscription...' : 'Enroll Now'}
              </button>
            </div>
          </div>
          
          <div style={styles.courseCard}>
            <div style={styles.courseImage}>
              <span style={styles.courseIcon}>📊</span>
            </div>
            <div style={styles.courseContent}>
              <h3 style={styles.courseTitle}>Data Science</h3>
              <p style={styles.courseDescription}>
                Master Python, statistics, and machine learning algorithms.
              </p>
              <div style={styles.courseMeta}>
                <span style={styles.courseInfo}>📚 60 Lessons</span>
                <span style={styles.courseInfo}>⏱️ 30 Hours</span>
              </div>
              <button 
                style={styles.courseButton}
                onClick={() => handleEnrollClick('Data Science')}
                disabled={isEnrolling && currentCourse === 'Data Science'}
              >
                {isEnrolling && currentCourse === 'Data Science' ? 'Inscription...' : 'Enroll Now'}
              </button>
            </div>
          </div>
          
          <div style={styles.courseCard}>
            <div style={styles.courseImage}>
              <span style={styles.courseIcon}>🎨</span>
            </div>
            <div style={styles.courseContent}>
              <h3 style={styles.courseTitle}>UI/UX Design</h3>
              <p style={styles.courseDescription}>
                Create beautiful and user-friendly digital experiences.
              </p>
              <div style={styles.courseMeta}>
                <span style={styles.courseInfo}>📚 35 Lessons</span>
                <span style={styles.courseInfo}>⏱️ 25 Hours</span>
              </div>
              <button 
                style={styles.courseButton}
                onClick={() => handleEnrollClick('UI/UX Design')}
                disabled={isEnrolling && currentCourse === 'UI/UX Design'}
              >
                {isEnrolling && currentCourse === 'UI/UX Design' ? 'Inscription...' : 'Enroll Now'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaContent}>
          <h2 style={styles.ctaTitle}>Ready to Start Learning?</h2>
          <p style={styles.ctaText}>
            Join thousands of students already learning on Formini
          </p>
          <Link 
            to="/register" 
            style={styles.ctaButtonLarge}
            className="cta-button"
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(1px)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          >
            Get Started Today
          </Link>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerSection}>
            <div style={styles.logo}>
              <img src={logo} alt="Formini" style={styles.footerLogo} />
            </div>
            <p style={styles.footerText}>
              Empowering learners worldwide with quality education.
            </p>
          </div>
          <div style={styles.footerSection}>
            <h4 style={styles.footerTitle}>Quick Links</h4>
            <a href="#" style={styles.footerLink}>Home</a>
            <a href="#courses" style={styles.footerLink}>Courses</a>
            <a href="#" style={styles.footerLink}>About Us</a>
            <a href="#" style={styles.footerLink}>Contact</a>
          </div>
          <div style={styles.footerSection}>
            <h4 style={styles.footerTitle}>Support</h4>
            <a href="#" style={styles.footerLink}>Help Center</a>
            <a href="#" style={styles.footerLink}>Privacy Policy</a>
            <a href="#" style={styles.footerLink}>Terms of Service</a>
          </div>
          <div style={styles.footerSection}>
            <h4 style={styles.footerTitle}>Contact</h4>
            <p style={styles.footerText}>Email: formini.hello@formini.com</p>
            <p style={styles.footerText}>Phone: (+216)12 345 678</p>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <p>&copy; 2025 Formini. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
    color: '#333',
  },
  
  // Navbar Styles - SUPPRIMER LE PADDING
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 50px', // ↓ Réduit le padding
    maxWidth: '100%',
    margin: '0 auto',
  },
  logo: {
    display: 'flex',
    alignItems: 'centre',
  },
  logoImage: {
    height: '120px', // ↓ Réduit un peu la taille du logo
    width: 'auto',
  },

  // Hero Section - SUPPRIMER LE PADDING DU HAUT
  hero: {
    background: 'linear-gradient(135deg, #ffdab2ff, #fb923c)',
    color: 'white',
    padding: '0px 50px 80px 50px', // ↑ 0px en haut, garde le reste
  },
  footerLogo: {
    height: '80px',
    width: 'auto',
    marginBottom: '15px',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '30px',
  },
  navLink: {
    color: '#6b7280',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'color 0.3s',
  },
  loginBtn: {
    color: '#f97316',
    textDecoration: 'none',
    fontWeight: '500',
    padding: '8px 16px',
    transition: 'color 0.3s',
  },
  signupBtn: {
    background: '#f97316',
    color: 'white',
    textDecoration: 'none',
    padding: '10px 24px',
    borderRadius: '10px',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 8px rgba(249, 115, 22, 0.25)',
  },

  
  heroContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: '1200px',
    margin: '0 auto',
    gap: '50px',
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: '3.5rem',
    fontWeight: 'bold',
    marginBottom: '20px',
    lineHeight: '1.2',
  },
  highlight: {
    color: '#1f2937',
  },
  heroSubtitle: {
    fontSize: '1.2rem',
    marginBottom: '30px',
    opacity: '0.9',
    lineHeight: '1.6',
  },
  heroButtons: {
    display: 'flex',
    gap: '15px',
    marginBottom: '40px',
  },
  ctaButton: {
    background: '#1f2937',
    color: 'white',
    padding: '16px 32px',
    borderRadius: '12px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '1rem',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(31, 41, 55, 0.15)',
  },
  secondaryButton: {
    background: 'transparent',
    color: 'white',
    padding: '15px 30px',
    borderRadius: '8px',
    border: '2px solid white',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s',
  },
  stats: {
    display: 'flex',
    gap: '40px',
  },
  stat: {
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: '0',
  },
  statText: {
    margin: '0',
    opacity: '0.8',
  },
  heroImage: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    background: 'rgba(255,255,255,0.1)',
    padding: '40px',
    borderRadius: '20px',
    textAlign: 'center',
    fontSize: '5rem',
  },
  imageIcon: {
    fontSize: '8rem',
  },

  // Features Section
  features: {
    padding: '80px 50px',
    background: '#f8fafc',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '60px',
  },
  sectionTitle: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '15px',
  },
  sectionSubtitle: {
    fontSize: '1.1rem',
    color: '#6b7280',
    maxWidth: '600px',
    margin: '0 auto',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  featureCard: {
    background: 'white',
    padding: '40px 30px',
    borderRadius: '16px',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid rgba(249, 115, 22, 0.08)',
  },
  featureIcon: {
    fontSize: '3rem',
    marginBottom: '20px',
  },
  featureTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#1f2937',
  },
  featureText: {
    color: '#6b7280',
    lineHeight: '1.6',
  },

  // Courses Section
  courses: {
    padding: '80px 50px',
  },
  coursesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  courseCard: {
    background: 'white',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid rgba(249, 115, 22, 0.08)',
  },
  courseImage: {
    background: 'linear-gradient(135deg, #f97316, #fb923c)',
    padding: '40px',
    textAlign: 'center',
    fontSize: '4rem',
  },
  courseIcon: {
    fontSize: '5rem',
  },
  courseContent: {
    padding: '30px',
  },
  courseTitle: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#1f2937',
  },
  courseDescription: {
    color: '#6b7280',
    marginBottom: '20px',
    lineHeight: '1.6',
  },
  courseMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  courseInfo: {
    color: '#9ca3af',
    fontSize: '0.9rem',
  },
  courseButton: {
    background: '#f97316',
    color: 'white',
    border: 'none',
    padding: '14px 24px',
    borderRadius: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 8px rgba(249, 115, 22, 0.2)',
  },

  // CTA Section
  ctaSection: {
    background: 'linear-gradient(135deg, #da6512ff, #ffb376ff)',
    color: 'white',
    padding: '80px 50px',
    textAlign: 'center',
  },
  ctaContent: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  ctaTitle: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  ctaText: {
    fontSize: '1.2rem',
    marginBottom: '30px',
    opacity: '0.9',
  },
  ctaButtonLarge: {
    background: '#1f2937',
    color: 'white',
    padding: '18px 36px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    transition: 'all 0.3s ease',
  },

  // Footer
  footer: {
    background: '#3b4c61ff',
    color: 'white',
    padding: '50px 50px 20px',
  },
  footerContent: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
    marginBottom: '40px',
  },
  footerSection: {
    
  },
  footerTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  footerText: {
    color: '#d1d5db',
    lineHeight: '1.6',
    marginBottom: '10px',
  },
  footerLink: {
    display: 'block',
    color: '#d1d5db',
    textDecoration: 'none',
    marginBottom: '10px',
    transition: 'color 0.3s',
  },
  footerBottom: {
    textAlign: 'center',
    paddingTop: '20px',
    borderTop: '1px solid #374151',
    color: '#9ca3af',
  },
};

// Effets hover avec couleurs orange/noir
const styleElement = document.createElement('style');
styleElement.textContent = `
  .nav-link:hover {
    color: #f97316 !important;
  }
  
  .login-btn:hover {
    color: #ea580c !important;
  }
  
  .signup-btn:hover {
    background: #ea580c !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.35) !important;
  }
  
  .cta-button:hover, .cta-button-large:hover {
    background: #374151 !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(31, 41, 55, 0.25) !important;
  }
  
  .secondary-button:hover {
    background: rgba(255,255,255,0.1);
  }
  
  .feature-card:hover, .course-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 32px rgba(249, 115, 22, 0.18), 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: rgba(249, 115, 22, 0.2);
  }
  
  .course-button:hover {
    background: #ea580c !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(249, 115, 22, 0.35) !important;
  }
  
  .footer-link:hover {
    color: #f97316 !important;
  }
`;
document.head.appendChild(styleElement);

export default Home;