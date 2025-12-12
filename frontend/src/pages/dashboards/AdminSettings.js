import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, adminService, userService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function AdminSettings() {
    const navigate = useNavigate();
    const { isDarkMode, toggleTheme, theme } = useTheme();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Profile State
    const [profileData, setProfileData] = useState({
        nom: '',
        prenom: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Platform State (Mock)
    const [platformSettings, setPlatformSettings] = useState({
        maintenanceMode: false,
        allowRegistrations: true,
        emailNotifications: true,
        autoApproveInstructors: false
    });

    useEffect(() => {
        // Load current user data
        const { user } = authService.checkAuth();
        if (user) {
            setProfileData(prev => ({
                ...prev,
                nom: user.nom || '',
                prenom: user.prenom || '',
                email: user.email || ''
            }));
        }
    }, []);

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handlePlatformToggle = (key) => {
        setPlatformSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setErrorMsg('');
        setLoading(true);

        if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
            setErrorMsg('Les nouveaux mots de passe ne correspondent pas.');
            setLoading(false);
            return;
        }

        try {
            await new Promise(r => setTimeout(r, 1000)); // Simulate API call

            setSuccessMsg('✅ Profil mis à jour avec succès.');
        } catch (err) {
            setErrorMsg('❌ Erreur lors de la mise à jour.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setErrorMsg('');
        setLoading(true);

        if (profileData.newPassword !== profileData.confirmPassword) {
            setErrorMsg('Les nouveaux mots de passe ne correspondent pas.');
            setLoading(false);
            return;
        }

        try {
            await userService.changePassword({
                currentPassword: profileData.currentPassword,
                newPassword: profileData.newPassword
            });
            setSuccessMsg('✅ Mot de passe mis à jour avec succès.');
            setProfileData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
        } catch (err) {
            setErrorMsg(err.response?.data?.message || '❌ Erreur lors de la mise à jour du mot de passe.');
        } finally {
            setLoading(false);
        }
    };
    return (
        <div style={styles.container(theme)}>
            <header style={styles.header(theme)}>
                <div style={styles.headerContent}>
                    <div style={styles.headerLeft}>
                        <button onClick={() => navigate('/dashboard')} style={styles.backBtn(theme)}>
                            ← Retour Dashboard
                        </button>
                        <div>
                            <h1 style={styles.title}>⚙️ Paramètres Système</h1>
                            <p style={styles.subtitle}>Gérez votre profil et les configurations de la plateforme.</p>
                        </div>
                    </div>
                </div>
            </header>

            <div style={styles.content}>
                <div style={styles.grid}>
                    {/* Sidebar */}
                    <div style={styles.sidebar(theme)}>
                        <button
                            style={activeTab === 'profile' ? styles.tabActive(theme) : styles.tab(theme)}
                            onClick={() => setActiveTab('profile')}
                        >
                            👤 Profil Admin
                        </button>
                        <button
                            style={activeTab === 'platform' ? styles.tabActive(theme) : styles.tab(theme)}
                            onClick={() => setActiveTab('platform')}
                        >
                            🛠️ Configuration Plateforme
                        </button>
                        <button
                            style={activeTab === 'security' ? styles.tabActive(theme) : styles.tab(theme)}
                            onClick={() => setActiveTab('security')}
                        >
                            🔒 Sécurité
                        </button>
                    </div>

                    {/* Main Panel */}
                    <div style={styles.mainPanel(theme)}>
                        {successMsg && <div style={styles.alertSuccess}>{successMsg}</div>}
                        {errorMsg && <div style={styles.alertError}>{errorMsg}</div>}

                        {activeTab === 'profile' && (
                            <div>
                                <h2 style={styles.panelTitle(theme)}>Informations Personnelles</h2>
                                <form onSubmit={handleUpdateProfile} style={styles.form}>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label(theme)}>Prénom</label>
                                        <input
                                            type="text"
                                            name="prenom"
                                            value={profileData.prenom}
                                            onChange={handleProfileChange}
                                            style={styles.input(theme)}
                                        />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label(theme)}>Nom</label>
                                        <input
                                            type="text"
                                            name="nom"
                                            value={profileData.nom}
                                            onChange={handleProfileChange}
                                            style={styles.input(theme)}
                                        />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label(theme)}>Email (Lecture seule)</label>
                                        <input
                                            type="email"
                                            value={profileData.email}
                                            disabled
                                            style={{ ...styles.input(theme), opacity: 0.7, cursor: 'not-allowed' }}
                                        />
                                    </div>
                                    <div style={styles.actions}>
                                        <button type="submit" style={styles.saveBtn(theme)} disabled={loading}>
                                            {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div>
                                <h2 style={styles.panelTitle(theme)}>Sécurité du compte</h2>
                                <form onSubmit={handleUpdatePassword} style={styles.form}>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label(theme)}>Mot de passe actuel</label>
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            value={profileData.currentPassword}
                                            onChange={handleProfileChange}
                                            style={styles.input(theme)}

                                            required
                                        />
                                    </div>
                                    <div style={styles.formRow}>
                                        <div style={styles.formGroup}>
                                            <label style={styles.label(theme)}>Nouveau mot de passe</label>
                                            <input
                                                type="password"
                                                name="newPassword"
                                                value={profileData.newPassword}
                                                onChange={handleProfileChange}
                                                style={styles.input(theme)}
                                                required
                                                minLength={8}
                                            />
                                        </div>
                                        <div style={styles.formGroup}>
                                            <label style={styles.label(theme)}>Confirmer le mot de passe</label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={profileData.confirmPassword}
                                                onChange={handleProfileChange}
                                                style={styles.input(theme)}
                                                required
                                                minLength={8}
                                            />
                                        </div>
                                    </div>

                                    <div style={styles.actions}>
                                        <button type="submit" style={styles.saveBtn(theme)} disabled={loading}>
                                            {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'platform' && (
                            <div>
                                <h2 style={styles.panelTitle(theme)}>Configuration de la Plateforme</h2>
                                <div style={styles.togglesList}>
                                    <div style={styles.toggleItem(theme)}>
                                        <div>
                                            <div style={styles.toggleLabel(theme)}>Mode Maintenance</div>
                                            <div style={styles.toggleDesc(theme)}>Rend le site inaccessible aux utilisateurs non-admins.</div>
                                        </div>
                                        <button
                                            onClick={() => handlePlatformToggle('maintenanceMode')}
                                            style={platformSettings.maintenanceMode ? styles.toggleBtnActive(theme) : styles.toggleBtn(theme)}
                                        >
                                            <div style={platformSettings.maintenanceMode ? styles.toggleCircleActive(theme) : styles.toggleCircle(theme)}></div>
                                        </button>
                                    </div>

                                    <div style={styles.toggleItem(theme)}>
                                        <div>
                                            <div style={styles.toggleLabel(theme)}>Autoriser les inscriptions</div>
                                            <div style={styles.toggleDesc(theme)}>Permettre aux nouveaux utilisateurs de créer un compte.</div>
                                        </div>
                                        <button
                                            onClick={() => handlePlatformToggle('allowRegistrations')}
                                            style={platformSettings.allowRegistrations ? styles.toggleBtnActive(theme) : styles.toggleBtn(theme)}
                                        >
                                            <div style={platformSettings.allowRegistrations ? styles.toggleCircleActive(theme) : styles.toggleCircle(theme)}></div>
                                        </button>
                                    </div>

                                    <div style={styles.toggleItem(theme)}>
                                        <div>
                                            <div style={styles.toggleLabel(theme)}>Mode Sombre 🌙</div>
                                            <div style={styles.toggleDesc(theme)}>Basculer l'interface en thème sombre ou clair.</div>
                                        </div>
                                        <button
                                            onClick={toggleTheme}
                                            style={isDarkMode ? styles.toggleBtnActive(theme) : styles.toggleBtn(theme)}
                                        >
                                            <div style={isDarkMode ? styles.toggleCircleActive(theme) : styles.toggleCircle(theme)}></div>
                                        </button>
                                    </div>

                                    <div style={styles.toggleItem(theme)}>
                                        <div>
                                            <div style={styles.toggleLabel(theme)}>Approbation auto. des formateurs</div>
                                            <div style={styles.toggleDesc(theme)}>Si activé, les formateurs n'ont pas besoin de validation manuelle.</div>
                                        </div>
                                        <button
                                            onClick={() => handlePlatformToggle('autoApproveInstructors')}
                                            style={platformSettings.autoApproveInstructors ? styles.toggleBtnActive(theme) : styles.toggleBtn(theme)}
                                        >
                                            <div style={platformSettings.autoApproveInstructors ? styles.toggleCircleActive(theme) : styles.toggleCircle(theme)}></div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: (theme) => ({
        minHeight: '100vh',
        background: theme.background,
        fontFamily: "'Inter', sans-serif",
        color: theme.text
    }),
    header: (theme) => ({
        background: theme.paper,
        padding: '30px 0',
        borderBottom: `1px solid ${theme.border}`,
        color: theme.text,
    }),
    headerContent: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 30px',
    },
    headerLeft: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    backBtn: (theme) => ({
        alignSelf: 'flex-start',
        padding: '8px 16px',
        background: 'transparent',
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        cursor: 'pointer',
        color: theme.textSecondary,
        fontWeight: '500',
        fontSize: '14px',
        transition: 'all 0.2s',
    }),
    title: {
        margin: 0,
        fontSize: '32px',
        fontWeight: '800',
        letterSpacing: '-0.5px',
    },
    subtitle: {
        margin: '5px 0 0 0',
        fontSize: '16px',
        color: 'inherit',
        opacity: 0.7
    },
    content: {
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '0 30px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '250px 1fr',
        gap: '30px',
        alignItems: 'start',
    },
    sidebar: (theme) => ({
        background: theme.paper,
        borderRadius: '16px',
        padding: '10px',
        boxShadow: theme.shadow,
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    }),
    tab: (theme) => ({
        padding: '12px 16px',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        borderRadius: '8px',
        color: theme.textSecondary,
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
    }),
    tabActive: (theme) => ({
        padding: '12px 16px',
        textAlign: 'left',
        background: theme.hover,
        border: 'none',
        borderRadius: '8px',
        color: theme.primary,
        fontWeight: '700',
        cursor: 'pointer',
    }),
    mainPanel: (theme) => ({
        background: theme.paper,
        borderRadius: '20px',
        padding: '40px',
        boxShadow: theme.shadow,
        color: theme.text
    }),
    panelTitle: (theme) => ({
        fontSize: '24px',
        color: theme.text,
        margin: '0 0 30px 0',
        borderBottom: `1px solid ${theme.border}`,
        paddingBottom: '20px',
    }),
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    formRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    label: (theme) => ({
        fontSize: '14px',
        fontWeight: '600',
        color: theme.textSecondary,
    }),
    input: (theme) => ({
        padding: '12px',
        borderRadius: '8px',
        border: `1px solid ${theme.border}`,
        background: theme.background,
        color: theme.text,
        fontSize: '15px',
        transition: 'border-color 0.2s',
        outline: 'none',
    }),
    sectionHeader: (theme) => ({
        margin: '20px 0 10px 0',
        fontSize: '18px',
        color: theme.text,
    }),
    actions: {
        marginTop: '30px',
        display: 'flex',
        justifyContent: 'flex-end',
    },
    saveBtn: (theme) => ({
        padding: '12px 24px',
        background: theme.primary,
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer',
        fontSize: '15px',
        boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
    }),
    togglesList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '30px',
    },
    toggleItem: (theme) => ({
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '20px',
        borderBottom: `1px solid ${theme.border}`,
    }),
    toggleLabel: (theme) => ({
        fontSize: '16px',
        fontWeight: '600',
        color: theme.text,
        marginBottom: '5px',
    }),
    toggleDesc: (theme) => ({
        fontSize: '14px',
        color: theme.textSecondary,
        maxWidth: '500px',
    }),
    toggleBtn: (theme) => ({
        width: '50px',
        height: '26px',
        background: theme.border,
        borderRadius: '13px',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.3s',
    }),
    toggleBtnActive: (theme) => ({
        width: '50px',
        height: '26px',
        background: theme.primary,
        borderRadius: '13px',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.3s',
    }),
    toggleCircle: (theme) => ({
        width: '20px',
        height: '20px',
        background: theme.paper,
        borderRadius: '50%',
        position: 'absolute',
        top: '3px',
        left: '3px',
        transition: 'left 0.3s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }),
    toggleCircleActive: (theme) => ({
        width: '20px',
        height: '20px',
        background: theme.paper,
        borderRadius: '50%',
        position: 'absolute',
        top: '3px',
        left: '27px',
        transition: 'left 0.3s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }),
    alertSuccess: {
        padding: '12px 20px',
        background: '#dcfce7',
        color: '#166534',
        borderRadius: '8px',
        marginBottom: '20px',
        fontWeight: '500',
    },
    alertError: {
        padding: '12px 20px',
        background: '#fee2e2',
        color: '#991b1b',
        borderRadius: '8px',
        marginBottom: '20px',
        fontWeight: '500',
    }
};
