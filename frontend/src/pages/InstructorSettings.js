import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, userService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

export default function InstructorSettings() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [profileData, setProfileData] = useState({
        nom: '',
        prenom: '',
        email: '',
        bio: '',
        specialite: '',
        telephone: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const loadUser = () => {
            const { isAuthenticated, user: userData } = authService.checkAuth();
            if (!isAuthenticated || !userData) {
                navigate('/login');
                return;
            }
            setUser(userData);
            setProfileData({
                nom: userData.nom || '',
                prenom: userData.prenom || '',
                email: userData.email || '',
                bio: userData.bio || '',
                specialite: userData.specialite || '',
                telephone: userData.telephone || ''
            });
        };
        loadUser();
    }, [navigate]);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData({ ...profileData, [name]: value });
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData({ ...passwordData, [name]: value });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await userService.updateProfile(profileData);
            setMessage({ type: 'success', text: '✅ Profil mis à jour avec succès !' });

            // Mettre à jour les données locales
            const updatedUser = { ...user, ...profileData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
        } catch (error) {
            console.error('Erreur mise à jour profil:', error);
            setMessage({ type: 'error', text: '❌ Erreur lors de la mise à jour du profil' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: '❌ Les mots de passe ne correspondent pas' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: '❌ Le mot de passe doit contenir au moins 6 caractères' });
            return;
        }

        setLoading(true);

        try {
            await userService.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setMessage({ type: 'success', text: '✅ Mot de passe modifié avec succès !' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error('Erreur changement mot de passe:', error);
            setMessage({ type: 'error', text: '❌ ' + (error.response?.data?.message || 'Erreur lors du changement de mot de passe') });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <div>
                        <h1 style={styles.title}>⚙️ Paramètres du Formateur</h1>
                        <p style={styles.subtitle}>Gérez votre profil et vos préférences</p>
                    </div>
                    <div style={styles.headerActions}>
                        <ThemeToggle />
                        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
                            ← Retour au Dashboard
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main style={styles.main}>
                {/* Message de feedback */}
                {message.text && (
                    <div style={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
                        {message.text}
                    </div>
                )}

                {/* Section Profil */}
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>👤 Informations du Profil</h2>
                    <form onSubmit={handleProfileSubmit}>
                        <div style={styles.formGrid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Prénom</label>
                                <input
                                    type="text"
                                    name="prenom"
                                    value={profileData.prenom}
                                    onChange={handleProfileChange}
                                    style={styles.input}
                                    required
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Nom</label>
                                <input
                                    type="text"
                                    name="nom"
                                    value={profileData.nom}
                                    onChange={handleProfileChange}
                                    style={styles.input}
                                    required
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={profileData.email}
                                    onChange={handleProfileChange}
                                    style={styles.input}
                                    disabled
                                />
                                <small style={styles.hint}>L'email ne peut pas être modifié</small>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Téléphone</label>
                                <input
                                    type="tel"
                                    name="telephone"
                                    value={profileData.telephone}
                                    onChange={handleProfileChange}
                                    style={styles.input}
                                    placeholder="+33 6 12 34 56 78"
                                />
                            </div>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Spécialité</label>
                            <input
                                type="text"
                                name="specialite"
                                value={profileData.specialite}
                                onChange={handleProfileChange}
                                style={styles.input}
                                placeholder="Ex: Développement Web, Data Science..."
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Biographie</label>
                            <textarea
                                name="bio"
                                value={profileData.bio}
                                onChange={handleProfileChange}
                                rows="4"
                                style={styles.textarea}
                                placeholder="Présentez-vous en quelques mots..."
                            />
                        </div>

                        <button type="submit" style={styles.submitBtn} disabled={loading}>
                            {loading ? '⏳ Enregistrement...' : '💾 Enregistrer les modifications'}
                        </button>
                    </form>
                </section>

                {/* Section Sécurité */}
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>🔒 Sécurité</h2>
                    <form onSubmit={handlePasswordSubmit}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Mot de passe actuel</label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                style={styles.input}
                                required
                            />
                        </div>

                        <div style={styles.formGrid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Nouveau mot de passe</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    style={styles.input}
                                    required
                                    minLength="6"
                                />
                                <small style={styles.hint}>Minimum 6 caractères</small>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Confirmer le mot de passe</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    style={styles.input}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" style={styles.submitBtn} disabled={loading}>
                            {loading ? '⏳ Modification...' : '🔑 Changer le mot de passe'}
                        </button>
                    </form>
                </section>

                {/* Section Préférences */}
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>🎨 Préférences</h2>
                    <div style={styles.preferenceItem}>
                        <div>
                            <h3 style={styles.preferenceTitle}>Thème de l'interface</h3>
                            <p style={styles.preferenceDescription}>Choisissez entre le mode clair et sombre</p>
                        </div>
                        <ThemeToggle />
                    </div>
                </section>
            </main>
        </div>
    );
}

const getStyles = (theme) => ({
    container: {
        minHeight: '100vh',
        background: theme.background,
    },
    header: {
        background: theme.paper,
        padding: '20px 40px',
        boxShadow: theme.shadow,
        borderBottom: `1px solid ${theme.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
    },
    headerContent: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        flexWrap: 'wrap',
        gap: '20px',
    },
    title: {
        margin: 0,
        fontSize: '28px',
        color: theme.text,
        fontWeight: '700',
    },
    subtitle: {
        margin: '5px 0 0 0',
        fontSize: '14px',
        color: theme.textSecondary,
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
    },
    backBtn: {
        padding: '10px 20px',
        background: '#6b7280',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'all 0.3s',
    },
    main: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '30px',
    },
    successMessage: {
        padding: '16px 20px',
        background: '#10b981',
        color: 'white',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
    },
    errorMessage: {
        padding: '16px 20px',
        background: '#ef4444',
        color: 'white',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
    },
    section: {
        background: theme.paper,
        borderRadius: '16px',
        padding: '30px',
        boxShadow: theme.shadow,
        border: `1px solid ${theme.border}`,
    },
    sectionTitle: {
        fontSize: '22px',
        color: theme.text,
        margin: '0 0 20px 0',
        fontWeight: '600',
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '20px',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '20px',
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: theme.text,
    },
    input: {
        padding: '12px 16px',
        border: `2px solid ${theme.border}`,
        borderRadius: '8px',
        fontSize: '14px',
        background: theme.background,
        color: theme.text,
        transition: 'all 0.3s',
        outline: 'none',
    },
    textarea: {
        padding: '12px 16px',
        border: `2px solid ${theme.border}`,
        borderRadius: '8px',
        fontSize: '14px',
        background: theme.background,
        color: theme.text,
        fontFamily: 'inherit',
        resize: 'vertical',
        outline: 'none',
    },
    hint: {
        fontSize: '12px',
        color: theme.textSecondary,
        fontStyle: 'italic',
    },
    submitBtn: {
        padding: '14px 32px',
        background: '#f97316',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        transition: 'all 0.3s',
        marginTop: '10px',
    },
    preferenceItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        background: theme.background,
        borderRadius: '12px',
        border: `1px solid ${theme.border}`,
    },
    preferenceTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: theme.text,
        margin: '0 0 5px 0',
    },
    preferenceDescription: {
        fontSize: '14px',
        color: theme.textSecondary,
        margin: 0,
    },
});
