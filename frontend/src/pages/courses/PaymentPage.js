import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import axios from 'axios';

export default function PaymentPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const styles = getStyles(theme);

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' or 'flouci'
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showFlouciModal, setShowFlouciModal] = useState(false);
    const [flouciStep, setFlouciStep] = useState('phone'); // 'phone', 'code', 'processing', 'success'
    const [flouciPhone, setFlouciPhone] = useState('');
    const [flouciCode, setFlouciCode] = useState('');

    // Card form state
    const [cardData, setCardData] = useState({
        name: '',
        number: '',
        expiry: '',
        cvv: ''
    });

    useEffect(() => {
        fetchCourseDetails();
    }, [courseId]);

    const fetchCourseDetails = async () => {
        try {
            setLoading(true);
            const response = await courseService.getCourse(courseId);
            setCourse(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Erreur:', error);
            setError("Impossible de charger les détails du cours.");
            setLoading(false);
        }
    };

    const handleCardInputChange = (e) => {
        const { name, value } = e.target;
        setCardData(prev => ({ ...prev, [name]: value }));
    };

    const handleCardPayment = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setError(null);

        try {
            // Appeler l'API backend pour enregistrer le paiement
            const response = await axios.post(
                'http://localhost:5000/api/payment/card',
                { courseId: courseId },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                setProcessing(false);
                setSuccess(true);
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            }
        } catch (err) {
            console.error('Erreur paiement carte:', err);
            setError(err.response?.data?.message || "Erreur lors du paiement");
            setProcessing(false);
        }
    };

    const handleFlouciPayment = async () => {
        // Show Flouci simulation modal
        setShowFlouciModal(true);
        setFlouciStep('phone');
        setFlouciPhone('');
        setFlouciCode('');
    };

    const handleFlouciPhoneSubmit = (e) => {
        e.preventDefault();
        if (flouciPhone.length >= 8) {
            // Générer un code aléatoire à 6 chiffres
            const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
            setFlouciCode(randomCode);
            setFlouciStep('code');
        }
    };

    const handleFlouciCodeSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setError(null);

        try {
            // Appeler l'API backend pour enregistrer le paiement Flouci
            const response = await axios.post(
                'http://localhost:5000/api/payment/card',
                { courseId: courseId },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                setFlouciStep('success');
                setTimeout(() => {
                    setShowFlouciModal(false);
                    setSuccess(true);
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 2000);
                }, 1500);
            }
        } catch (err) {
            console.error('Erreur paiement Flouci:', err);
            setError(err.response?.data?.message || "Erreur lors du paiement");
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div style={styles.loaderContainer}>
                <div style={styles.spinner}></div>
                <p>Chargement...</p>
            </div>
        );
    }

    if (error && !course) {
        return (
            <div style={styles.container}>
                <div style={styles.errorMessage}>{error}</div>
            </div>
        );
    }

    if (success) {
        return (
            <div style={styles.successContainer}>
                <div style={styles.successCard}>
                    <div style={styles.successIcon}>✓</div>
                    <h2 style={styles.successTitle}>Paiement réussi !</h2>
                    <p style={styles.successText}>Vous êtes maintenant inscrit au cours "{course.titre}"</p>
                    <p style={styles.successSubtext}>Redirection en cours...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <div style={styles.headerLeft}>
                        <button onClick={() => navigate(`/courses/${courseId}`)} style={styles.backButton}>
                            <span>⬅</span> Retour au cours
                        </button>
                        <div>
                            <h1 style={styles.title}>Paiement</h1>
                            <p style={styles.subtitle}>Finalisez votre inscription</p>
                        </div>
                    </div>
                    <div style={styles.headerActions}>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main style={styles.main}>
                <div style={styles.paymentGrid}>
                    {/* Order Summary */}
                    <div style={styles.summarySection}>
                        <h2 style={styles.sectionTitle}>Résumé de commande</h2>

                        {course.image ? (
                            <img src={course.image} alt={course.titre} style={styles.courseImage} />
                        ) : (
                            <div style={styles.imagePlaceholder}>
                                {course.titre.charAt(0)}
                            </div>
                        )}

                        <h3 style={styles.courseTitle}>{course.titre}</h3>

                        <div style={styles.infoRow}>
                            <span style={styles.label}>Formateur:</span>
                            <span style={styles.value}>
                                {course.formateur ? `${course.formateur.prenom} ${course.formateur.nom}` : 'Formini'}
                            </span>
                        </div>

                        <div style={styles.infoRow}>
                            <span style={styles.label}>Catégorie:</span>
                            <span style={styles.value}>{course.categorie}</span>
                        </div>

                        {course.programme && (
                            <div style={styles.skillsSection}>
                                <h4 style={styles.skillsTitle}>Compétences apprises:</h4>
                                <ul style={styles.skillsList}>
                                    {(typeof course.programme === 'string'
                                        ? course.programme.split('\n').slice(0, 3)
                                        : course.programme.slice(0, 3)
                                    ).map((skill, idx) => (
                                        skill && skill.trim() && (
                                            <li key={idx} style={styles.skillItem}>
                                                <span style={styles.checkIcon}>✓</span>
                                                {skill.trim()}
                                            </li>
                                        )
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div style={styles.priceSection}>
                            <div style={styles.priceRow}>
                                <span style={styles.priceLabel}>Prix du cours:</span>
                                <span style={styles.priceValue}>
                                    {course.prix > 0 ? `${course.prix} DT` : 'Gratuit'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div style={styles.paymentSection}>
                        <h2 style={styles.sectionTitle}>Méthode de paiement</h2>

                        <div style={styles.methodSelector}>
                            <label style={styles.methodOption}>
                                <input
                                    type="radio"
                                    value="card"
                                    checked={paymentMethod === 'card'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    style={styles.radio}
                                />
                                <div style={styles.methodLabel}>
                                    <span style={styles.methodIcon}>💳</span>
                                    <div>
                                        <div style={styles.methodName}>Carte bancaire</div>
                                        <div style={styles.methodDesc}>Paiement sécurisé par carte</div>
                                    </div>
                                </div>
                            </label>

                            <label style={styles.methodOption}>
                                <input
                                    type="radio"
                                    value="flouci"
                                    checked={paymentMethod === 'flouci'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    style={styles.radio}
                                />
                                <div style={styles.methodLabel}>
                                    <span style={styles.methodIcon}>📱</span>
                                    <div>
                                        <div style={styles.methodName}>Flouci</div>
                                        <div style={styles.methodDesc}>Paiement mobile sécurisé</div>
                                    </div>
                                </div>
                            </label>
                        </div>

                        {error && <div style={styles.errorBanner}>{error}</div>}

                        {/* Card Payment Form */}
                        {paymentMethod === 'card' && (
                            <form onSubmit={handleCardPayment} style={styles.form}>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Nom du titulaire</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={cardData.name}
                                        onChange={handleCardInputChange}
                                        style={styles.input}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Numéro de carte</label>
                                    <input
                                        type="text"
                                        name="number"
                                        value={cardData.number}
                                        onChange={handleCardInputChange}
                                        style={styles.input}
                                        placeholder="1234 5678 9012 3456"
                                        maxLength="19"
                                        required
                                    />
                                </div>

                                <div style={styles.formRow}>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>Date d'expiration</label>
                                        <input
                                            type="text"
                                            name="expiry"
                                            value={cardData.expiry}
                                            onChange={handleCardInputChange}
                                            style={styles.input}
                                            placeholder="MM/YY"
                                            maxLength="5"
                                            required
                                        />
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>CVV</label>
                                        <input
                                            type="text"
                                            name="cvv"
                                            value={cardData.cvv}
                                            onChange={handleCardInputChange}
                                            style={styles.input}
                                            placeholder="123"
                                            maxLength="3"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    style={processing ? { ...styles.payButton, ...styles.payButtonDisabled } : styles.payButton}
                                >
                                    {processing ? 'Traitement...' : `Payer ${course.prix} DT`}
                                </button>
                            </form>
                        )}

                        {/* Flouci Payment Button */}
                        {paymentMethod === 'flouci' && (
                            <div style={styles.flouciSection}>
                                <p style={styles.flouciText}>
                                    Vous allez être redirigé vers la plateforme Flouci pour finaliser votre paiement de manière sécurisée.
                                </p>
                                <button
                                    onClick={handleFlouciPayment}
                                    disabled={processing}
                                    style={processing ? { ...styles.flouciButton, ...styles.payButtonDisabled } : styles.flouciButton}
                                >
                                    {processing ? 'Redirection...' : 'Payer avec Flouci'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Flouci Simulation Modal */}
            {showFlouciModal && (
                <div style={styles.modalOverlay} onClick={() => setShowFlouciModal(false)}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <div style={styles.flouciLogo}>
                                <span style={{ fontSize: '32px' }}>📱</span>
                                <span style={styles.flouciLogoText}>Flouci</span>
                            </div>
                            <button
                                onClick={() => setShowFlouciModal(false)}
                                style={styles.modalClose}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={styles.modalBody}>
                            {flouciStep === 'phone' && (
                                <form onSubmit={handleFlouciPhoneSubmit} style={styles.flouciForm}>
                                    <h3 style={styles.flouciTitle}>Paiement Mobile</h3>
                                    <p style={styles.flouciDesc}>
                                        Montant: <strong>{course.prix} DT</strong>
                                    </p>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>Numéro de téléphone</label>
                                        <input
                                            type="tel"
                                            value={flouciPhone}
                                            onChange={(e) => setFlouciPhone(e.target.value)}
                                            style={styles.flouciInput}
                                            placeholder="20 123 456"
                                            required
                                            maxLength="8"
                                        />
                                    </div>
                                    <button type="submit" style={styles.flouciSubmitBtn}>
                                        Continuer
                                    </button>
                                </form>
                            )}

                            {flouciStep === 'code' && (
                                <form onSubmit={handleFlouciCodeSubmit} style={styles.flouciForm}>
                                    <h3 style={styles.flouciTitle}>Code de confirmation</h3>
                                    <p style={styles.flouciDesc}>
                                        Un code a été envoyé au <strong>{flouciPhone}</strong>
                                    </p>

                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>Code à 6 chiffres</label>
                                        <input
                                            type="text"
                                            value={flouciCode}
                                            onChange={(e) => setFlouciCode(e.target.value)}
                                            style={styles.flouciInput}
                                            placeholder="123456"
                                            required
                                            maxLength="6"
                                        />
                                    </div>
                                    <button type="submit" style={styles.flouciSubmitBtn}>
                                        Valider le paiement
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFlouciStep('phone')}
                                        style={styles.flouciBackBtn}
                                    >
                                        Modifier le numéro
                                    </button>
                                </form>
                            )}

                            {flouciStep === 'processing' && (
                                <div style={styles.flouciProcessing}>
                                    <div style={styles.spinner}></div>
                                    <h3 style={styles.flouciTitle}>Traitement en cours...</h3>
                                    <p style={styles.flouciDesc}>
                                        Veuillez patienter pendant que nous validons votre paiement
                                    </p>
                                </div>
                            )}

                            {flouciStep === 'success' && (
                                <div style={styles.flouciSuccess}>
                                    <div style={styles.flouciSuccessIcon}>✓</div>
                                    <h3 style={styles.flouciTitle}>Paiement réussi!</h3>
                                    <p style={styles.flouciDesc}>
                                        Votre inscription au cours a été confirmée
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
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
        background: '#6b7280',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'all 0.3s',
        boxShadow: 'none',
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
        paddingBottom: '80px',
    },
    paymentGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1.5fr',
        gap: '40px',
        '@media (max-width: 900px)': {
            gridTemplateColumns: '1fr',
        }
    },
    summarySection: {
        background: theme.paper,
        borderRadius: '20px',
        padding: '30px',
        border: `1px solid ${theme.border}`,
        boxShadow: theme.shadow,
        height: 'fit-content',
    },
    paymentSection: {
        background: theme.paper,
        borderRadius: '20px',
        padding: '30px',
        border: `1px solid ${theme.border}`,
        boxShadow: theme.shadow,
    },
    sectionTitle: {
        marginTop: 0,
        marginBottom: '25px',
        fontSize: '22px',
        fontWeight: '700',
        color: theme.text,
        borderBottom: `2px solid ${theme.border}`,
        paddingBottom: '10px',
    },
    courseImage: {
        width: '100%',
        height: '200px',
        objectFit: 'cover',
        borderRadius: '12px',
        marginBottom: '20px',
    },
    imagePlaceholder: {
        width: '100%',
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6',
        borderRadius: '12px',
        fontSize: '64px',
        fontWeight: 'bold',
        color: '#9ca3af',
        marginBottom: '20px',
    },
    courseTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: theme.text,
        marginBottom: '20px',
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: `1px solid ${theme.border}`,
    },
    label: {
        color: theme.textSecondary,
        fontSize: '14px',
    },
    value: {
        color: theme.text,
        fontSize: '14px',
        fontWeight: '600',
    },
    skillsSection: {
        marginTop: '25px',
    },
    skillsTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: theme.text,
        marginBottom: '12px',
    },
    skillsList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
    },
    skillItem: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        marginBottom: '8px',
        fontSize: '14px',
        color: theme.textSecondary,
    },
    checkIcon: {
        color: '#10b981',
        fontWeight: 'bold',
    },
    priceSection: {
        marginTop: '30px',
        paddingTop: '20px',
        borderTop: `2px solid ${theme.border}`,
    },
    priceRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: '18px',
        fontWeight: '600',
        color: theme.text,
    },
    priceValue: {
        fontSize: '28px',
        fontWeight: '800',
        color: theme.primary,
    },
    methodSelector: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        marginBottom: '30px',
    },
    methodOption: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        padding: '20px',
        border: `2px solid ${theme.border}`,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': {
            borderColor: theme.primary,
            background: theme.background,
        }
    },
    radio: {
        width: '20px',
        height: '20px',
        accentColor: theme.primary,
    },
    methodLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        flex: 1,
    },
    methodIcon: {
        fontSize: '32px',
    },
    methodName: {
        fontSize: '16px',
        fontWeight: '600',
        color: theme.text,
    },
    methodDesc: {
        fontSize: '13px',
        color: theme.textSecondary,
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flex: 1,
    },
    formRow: {
        display: 'flex',
        gap: '15px',
    },
    formLabel: {
        fontSize: '14px',
        fontWeight: '600',
        color: theme.text,
    },
    input: {
        padding: '12px 16px',
        borderRadius: '8px',
        border: `1px solid ${theme.border}`,
        background: theme.background,
        color: theme.text,
        fontSize: '16px',
        outline: 'none',
    },
    payButton: {
        padding: '16px',
        background: `linear-gradient(135deg, ${theme.primary} 0%, #fb923c 100%)`,
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '18px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        boxShadow: '0 4px 15px rgba(249, 115, 22, 0.4)',
        marginTop: '10px',
    },
    payButtonDisabled: {
        opacity: 0.6,
        cursor: 'not-allowed',
    },
    flouciSection: {
        textAlign: 'center',
    },
    flouciText: {
        color: theme.textSecondary,
        marginBottom: '25px',
        lineHeight: '1.6',
    },
    flouciButton: {
        width: '100%',
        padding: '18px',
        background: '#00b4d8',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '18px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 4px 15px rgba(0, 180, 216, 0.3)',
    },
    errorBanner: {
        padding: '15px',
        background: '#fee2e2',
        color: '#dc2626',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '14px',
    },
    loaderContainer: {
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: theme.background,
        color: theme.text,
    },
    spinner: {
        width: '50px',
        height: '50px',
        border: `4px solid ${theme.border}`,
        borderTop: `4px solid ${theme.primary}`,
        borderRadius: '50%',
        margin: '0 auto 20px auto',
        animation: 'spin 1s linear infinite',
    },
    errorMessage: {
        textAlign: 'center',
        padding: '40px',
        color: '#dc2626',
        fontSize: '20px',
    },
    successContainer: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.background,
    },
    successCard: {
        background: theme.paper,
        padding: '60px',
        borderRadius: '24px',
        textAlign: 'center',
        boxShadow: theme.shadow,
        border: `1px solid ${theme.border}`,
    },
    successIcon: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: '#10b981',
        color: 'white',
        fontSize: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 30px auto',
    },
    successTitle: {
        fontSize: '28px',
        fontWeight: '700',
        color: theme.text,
        marginBottom: '15px',
    },
    successText: {
        fontSize: '16px',
        color: theme.textSecondary,
        marginBottom: '10px',
    },
    successSubtext: {
        fontSize: '14px',
        color: theme.textSecondary,
        fontStyle: 'italic',
    },
    // Flouci Modal Styles
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
    },
    modalContent: {
        background: theme.paper,
        borderRadius: '20px',
        width: '90%',
        maxWidth: '450px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        border: `1px solid ${theme.border}`,
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '25px 30px',
        borderBottom: `1px solid ${theme.border}`,
    },
    flouciLogo: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    flouciLogoText: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#00b4d8',
    },
    modalClose: {
        background: 'transparent',
        border: 'none',
        fontSize: '24px',
        color: theme.textSecondary,
        cursor: 'pointer',
        padding: '5px 10px',
        borderRadius: '8px',
        transition: 'all 0.2s',
    },
    modalBody: {
        padding: '30px',
    },
    flouciForm: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    flouciTitle: {
        margin: 0,
        fontSize: '22px',
        fontWeight: '700',
        color: theme.text,
        textAlign: 'center',
    },
    flouciDesc: {
        margin: 0,
        fontSize: '15px',
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: '1.6',
    },
    flouciInput: {
        padding: '14px 18px',
        borderRadius: '10px',
        border: `2px solid ${theme.border}`,
        background: theme.background,
        color: theme.text,
        fontSize: '16px',
        outline: 'none',
        textAlign: 'center',
        fontWeight: '600',
        letterSpacing: '2px',
    },
    flouciSubmitBtn: {
        padding: '16px',
        background: '#00b4d8',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 4px 15px rgba(0, 180, 216, 0.3)',
    },
    flouciBackBtn: {
        padding: '12px',
        background: 'transparent',
        color: theme.textSecondary,
        border: `1px solid ${theme.border}`,
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    flouciProcessing: {
        textAlign: 'center',
        padding: '40px 20px',
    },
    flouciSuccess: {
        textAlign: 'center',
        padding: '40px 20px',
    },
    flouciSuccessIcon: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: '#10b981',
        color: 'white',
        fontSize: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px auto',
    },
});
