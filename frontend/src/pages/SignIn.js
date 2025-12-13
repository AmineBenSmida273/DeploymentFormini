import React, { useState } from "react";
import { authService } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import signinImage from "../assets/images/SignIn.png";
import { useTheme } from "../context/ThemeContext";

export default function SignIn() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [formData, setFormData] = useState({
    email: "",
    mdp: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Essayer d'abord la connexion standard pour TOUS les utilisateurs
      // Cela permet de récupérer le rôle depuis le backend
      const response = await authService.login({
        email: formData.email,
        mdp: formData.mdp,
      });

      const { token, user } = response.data;

      if (token && user) {
        // Si c'est un ADMIN => Connexion directe sans MFA
        if (user.role === 'admin') {
          if (formData.rememberMe) {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
          } else {
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('user', JSON.stringify(user));
          }
          localStorage.removeItem('pendingVerificationEmail');

          console.log('✅ Admin connecté:', user.email);
          navigate('/dashboard');
        }
        // Si c'est un étudiant/formateur => Forcer le MFA
        else {
          console.log('🔒 Utilisateur non-admin, redirection vers MFA...');

          // Déclencher l'envoi du code MFA
          await authService.loginWithMFA({
            email: formData.email,
            mdp: formData.mdp,
          });

          localStorage.setItem('pendingVerificationEmail', formData.email);
          navigate('/verify-mfa', { state: { email: formData.email, flow: 'login' } });
        }
      }

    } catch (err) {
      console.error('Erreur de connexion:', err);
      alert("❌ Erreur : " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* ---- LEFT FORM ---- */}
        <div style={styles.left}>
          <h1 style={styles.title}>Welcome back</h1>
          <p style={styles.subtitle}>Continue your learning journey 🚀</p>

          <form onSubmit={handleSubmit} style={styles.form}>

            {/* EMAIL */}
            <div style={styles.inputGroup}>
              <input
                style={styles.input}
                type="email"
                placeholder="Email address"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            {/* PASSWORD */}
            <div style={styles.inputGroup}>
              <input
                style={styles.input}
                type="password"
                placeholder="Password"
                name="mdp"
                value={formData.mdp}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            {/* REMEMBER ME & FORGOT PASSWORD */}
            <div style={styles.optionsRow}>
              <div style={styles.rememberMe}>
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span style={{ marginLeft: 8, fontSize: "14px" }}>
                  Remember me
                </span>
              </div>

              <Link to="/forgot-password" style={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>

            <button
              style={{
                ...styles.button,
                ...(loading && styles.buttonLoading)
              }}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>


          <p style={styles.footer}>
            Don't have an account ?{" "}
            <Link to="/register" style={styles.link2}>
              Sign up
            </Link>
          </p>
        </div>

        {/* ---- RIGHT IMAGE ---- */}
        <div style={styles.right}>
          <img src={signinImage} alt="signin" style={styles.image} />
        </div>

      </div>
    </div>
  );
}

/* ---------- STYLES ---------- */
const getStyles = (theme) => ({
  page: {
    width: "100%",
    height: "100vh",
    background: theme.background,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
  },

  card: {
    width: "80%",
    height: "95%",
    maxWidth: "1200px",
    background: theme.paper,
    borderRadius: "24px",
    boxShadow: theme.shadow,
    display: "flex",
    overflow: "hidden",
    border: `1px solid ${theme.border}`,
  },

  left: {
    width: "45%",
    padding: "50px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    background: theme.paper,
  },

  right: {
    width: "55%",
    background: "linear-gradient(135deg, #f97316, #fb923c)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  image: {
    width: "90%",
  },

  title: {
    fontSize: "36px",
    fontWeight: "bold",
    color: theme.text,
  },

  subtitle: {
    marginTop: "5px",
    fontSize: "15px",
    color: theme.textSecondary,
    marginBottom: "30px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  inputGroup: {
    background: theme.background,
    borderRadius: "12px",
    border: `1.5px solid ${theme.border}`,
    padding: "14px 16px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },

  input: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "15px",
    color: theme.text,
  },

  optionsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "10px",
  },

  rememberMe: {
    display: "flex",
    alignItems: "center",
    color: theme.textSecondary,
  },

  forgotLink: {
    color: "#f97316",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
  },

  button: {
    marginTop: "10px",
    background: "#f97316",
    padding: "16px 24px",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 12px rgba(249, 115, 22, 0.25)",
  },

  buttonLoading: {
    opacity: "0.7",
    cursor: "not-allowed",
  },


  link: {
    color: "#f97316",
    textDecoration: "none",
  },

  link2: {
    color: "#f97316",
    fontWeight: "bold",
    textDecoration: "none",
  },

  footer: {
    marginTop: "20px",
    fontSize: "14px",
    textAlign: "center",
    color: theme.textSecondary,
  },
});

// Effets hover
const styleElement = document.createElement('style');
styleElement.textContent = `
  .input-group:hover {
    border-color: #f97316;
    box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.08);
    background: #ffffff;
  }

  .input-group:focus-within {
    border-color: #f97316;
    box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.12);
    background: #ffffff;
  }

  button:hover:not(:disabled) {
    background: #ea580c;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(249, 115, 22, 0.35);
  }

  button:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(249, 115, 22, 0.25);
  }


  a:hover {
    text-decoration: underline;
    color: #ea580c;
  }
`;
document.head.appendChild(styleElement);