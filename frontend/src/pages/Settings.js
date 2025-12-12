import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, userService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

export default function Settings() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const styles = getStyles(theme);

    // const [activeTab, setActiveTab] = useState('security'); // Removed tab state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Password State
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Visibility toggle state
    const [showPasswords, setShowPasswords] = useState({
        old: false,
        new: false,
        confirm: false
    });

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };





    // --- Password Handlers ---
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError("Les nouveaux mots de passe ne correspondent pas.");
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setError("Le mot de passe doit contenir au moins 8 caractères.");
            return;
        }

        try {
            setLoading(true);
            await userService.changePassword({
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            });
            setSuccess("Mot de passe modifié avec succès !");
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Erreur lors du changement de mot de passe.");
        } finally {
            setLoading(false);
        }
    };



    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <div style={styles.headerLeft}>
                        <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
                            <span>⬅</span> Retour au tableau de bord
                        </button>
                        <div>
                            <h1 style={styles.title}>Paramètres</h1>
                            <p style={styles.subtitle}>Gérez vos préférences et votre sécurité</p>
                        </div>
                    </div>
                    <div style={styles.headerActions}>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main style={styles.main}>
                <div style={styles.layout}>
                    {/* Sidebar Navigation */}
                    <aside style={styles.sidebar}>
                        <button
                            style={styles.navItemActive}
                            onClick={() => { }}
                        >
                            🔒 Sécurité
                        </button>
                    </aside>

                    {/* Content Area */}
                    <section style={styles.content}>
                        {error && <div style={styles.errorMessage}>{error}</div>}
                        {success && <div style={styles.successMessage}>{success}</div>}

                        <div style={styles.card}>
                            <h2 style={styles.cardTitle}>Changer le mot de passe</h2>
                            <form onSubmit={handlePasswordSubmit} style={styles.form}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Ancien mot de passe</label>
                                    <div style={styles.inputContainer}>
                                        <input
                                            type={showPasswords.old ? "text" : "password"}
                                            name="oldPassword"
                                            value={passwordData.oldPassword}
                                            onChange={handlePasswordChange}
                                            style={styles.input}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('old')}
                                            style={styles.eyeButton}
                                        >
                                            {showPasswords.old ? '👁️' : '🙈'}
                                        </button>
                                    </div>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Nouveau mot de passe</label>
                                    <div style={styles.inputContainer}>
                                        <input
                                            type={showPasswords.new ? "text" : "password"}
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            style={styles.input}
                                            required
                                            minLength={8}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('new')}
                                            style={styles.eyeButton}
                                        >
                                            {showPasswords.new ? '👁️' : '🙈'}
                                        </button>
                                    </div>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Confirmer le nouveau mot de passe</label>
                                    <div style={styles.inputContainer}>
                                        <input
                                            type={showPasswords.confirm ? "text" : "password"}
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            style={styles.input}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('confirm')}
                                            style={styles.eyeButton}
                                        >
                                            {showPasswords.confirm ? '👁️' : '🙈'}
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" style={styles.saveButton} disabled={loading}>
                                    {loading ? 'Modification...' : 'Changer le mot de passe'}
                                </button>
                            </form>
                        </div>
                    </section>
                </div>
            </main>
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
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '0 20px',
    },
    layout: {
        display: 'flex',
        gap: '30px',
        flexWrap: 'wrap',
    },
    sidebar: {
        flex: '0 0 250px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    navItem: {
        textAlign: 'left',
        padding: '12px 20px',
        background: 'transparent',
        color: theme.textSecondary, // Softer text for inactive
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '500',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        ':hover': {
            background: theme.paperSecondary,
            color: theme.primary,
        }
    },
    navItemActive: {
        textAlign: 'left',
        padding: '12px 20px',
        background: theme.primaryLight, // Using lighter orange background
        color: 'black',
        // Let's swap: background transparent with border, or maybe dark orange?
        // Let's try: background: theme.primary + slight shadow.
        // Or maybe just inverted?
        // I will change it to: background: theme.paper, color: theme.primary, border: `1px solid ${theme.primary}`. This looks clean.
        background: theme.paper,
        color: theme.primary,
        border: `2px solid ${theme.primary}`,
        borderRadius: '8px',
        cursor: 'default',
        fontSize: '16px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: `0 4px 10px ${theme.primary}20`,
    },
    content: {
        flex: 1,
        minWidth: '300px',
    },
    card: {
        background: theme.paper,
        borderRadius: '16px',
        padding: '30px',
        boxShadow: theme.shadow,
        border: `1px solid ${theme.border}`,
    },
    cardTitle: {
        marginTop: 0,
        marginBottom: '20px',
        fontSize: '20px',
        borderBottom: `1px solid ${theme.border}`,
        paddingBottom: '10px',
    },
    form: {
        maxWidth: '500px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
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
        width: '100%', // Ensure input takes full width of container
        boxSizing: 'border-box', // Important for padding
    },
    inputContainer: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
    },
    eyeButton: {
        position: 'absolute',
        right: '10px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '18px',
        opacity: 0.7,
        transition: 'opacity 0.2s',
        padding: '5px',
        ':hover': {
            opacity: 1,
        }
    },
    select: {
        padding: '8px',
        borderRadius: '8px',
        border: `1px solid ${theme.border}`,
        background: theme.background,
        color: theme.text,
        fontSize: '16px',
        marginLeft: '10px',
    },
    textarea: {
        padding: '12px',
        borderRadius: '8px',
        border: `1px solid ${theme.border}`,
        background: theme.background,
        color: theme.text,
        fontSize: '16px',
        minHeight: '80px',
        resize: 'vertical',
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
        alignSelf: 'flex-start',
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
    // Reviews Styles
    emptyText: {
        color: theme.textSecondary,
        fontStyle: 'italic',
    },
    reviewsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    reviewItem: {
        padding: '20px',
        borderRadius: '8px',
        background: theme.background,
        border: `1px solid ${theme.border}`,
    },
    reviewHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
    },
    reviewCourseInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    miniImage: {
        width: '40px',
        height: '40px',
        borderRadius: '4px',
        objectFit: 'cover',
    },
    courseTitle: {
        margin: 0,
        fontSize: '16px',
        fontWeight: '600',
    },
    reviewDate: {
        fontSize: '12px',
        color: theme.textSecondary,
    },
    starDisplay: {
        marginBottom: '8px',
        color: '#fbbf24', // Star gold
    },
    ratingNumber: {
        color: theme.textSecondary,
        fontSize: '12px',
        marginLeft: '5px',
    },
    reviewComment: {
        margin: '0 0 10px 0',
        color: theme.text,
        fontSize: '14px',
        lineHeight: '1.5',
    },
    editLink: {
        background: 'none',
        border: 'none',
        color: theme.primary,
        cursor: 'pointer',
        padding: 0,
        fontSize: '13px',
        textDecoration: 'underline',
    },
    // Edit Review Form
    editReviewForm: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    ratingEdit: {
        display: 'flex',
        alignItems: 'center',
    },
    reviewActions: {
        display: 'flex',
        gap: '10px',
    },
    smallSaveBtn: {
        padding: '6px 12px',
        background: theme.primary,
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '13px',
    },
    smallCancelBtn: {
        padding: '6px 12px',
        background: 'transparent',
        color: theme.textSecondary,
        border: `1px solid ${theme.border}`,
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '13px',
    },
});
