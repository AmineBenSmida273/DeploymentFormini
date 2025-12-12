import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/api';

export default function ResetPassword() {
    const [passwords, setPasswords] = useState({ new: '', confirm: '' });
    const [loading, setLoading] = useState(false);
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const navigate = useNavigate();
    const location = useLocation();

    const { email, code } = location.state || {};

    useEffect(() => {
        // Protection : rediriger si pas d'email/code (accès direct interdit)
        if (!email || !code) {
            navigate('/forgot-password');
        }
    }, [email, code, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            alert('❌ Passwords do not match!');
            return;
        }
        setLoading(true);

        try {
            // APPEL API RÉEL pour changer le mot de passe
            await authService.resetPassword({
                email,
                code, // On renvoie le code pour prouver que la vérification est récente
                newPassword: passwords.new
            });

            alert('✅ Password reset successfully! You can now login.');
            navigate('/login');
        } catch (err) {
            alert('❌ Erreur : ' + (err.response?.data?.message || "Erreur lors du changement de mot de passe"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <h2 style={styles.title}>Reset Password 🔑</h2>
                <p style={styles.subtitle}>
                    Create a new strong password for your account.
                </p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <input
                            type="password"
                            placeholder="New Password"
                            value={passwords.new}
                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                            style={styles.input}
                            required
                            minLength={6}
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <input
                            type="password"
                            placeholder="Confirm New Password"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                            style={styles.input}
                            required
                            minLength={6}
                        />
                    </div>

                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Updating Password...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}

const getStyles = (theme) => ({
    page: {
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: theme.background,
        padding: '20px',
    },
    card: {
        background: theme.paper,
        padding: '40px',
        borderRadius: '16px',
        boxShadow: theme.shadow,
        maxWidth: '500px',
        width: '100%',
        border: `1px solid ${theme.border}`,
        textAlign: 'center',
    },
    title: {
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '10px',
        color: theme.text,
    },
    subtitle: {
        fontSize: '16px',
        color: theme.textSecondary,
        marginBottom: '30px',
        lineHeight: '1.5',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    inputGroup: {
        background: theme.background,
        borderRadius: '12px',
        border: `1.5px solid ${theme.border}`,
        padding: '14px 16px',
    },
    input: {
        width: '100%',
        border: 'none',
        outline: 'none',
        background: 'transparent',
        fontSize: '16px',
        color: theme.text,
    },
    button: {
        padding: '16px',
        background: '#f97316',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background 0.3s',
    },
});
