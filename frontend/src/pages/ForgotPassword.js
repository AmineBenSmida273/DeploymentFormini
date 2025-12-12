import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/api';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [step, setStep] = useState(1); // 1: Email, 2: Code
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const navigate = useNavigate();

    // ----- Étape 1 : Envoyer l'email (APPEL API RÉEL) -----
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Appel au backend pour envoyer le VRAI mail
            await authService.forgotPassword(email);
            alert('✅ Un code de vérification a été envoyé à ' + email);
            setStep(2); // Passer à l'étape du code seulement si l'API répond succès
        } catch (err) {
            alert('❌ Erreur : ' + (err.response?.data?.message || "Impossible d'envoyer l'email"));
        } finally {
            setLoading(false);
        }
    };

    // ----- Utils Code Input -----
    const handleCodeChange = (index, value) => {
        if (!/^\d?$/.test(value)) return;
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        if (value && index < 5) {
            document.getElementById(`code-${index + 1}`).focus();
        }
    };

    // ----- Étape 2 : Vérifier le code (APPEL API RÉEL) -----
    const handleCodeSubmit = async (e) => {
        e.preventDefault();
        const fullCode = code.join('');
        if (fullCode.length !== 6) {
            alert('❌ Veuillez entrer le code à 6 chiffres.');
            return;
        }

        setLoading(true);
        try {
            // Vérifier le code coté serveur
            await authService.verifyResetCode({ email, code: fullCode });

            // Si valide, on redirige vers le reset en passant l'email et le code (pour la preuve)
            navigate('/reset-password', { state: { email, code: fullCode } });
        } catch (err) {
            alert('❌ Code invalide ou expiré.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <h2 style={styles.title}>
                    {step === 1 ? 'Forgot Password? 🔒' : 'Verify Email 📧'}
                </h2>
                <p style={styles.subtitle}>
                    {step === 1
                        ? "Enter your email and we'll send you a verification code."
                        : `Enter the 6-digit code sent to ${email}`}
                </p>

                {step === 1 ? (
                    /* FORMULAIRE EMAIL */
                    <form onSubmit={handleEmailSubmit} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={styles.input}
                                required
                            />
                        </div>
                        <button type="submit" style={styles.button} disabled={loading}>
                            {loading ? 'Sending Code...' : 'Send Verification Code'}
                        </button>
                    </form>
                ) : (
                    /* FORMULAIRE CODE */
                    <form onSubmit={handleCodeSubmit} style={styles.form}>
                        <div style={styles.codeContainer}>
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`code-${index}`}
                                    type="text"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleCodeChange(index, e.target.value)}
                                    style={styles.codeInput}
                                    disabled={loading}
                                />
                            ))}
                        </div>
                        <button type="submit" style={styles.button} disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            style={styles.resendLink}
                        >
                            Change Email
                        </button>
                    </form>
                )}

                <div style={styles.footer}>
                    <Link to="/login" style={styles.backLink}>
                        ← Back to Login
                    </Link>
                </div>
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
    codeContainer: {
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        marginBottom: '10px',
    },
    codeInput: {
        width: '50px',
        height: '60px',
        fontSize: '24px',
        textAlign: 'center',
        borderRadius: '12px',
        border: `2px solid ${theme.border}`,
        background: theme.background,
        color: theme.text,
        outline: 'none',
        fontWeight: 'bold',
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
    footer: {
        marginTop: '25px',
    },
    backLink: {
        color: theme.textSecondary,
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: '500',
    },
    resendLink: {
        background: 'none',
        border: 'none',
        color: '#f97316',
        cursor: 'pointer',
        fontSize: '14px',
        textDecoration: 'underline',
        marginTop: '10px',
    },
});
