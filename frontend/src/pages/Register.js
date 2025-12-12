import React, { useState } from "react";
import { authService } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import signupImage from "../assets/images/signup.png";
import { useTheme } from "../context/ThemeContext";

export default function Signup() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    pass: "",
    pass2: "",
    role: "student",
    centreProfession: "",
    agree: false,
  });
  const [cvFile, setCvFile] = useState(null);
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

    if (formData.pass !== formData.pass2) {
      alert("❌ Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }
    if (!formData.agree) {
      alert("❌ Vous devez accepter les conditions");
      setLoading(false);
      return;
    }

    // Vérifier si formateur et CV requis
    if (formData.role === 'instructor' && !cvFile) {
      alert("❌ Le CV (PDF) est obligatoire pour les formateurs");
      setLoading(false);
      return;
    }

    if (formData.role === 'instructor' && !formData.centreProfession.trim()) {
      alert("❌ Le centre de profession est obligatoire pour les formateurs");
      setLoading(false);
      return;
    }

    try {
      // Créer FormData pour l'upload de fichier
      const formDataToSend = new FormData();
      formDataToSend.append('nom', formData.nom);
      formDataToSend.append('prenom', formData.prenom);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('mdp', formData.pass);
      formDataToSend.append('role', formData.role);

      if (formData.role === 'instructor') {
        formDataToSend.append('cv', cvFile);
        formDataToSend.append('centreProfession', formData.centreProfession);
      }

      // Utiliser registerWithMFA avec FormData
      const response = await authService.registerWithMFA(formDataToSend);

      // Stocker l'email pour la vérification MFA
      localStorage.setItem('pendingVerificationEmail', formData.email);

      // Message spécial pour formateurs
      if (formData.role === 'instructor') {
        alert("✅ Votre demande a été soumise. Elle est en attente d'approbation par l'administrateur. Un code de vérification a été envoyé à votre email.");
      }

      // Rediriger vers la page de vérification MFA
      navigate('/verify-mfa', {
        state: { email: formData.email }
      });

    } catch (err) {
      alert("Erreur : " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* ---- LEFT FORM ---- */}
        <div style={styles.left} className="register-left">
          <h1 style={styles.title}>Create an account</h1>
          <p style={styles.subtitle}>Start your learning journey today</p>

          <form onSubmit={handleSubmit} style={styles.form}>

            {/* NOM / PRENOM */}
            <div style={styles.nameRow}>
              <div style={styles.inputGroupHalf}>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="Last Name"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div style={styles.inputGroupHalf}>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="First Name"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

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
                name="pass"
                value={formData.pass}
                onChange={handleChange}
                required
                disabled={loading}
                minLength="8"
              />
            </div>

            {/* CONFIRM PASSWORD */}
            <div style={styles.inputGroup}>
              <input
                style={styles.input}
                type="password"
                placeholder="Confirm Password"
                name="pass2"
                value={formData.pass2}
                onChange={handleChange}
                required
                disabled={loading}
                minLength="8"
              />
            </div>

            {/* ROLE */}
            <div style={styles.inputGroup}>
              <select
                style={styles.input}
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="student">🎓 Student</option>
                <option value="instructor">👨‍🏫 Instructor</option>
              </select>
              <p style={styles.helpText}>
                ⚠️ Les comptes administrateur ne peuvent pas être créés via l'inscription publique
              </p>
            </div>

            {/* CENTRE DE PROFESSION (pour formateurs) */}
            {formData.role === 'instructor' && (
              <div style={styles.inputGroup}>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="Centre de profession *"
                  name="centreProfession"
                  value={formData.centreProfession}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            )}

            {/* UPLOAD CV (pour formateurs) */}
            {formData.role === 'instructor' && (
              <div style={styles.inputGroup}>
                <label style={styles.fileLabel}>
                  📄 CV (PDF) *
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert("❌ Le fichier est trop volumineux (max 5MB)");
                          return;
                        }
                        if (file.type !== 'application/pdf') {
                          alert("❌ Seuls les fichiers PDF sont acceptés");
                          return;
                        }
                        setCvFile(file);
                      }
                    }}
                    disabled={loading}
                    style={styles.fileInput}
                  />
                </label>
                {cvFile && (
                  <p style={styles.fileInfo}>
                    ✅ {cvFile.name} ({(cvFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            )}

            {/* TERMS */}
            <div style={styles.checkboxRow}>
              <input
                type="checkbox"
                name="agree"
                checked={formData.agree}
                onChange={handleChange}
                disabled={loading}
              />
              <span style={{ marginLeft: 8 }}>
                I accept the <a href="#" style={styles.link}>Terms & Conditions</a>
              </span>
            </div>

            <button
              style={{
                ...styles.button,
                ...(loading && styles.buttonLoading)
              }}
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p style={styles.footer}>
            Already have an account ?{" "}
            <Link to="/login" style={styles.link2}>
              Log in
            </Link>
          </p>
        </div>

        <style>{`
          .register-left::-webkit-scrollbar {
            width: 8px;
          }
          .register-left::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .register-left::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }
          .register-left::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}</style>

        {/* ---- RIGHT IMAGE ---- */}
        <div style={styles.right}>
          <img src={signupImage} alt="signup" style={styles.image} />
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
    maxHeight: "95vh",
    background: theme.paper,
    borderRadius: "24px",
    boxShadow: theme.shadow,
    display: "flex",
    overflow: "hidden",
    border: `1px solid ${theme.border}`,
  },

  left: {
    width: "45%",
    padding: "40px 50px",
    overflowY: "auto",
    overflowX: "hidden",
    display: "flex",
    flexDirection: "column",
    maxHeight: "100%",
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
    fontSize: "32px",
    fontWeight: "bold",
    color: theme.text,
    marginBottom: "5px",
  },

  subtitle: {
    marginTop: "5px",
    fontSize: "15px",
    color: theme.textSecondary,
    marginBottom: "20px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  nameRow: {
    display: "flex",
    gap: "15px",
  },

  inputGroupHalf: {
    flex: 1,
    background: theme.background,
    borderRadius: "12px",
    border: `1.5px solid ${theme.border}`,
    padding: "14px 16px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
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

  checkboxRow: {
    marginTop: "10px",
    color: theme.text,
  },

  button: {
    marginTop: "15px",
    marginBottom: "10px",
    background: "#f97316",
    padding: "14px",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "0.3s",
    width: "100%",
    boxShadow: theme.shadow,
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
    marginTop: "15px",
    fontSize: "14px",
    paddingTop: "10px",
    borderTop: `1px solid ${theme.border}`,
    color: theme.textSecondary,
    textAlign: "center",
  },
  helpText: {
    marginTop: "5px",
    fontSize: "12px",
    color: "#ef4444",
  },
  fileLabel: {
    display: "block",
    fontSize: "14px",
    color: theme.textSecondary,
    marginBottom: "8px",
    fontWeight: "500",
  },
  fileInput: {
    marginTop: "8px",
    width: "100%",
    padding: "10px 12px",
    border: `1.5px solid ${theme.border}`,
    borderRadius: "10px",
    fontSize: "14px",
    cursor: "pointer",
    background: theme.background,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    color: theme.text,
  },
  fileInfo: {
    marginTop: "8px",
    fontSize: "13px",
    color: "#10b981",
    fontWeight: "500",
  },
});