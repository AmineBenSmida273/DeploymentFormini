import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService, paymentService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle'; // Assuming this component exists as used in ExploreCourses

export default function CourseDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {
        fetchCourseDetails();
    }, [id]);

    const fetchCourseDetails = async () => {
        try {
            setLoading(true);
            const response = await courseService.getCourse(id);
            setCourse(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Erreur:', error);
            setError("Impossible de charger les détails du cours.");
            setLoading(false);
        }
    };
    const handleEnroll = async () => {
        if (course.prix === 0) {
            try {
                setLoading(true);
                await paymentService.enrollFreeCourse(id);
                // Redirect to chapters or learn page
                navigate(`/course/${id}/chapters`);
            } catch (err) {
                console.error("Free enrollment error:", err);
                setError(err.response?.data?.message || "Erreur lors de l'inscription.");
                setLoading(false);
            }
        } else {
            navigate(`/payment/${id}`);
        }
    };

    if (loading) return (
        <div style={styles.loaderContainer}>
            <div style={styles.spinner}></div>
            <p>Chargement des détails...</p>
        </div>
    );

    if (error || !course) return (
        <div style={styles.container}>
            <div style={styles.errorMessage}>
                {error || "Cours non trouvé"}
                <button onClick={() => navigate('/courses')} style={styles.backBtnError}>
                    Retour au catalogue
                </button>
            </div>
        </div>
    );

    return (
        <div style={styles.container}>
            {/* Header matches ExploreCourses */}
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <div style={styles.headerLeft}>
                        <button onClick={() => navigate('/courses')} style={styles.backButton}>
                            <span>⬅</span> Retour au catalogue
                        </button>
                    </div>
                </div>
            </header>

            <main style={styles.main}>
                {/* Hero Section */}
                <div style={styles.heroCard}>
                    <div style={styles.heroGrid}>
                        {/* Image Section */}
                        <div style={styles.imageWrapper}>
                            {course.image ? (
                                <img src={course.image} alt={course.titre} style={styles.courseImage} />
                            ) : (
                                <div style={styles.imagePlaceholder}>
                                    {course.titre ? course.titre.charAt(0) : 'C'}
                                </div>
                            )}
                            <span style={styles.categoryBadgeHero}>{course.categorie}</span>
                        </div>

                        {/* Info Section */}
                        <div style={styles.infoWrapper}>
                            <h1 style={styles.heroTitle}>{course.titre}</h1>

                            <div style={styles.instructorRow}>
                                <span style={styles.label}>Formateur:</span>
                                <span style={styles.instructorName}>
                                    {course.formateur ? `${course.formateur.prenom} ${course.formateur.nom}` : 'Formini'}
                                </span>
                            </div>

                            <p style={styles.heroDescription}>
                                {course.description}
                            </p>

                            <div style={styles.metaGrid}>

                                <div style={styles.metaItem}>
                                    <span style={styles.metaIcon}>🎓</span>
                                    <span>{course.niveau}</span>
                                </div>
                                <div style={styles.metaItem}>
                                    <span style={styles.metaIcon}>⭐</span>
                                    <span>4.8/5 (24 avis)</span>
                                </div>
                            </div>

                            <div style={styles.priceActionRow}>
                                <div style={styles.priceTag}>
                                    {course.prix > 0 ? `${course.prix} DT` : 'Gratuit'}
                                </div>
                                <button onClick={handleEnroll} style={styles.enrollBtn}>
                                    Participer au cours
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Details Grid */}
                <div style={styles.content}>
                    <div style={styles.sectionCard}>
                        <h2 style={styles.sectionTitle}>✨ Compétences apprises</h2>
                        <ul style={styles.skillsList}>
                            {(() => {
                                let items = [];
                                if (typeof course.programme === 'string') {
                                    items = course.programme.split('\n');
                                } else if (Array.isArray(course.programme)) {
                                    items = course.programme;
                                }

                                return items.length > 0 ? (
                                    items.map((item, i) => (
                                        (typeof item === 'string' && item.trim()) ? (
                                            <li key={i} style={styles.skillItem}>
                                                <span style={styles.checkIcon}>✓</span>
                                                {item.trim()}
                                            </li>
                                        ) : null
                                    ))
                                ) : (
                                    <p style={styles.noInfoText}>Aucune compétence spécifiée.</p>
                                );
                            })()}
                        </ul>
                    </div>

                    <div style={styles.sectionCard}>
                        <h2 style={styles.sectionTitle}>📚 Programme du cours</h2>

                        {/* Display Chapters list */}
                        <div style={styles.lessonList}>
                            {course.chapitres && course.chapitres.length > 0 ? (
                                course.chapitres.map((chapitre, idx) => (
                                    <div key={idx} style={styles.lessonRow}>
                                        <div style={styles.lessonLeft}>
                                            <span style={styles.lessonIndex}>{idx + 1}</span>
                                            <div>
                                                <h4 style={styles.lessonTitle}>{chapitre.titre}</h4>
                                                <span style={styles.lessonDuration}>{chapitre.duree} min</span>
                                            </div>
                                        </div>
                                        <span style={styles.lockIcon}>🔒</span>
                                    </div>
                                ))
                            ) : (
                                (!course.programme) && <p style={styles.noInfoText}>Le programme détaillé sera bientôt disponible.</p>
                            )}
                        </div>
                    </div>
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
        padding: '20px 40px',
        borderBottom: `1px solid ${theme.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
    },
    headerContent: {
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
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
    backBtnError: {
        marginTop: '20px',
        padding: '10px 20px',
        background: theme.primary,
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
    },
    main: {
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '0 20px',
        paddingBottom: '80px',
    },
    // Hero Card
    heroCard: {
        background: theme.paper,
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: theme.shadow, // Using theme shadow
        marginBottom: '40px',
        border: `1px solid ${theme.border}`,
    },
    heroGrid: {
        display: 'grid',
        gridTemplateColumns: 'minmax(300px, 400px) 1fr',
        gap: '0', // Gap handled by padding if needed, or keeping tight
        '@media (max-width: 900px)': {
            gridTemplateColumns: '1fr',
        }
    },
    imageWrapper: {
        height: '100%',
        minHeight: '300px',
        background: '#e5e7eb',
        position: 'relative',
    },
    courseImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '80px',
        color: '#9ca3af',
        background: '#f3f4f6',
        fontWeight: 'bold',
    },
    categoryBadgeHero: {
        position: 'absolute',
        top: '20px',
        left: '20px',
        padding: '8px 16px',
        background: theme.primary,
        color: 'white',
        borderRadius: '30px',
        fontSize: '14px',
        fontWeight: '700',
        boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
    },
    infoWrapper: {
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
    },
    heroTitle: {
        margin: '0 0 15px 0',
        fontSize: '32px',
        fontWeight: '800',
        color: theme.text,
        lineHeight: '1.2',
    },
    instructorRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '20px',
        fontSize: '16px',
    },
    label: {
        color: theme.textSecondary,
    },
    instructorName: {
        fontWeight: '600',
        color: theme.primary,
    },
    heroDescription: {
        color: theme.textSecondary,
        fontSize: '16px',
        lineHeight: '1.6',
        marginBottom: '30px',
        maxWidth: '700px',
    },
    metaGrid: {
        display: 'flex',
        gap: '30px',
        marginBottom: '30px',
        flexWrap: 'wrap',
    },
    metaItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: theme.text,
        fontWeight: '500',
        background: theme.background,
        padding: '8px 16px',
        borderRadius: '12px',
        border: `1px solid ${theme.border}`,
    },
    metaIcon: {
        fontSize: '18px',
    },
    priceActionRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '25px',
        marginTop: 'auto',
        flexWrap: 'wrap',
    },
    priceTag: {
        fontSize: '32px',
        fontWeight: '800',
        color: theme.primary,
    },
    enrollBtn: {
        padding: '16px 40px',
        background: `linear-gradient(135deg, ${theme.primary} 0%, #fb923c 100%)`, // Orange gradient
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '18px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        boxShadow: '0 4px 15px rgba(249, 115, 22, 0.4)',
        ':hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(249, 115, 22, 0.5)',
        }
    },

    // Details Grid for lower section
    content: {
        display: 'grid',
        gap: '50px', // Increased gap for better separation
        '@media (min-width: 900px)': {
            gridTemplateColumns: '1fr 1fr', // or '2fr 3fr' as before if desired, but user asked for distance relative to each other. 
            // Actually, if they are side-by-side, gap increases horizontal space. 
            // If stacked, gap increases vertical. 
            // The original intent was side-by-side. I'll restore grid columns.
            gridTemplateColumns: '2fr 3fr',
        }
    },
    detailsGrid: { // Keeping legacy name if needed, but 'content' is used in JSX now.
        display: 'grid',
        gridTemplateColumns: '2fr 3fr', // Left column narrower
        gap: '30px',
        alignItems: 'start',
        '@media (max-width: 900px)': {
            gridTemplateColumns: '1fr',
        }
    },
    sectionCard: {
        background: theme.paper,
        borderRadius: '20px',
        padding: '30px',
        border: `1px solid ${theme.border}`,
        boxShadow: theme.shadow,
    },
    sectionTitle: {
        marginTop: 0,
        marginBottom: '20px',
        fontSize: '22px',
        fontWeight: '700',
        color: theme.text,
        borderBottom: `2px solid ${theme.border}`,
        paddingBottom: '10px',
    },
    skillsList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    skillItem: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        fontSize: '16px',
        color: theme.textSecondary,
        lineHeight: '1.5',
    },
    checkIcon: {
        color: '#10b981', // Emerald green
        fontWeight: 'bold',
        marginTop: '2px',
    },
    noInfoText: {
        color: theme.textSecondary,
        fontStyle: 'italic',
    },
    // Program / Lessons
    lessonList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    lessonRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        background: theme.background,
        borderRadius: '12px',
        border: `1px solid ${theme.border}`,
        transition: 'background 0.2s',
        ':hover': {
            background: theme.mode === 'dark' ? '#2d3748' : '#f9fafb',
        }
    },
    lessonLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
    },
    lessonIndex: {
        width: '30px',
        height: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.paper,
        borderRadius: '50%',
        color: theme.textSecondary,
        fontWeight: '700',
        fontSize: '14px',
        border: `1px solid ${theme.border}`,
    },
    lessonTitle: {
        margin: '0 0 4px 0',
        fontSize: '16px',
        fontWeight: '600',
        color: theme.text,
    },
    lessonDuration: {
        fontSize: '13px',
        color: theme.textSecondary,
    },
    lockIcon: {
        opacity: 0.5,
        fontSize: '18px',
    },
    programmeText: {
        whiteSpace: 'pre-wrap',
        color: theme.textSecondary,
        lineHeight: '1.6',
    },
    // Common
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
        fontWeight: '600',
        alignItems: 'center',
        padding: '15px',
        background: theme.background,
        borderRadius: '8px',
        gap: '20px',
        border: `1px solid ${theme.border}`,
    },
    lessonIndex: {
        fontWeight: 'bold',
        color: theme.textSecondary,
    },
    lessonInfo: {
        flex: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: theme.text,
    },
    lock: {
        fontSize: '20px',
    }
});
