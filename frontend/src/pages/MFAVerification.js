import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import logo from '../assets/images/logo.png';
const MFAVerification = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Récupérer l'email depuis la navigation ou localStorage
    const userEmail = location.state?.email || localStorage.getItem('pendingVerificationEmail');
    if (!userEmail) {
      navigate('/register');
      return;
    }
    setEmail(userEmail);
    startCountdown();
  }, [location, navigate]);

  const startCountdown = () => {
    setCountdown(600); // 10 minutes en secondes
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus sur le champ suivant
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`).focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const numbers = pastedData.replace(/\D/g, '').slice(0, 6);
    
    const newCode = [...code];
    numbers.split('').forEach((num, index) => {
      if (index < 6) newCode[index] = num;
    });
    
    setCode(newCode);
    
    // Focus sur le dernier champ rempli
    const lastFilledIndex = numbers.length - 1;
    if (lastFilledIndex < 5) {
      document.getElementById(`code-${lastFilledIndex + 1}`).focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      setError('Veuillez saisir les 6 chiffres du code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.verifyMFA({
        email,
        code: verificationCode
      });

      setSuccess('Compte vérifié avec succès !');
      const { token, user } = response.data;

      if (token && user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.removeItem('pendingVerificationEmail');
        
        // Rediriger vers le dashboard approprié selon le rôle
        if (user.role === 'admin') {
          navigate('/dashboard'); // Dashboard.js affichera AdminDashboard
        } else if (user.role === 'instructor') {
          navigate('/dashboard'); // Dashboard.js affichera InstructorDashboard
        } else {
          navigate('/dashboard'); // Dashboard.js affichera StudentDashboard
        }
      } else {
        setError('Réponse inattendue du serveur. Merci de réessayer.');
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la vérification');
      // Réinitialiser le code en cas d'erreur
      setCode(['', '', '', '', '', '']);
      document.getElementById('code-0').focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');

    try {
      await authService.resendVerificationCode({ email });
      setSuccess('Nouveau code envoyé !');
      startCountdown();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi du code');
    } finally {
      setLoading(false);
    }
  };

  const isCodeComplete = code.every(digit => digit !== '');

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}z>
            <img src={logo} alt="Formini" style={styles.logoImage} />
          </div>
          <h2 style={styles.title}>Vérification du compte</h2>
          <p style={styles.subtitle}>
            Nous avons envoyé un code de vérification à<br />
            <strong style={styles.email}>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.codeContainer}>
            <label style={styles.label}>Code de vérification (6 chiffres)</label>
            <div style={styles.codeInputs}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  style={styles.codeInput}
                  disabled={loading}
                  autoFocus={index === 0}
                />
              ))}
            </div>
            
            <div style={styles.timer}>
              ⏱️ Code valide pendant : <strong>{formatTime(countdown)}</strong>
            </div>
          </div>

          {error && (
            <div style={styles.error}>
              ❌ {error}
            </div>
          )}

          {success && (
            <div style={styles.success}>
              ✅ {success}
            </div>
          )}

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(!isCodeComplete || loading ? styles.buttonDisabled : {})
            }}
            disabled={!isCodeComplete || loading}
          >
            {loading ? 'Vérification...' : 'Vérifier le code'}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Vous n'avez pas reçu le code ?{' '}
            <button
              type="button"
              onClick={handleResendCode}
              style={styles.resendButton}
              disabled={loading || countdown > 570} // Désactiver pendant 30s après envoi
            >
              Renvoyer le code
            </button>
          </p>
          
          <Link to="/register" style={styles.backLink}>
            ← Retour à l'inscription
          </Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: "linear-gradient(135deg, #ffdab2ff, #fb923c)",
    padding: '0px',
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
  },
  card: {
    background: 'white',
    borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08)',
    padding: '48px',
    width: '100%',
    maxWidth: '480px',
    border: '1px solid rgba(249, 115, 22, 0.1)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  logo: {
    
    alignItems: 'centre',
    width: '100%',
  },
  logoImage: {
    height: '120px',
    width: 'auto',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '10px',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '0.95rem',
    lineHeight: '1.5',
  },
  email: {
    color: '#f97316',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  codeContainer: {
    textAlign: 'center',
  },
  label: {
    display: 'block',
    color: '#374151',
    fontWeight: '500',
    marginBottom: '15px',
    fontSize: '0.9rem',
  },
  codeInputs: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    marginBottom: '15px',
  },
  codeInput: {
    width: '56px',
    height: '64px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    textAlign: 'center',
    fontSize: '1.5rem',
    fontWeight: '600',
    outline: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    background: '#f8fafc',
  },
  timer: {
    color: '#6b7280',
    fontSize: '0.85rem',
    marginBottom: '10px',
  },
  button: {
    background: '#f97316',
    color: 'white',
    border: 'none',
    padding: '16px 24px',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)',
    width: '100%',
  },
  buttonDisabled: {
    opacity: '0.6',
    cursor: 'not-allowed',
  },
  error: {
    background: '#fef2f2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    textAlign: 'center',
    border: '1px solid #fecaca',
  },
  success: {
    background: '#f0fdf4',
    color: '#16a34a',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    textAlign: 'center',
    border: '1px solid #bbf7d0',
  },
  footer: {
    textAlign: 'center',
    marginTop: '25px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb',
  },
  footerText: {
    color: '#6b7280',
    fontSize: '0.9rem',
    marginBottom: '15px',
  },
  resendButton: {
    background: 'none',
    border: 'none',
    color: '#f97316',
    cursor: 'pointer',
    fontWeight: '500',
    textDecoration: 'underline',
  },
  backLink: {
    color: '#6b7280',
    textDecoration: 'none',
    fontSize: '0.9rem',
  },
};

// Styles dynamiques pour les effets
const styleElement = document.createElement('style');
styleElement.textContent = `
  .code-input:focus {
    border-color: #f97316 !important;
    box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.12) !important;
    background: white !important;
    transform: scale(1.02);
  }
  
  .button:hover:not(:disabled) {
    background: #ea580c !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 20px rgba(249, 115, 22, 0.35) !important;
  }
  
  .button:active:not(:disabled) {
    transform: translateY(0) !important;
    box-shadow: 0 2px 8px rgba(249, 115, 22, 0.25) !important;
  }
  
  .resend-button:hover:not(:disabled) {
    color: #ea580c !important;
  }
  
  .back-link:hover {
    color: #f97316 !important;
  }
`;
document.head.appendChild(styleElement);

export default MFAVerification;