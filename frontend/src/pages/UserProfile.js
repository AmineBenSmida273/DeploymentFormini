import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, userService } from '../services/api'; // Ensure userService is exported from api.js
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

export default function UserProfile() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    bio: '',
    telephone: ''
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Try to get fresh profile data from server
      try {
        const response = await userService.getProfile();
        setUser(response.data);
        setFormData({
          prenom: response.data.prenom || '',
          nom: response.data.nom || '',
          email: response.data.email || '',
          bio: response.data.bio || '',
          telephone: response.data.telephone || ''
        });
      } catch (err) {
        // Fallback to local storage if API fails or not implemented yet for specific endpoint
        console.warn("Could not fetch profile from API, falling back to authService", err);
        const { user: localUser } = authService.checkAuth();
        if (localUser) {
          setUser(localUser);
          setFormData({
            prenom: localUser.prenom || '',
            nom: localUser.nom || '',
            email: localUser.email || '',
            bio: localUser.bio || '',
            telephone: localUser.telephone || ''
          });
        } else {
          throw new Error("No user found");
        }
      }
      setLoading(false);
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Impossible de charger le profil.");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage('');

    try {
      await userService.updateProfile(formData);
      setUser(prev => ({ ...prev, ...formData }));
      setSuccessMessage('Profil mis à jour avec succès !');
      setIsEditing(false);
      // Update local storage if needed to keep session in sync
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...currentUser, ...formData }));
    } catch (err) {
      console.error("Update error:", err);
      setError("Erreur lors de la mise à jour du profil.");
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Chargement du profil...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
              <span>⬅</span> Retour au tableau de bord
            </button>
            <div>
              <h1 style={styles.title}>Mon Profil</h1>
              <p style={styles.subtitle}>Gérez vos informations personnelles</p>
            </div>
          </div>
          <div style={styles.headerActions}>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.profileCard}>
          <div style={styles.profileHeader}>
            <div style={styles.avatarPlaceholder}>
              {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
            </div>
            <div style={styles.profileInfoHeader}>
              <h2 style={styles.userName}>{user?.prenom} {user?.nom}</h2>
              <span style={styles.userRole}>{user?.role === 'student' ? 'Étudiant' : user?.role}</span>
            </div>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} style={styles.editButton}>
                Modifier le profil
              </button>
            )}
          </div>

          {error && <div style={styles.errorMessage}>{error}</div>}
          {successMessage && <div style={styles.successMessage}>{successMessage}</div>}

          {isEditing ? (
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Prénom</label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email (non modifiable)</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  style={{ ...styles.input, backgroundColor: theme.paperSecondary, opacity: 0.7 }}
                />
              </div>
              <div style={styles.formActions}>
                <button type="button" onClick={() => setIsEditing(false)} style={styles.cancelButton}>
                  Annuler
                </button>
                <button type="submit" style={styles.saveButton}>
                  Enregistrer
                </button>
              </div>
            </form>
          ) : (
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Prénom</span>
                <span style={styles.infoValue}>{user?.prenom}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Nom</span>
                <span style={styles.infoValue}>{user?.nom}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Email</span>
                <span style={styles.infoValue}>{user?.email}</span>
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const getStyles = (theme) => ({
  container: {
    minHeight: '100vh',
    background: theme.background,
    color: theme.text,
    fontFamily: "'Inter', sans-serif",
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: theme.background,
    color: theme.text,
  },
  spinner: {
    border: `4px solid ${theme.border}`,
    borderTop: `4px solid ${theme.primary}`,
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  header: {
    background: theme.paper,
    padding: '30px 40px',
    borderBottom: `1px solid ${theme.border}`,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: '#6b7280', // Lighter gray
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s',
    boxShadow: 'none',
    ':hover': {
      transform: 'translateY(-2px)',
      background: '#4b5563',
      boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)',
    }
  },
  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: '800',
    color: theme.primary,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    margin: '5px 0 0 0',
    color: theme.textSecondary,
    fontSize: '16px',
  },
  main: {
    maxWidth: '1000px',
    margin: '40px auto',
    padding: '0 20px',
  },
  profileCard: {
    background: theme.paper,
    borderRadius: '16px',
    padding: '40px',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.border}`,
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '30px',
    marginBottom: '40px',
    borderBottom: `1px solid ${theme.border}`,
    paddingBottom: '30px',
  },
  avatarPlaceholder: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: theme.primary,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  profileInfoHeader: {
    flex: 1,
  },
  userName: {
    margin: '0 0 5px 0',
    fontSize: '28px',
    color: theme.text,
  },
  userRole: {
    display: 'inline-block',
    padding: '4px 12px',
    background: theme.paperSecondary,
    color: theme.textSecondary,
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  editButton: {
    padding: '10px 20px',
    background: theme.paperSecondary,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '30px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoItemFull: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoLabel: {
    fontSize: '14px',
    color: theme.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: '16px',
    color: theme.text,
    lineHeight: '1.5',
  },
  form: {
    display: 'grid',
    gap: '20px',
    maxWidth: '600px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: theme.text,
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid ${theme.border}`,
    background: theme.background,
    color: theme.text,
    fontSize: '16px',
  },
  formActions: {
    display: 'flex',
    gap: '15px',
    marginTop: '20px',
  },
  saveButton: {
    padding: '12px 24px',
    background: theme.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '16px',
  },
  cancelButton: {
    padding: '12px 24px',
    background: 'transparent',
    color: theme.textSecondary,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '16px',
  },
  errorMessage: {
    padding: '15px',
    background: '#fee2e2',
    color: '#dc2626',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  successMessage: {
    padding: '15px',
    background: '#dcfce7',
    color: '#16a34a',
    borderRadius: '8px',
    marginBottom: '20px',
  },
});
