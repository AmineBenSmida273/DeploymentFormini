import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';

export default function CourseChaptersPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const styles = getStyles(theme);

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedChapters, setExpandedChapters] = useState(new Set([0])); // Premier chapitre ouvert par défaut

    useEffect(() => {
        fetchCourseData();
    }, [courseId]);

    const fetchCourseData = async () => {
        try {
            setLoading(true);
            const response = await courseService.getCourse(courseId);
            setCourse(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching course:', err);
            setError('Impossible de charger le cours');
            setLoading(false);
        }
    };

    const toggleChapter = (index) => {
        setExpandedChapters(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const handleStartCourse = () => {
        // Rediriger vers la première leçon
        if (course?.chapitres && course.chapitres.length > 0) {
            navigate(`/course/${courseId}/lesson/0/0`);
        }
    };

    const getTypeIcon = (index) => {
        // Icônes basées sur la position ou le type
        const icons = ['📹', '📄', '📚', '🎯', '💡'];
        return icons[index % icons.length];
    };

    if (loading) {
        return (
            <div style={styles.loaderContainer}>
                <div style={styles.spinner}></div>
                <p>Chargement du cours...</p>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div style={styles.errorContainer}>
                <p>{error || 'Cours non trouvé'}</p>
                <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
                    Retour au tableau de bord
                </button>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <div>
                        <h1 style={styles.title}>📚 Structure du Cours</h1>
                        <p style={styles.subtitle}>Explorez le contenu pédagogique</p>
                    </div>
                    <div style={styles.headerActions}>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main style={styles.main}>
                {/* Back Button */}
                <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
                    ← Retour au tableau de bord
                </button>

                {/* Course Info Section */}
                <div style={styles.courseInfo}>
                    {course.image && (
                        <img
                            src={course.image}
                            alt={course.titre}
                            style={styles.courseImage}
                        />
                    )}
                    <div style={styles.courseDetails}>
                        <h2 style={styles.courseTitle}>{course.titre}</h2>
                        <p style={styles.instructor}>
                            👨‍🏫 Par {course.formateur?.prenom} {course.formateur?.nom || 'Formini'}
                        </p>
                        {course.description && (
                            <p style={styles.description}>{course.description}</p>
                        )}
                    </div>
                </div>

                {/* Chapters List */}
                <div style={styles.chaptersSection}>
                    <h3 style={styles.sectionTitle}>
                        📖 Programme ({course.chapitres?.length || 0} leçons)
                    </h3>

                    {course.chapitres && course.chapitres.length > 0 ? (
                        <div style={styles.chaptersList}>
                            {course.chapitres.map((chapitre, index) => (
                                <div key={index} style={styles.chapterCard}>
                                    <div
                                        style={styles.chapterHeader}
                                        onClick={() => toggleChapter(index)}
                                    >
                                        <div style={styles.chapterLeft}>
                                            <span style={styles.chapterNumber}>Leçon {index + 1}</span>
                                            <h4 style={styles.chapterTitle}>{chapitre.titre}</h4>
                                        </div>
                                        <div style={styles.chapterRight}>
                                            <span style={styles.chapterDuration}>
                                                ⏱️ {chapitre.duree} min
                                            </span>
                                            <span style={styles.expandIcon}>
                                                {expandedChapters.has(index) ? '▼' : '▶'}
                                            </span>
                                        </div>
                                    </div>

                                    {expandedChapters.has(index) && (
                                        <div style={styles.chapterContent}>
                                            <div style={styles.lessonItem}>
                                                <span style={styles.lessonIcon}>{getTypeIcon(index)}</span>
                                                <div style={styles.lessonDetails}>
                                                    <p style={styles.lessonTitle}>{chapitre.titre}</p>
                                                    <p style={styles.lessonMeta}>
                                                        Durée: {chapitre.duree} minutes
                                                    </p>
                                                </div>
                                            </div>
                                            {chapitre.contenu && (
                                                <p style={styles.chapterDescription}>
                                                    {chapitre.contenu}
                                                </p>
                                            )}
                                            {chapitre.ressources && chapitre.ressources.length > 0 && (
                                                <div style={styles.resources}>
                                                    <strong>📎 Ressources:</strong>
                                                    <ul>
                                                        {chapitre.ressources.map((resource, i) => (
                                                            <li key={i}>
                                                                <a href={resource} target="_blank" rel="noopener noreferrer">
                                                                    Ressource {i + 1}
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={styles.emptyMessage}>
                            Aucune leçon disponible pour ce cours.
                        </p>
                    )}
                </div>

                {/* Start Button */}
                {course.chapitres && course.chapitres.length > 0 && (
                    <div style={styles.startSection}>
                        <button
                            onClick={handleStartCourse}
                            style={styles.startButton}
                        >
                            🚀 Commencer le cours
                        </button>
                    </div>
                )}
            </main>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
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
    },
    headerContent: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    title: {
        margin: 0,
        fontSize: '28px',
        color: theme.text,
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
    main: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
    },
    backButton: {
        padding: '10px 20px',
        background: 'transparent',
        color: theme.text,
        border: `2px solid ${theme.border}`,
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        marginBottom: '30px',
        transition: 'all 0.3s',
    },
    courseInfo: {
        background: theme.paper,
        borderRadius: '16px',
        padding: '30px',
        marginBottom: '40px',
        display: 'flex',
        gap: '30px',
        boxShadow: theme.shadow,
        border: `1px solid ${theme.border}`,
    },
    courseImage: {
        width: '200px',
        height: '200px',
        borderRadius: '12px',
        objectFit: 'cover',
    },
    courseDetails: {
        flex: 1,
    },
    courseTitle: {
        margin: '0 0 10px 0',
        fontSize: '32px',
        color: theme.text,
        fontWeight: '700',
    },
    instructor: {
        margin: '0 0 15px 0',
        fontSize: '16px',
        color: theme.textSecondary,
    },
    description: {
        margin: '15px 0 0 0',
        fontSize: '14px',
        color: theme.textSecondary,
        lineHeight: '1.6',
    },
    chaptersSection: {
        marginBottom: '40px',
    },
    sectionTitle: {
        fontSize: '24px',
        color: theme.text,
        marginBottom: '20px',
        fontWeight: '600',
    },
    chaptersList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    chapterCard: {
        background: theme.paper,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: theme.shadow,
        border: `1px solid ${theme.border}`,
        transition: 'transform 0.2s',
    },
    chapterHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        cursor: 'pointer',
        transition: 'background 0.2s',
    },
    chapterLeft: {
        flex: 1,
    },
    chapterNumber: {
        display: 'block',
        fontSize: '12px',
        color: '#f97316',
        fontWeight: '600',
        marginBottom: '5px',
    },
    chapterTitle: {
        margin: 0,
        fontSize: '18px',
        color: theme.text,
        fontWeight: '600',
    },
    chapterRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
    },
    chapterDuration: {
        fontSize: '14px',
        color: theme.textSecondary,
    },
    expandIcon: {
        fontSize: '16px',
        color: '#f97316',
        transition: 'transform 0.3s',
    },
    chapterContent: {
        padding: '0 20px 20px 20px',
        borderTop: `1px solid ${theme.border}`,
        animation: 'slideDown 0.3s ease',
    },
    lessonItem: {
        display: 'flex',
        gap: '15px',
        padding: '15px',
        background: theme.background,
        borderRadius: '8px',
        marginTop: '15px',
    },
    lessonIcon: {
        fontSize: '24px',
    },
    lessonDetails: {
        flex: 1,
    },
    lessonTitle: {
        margin: '0 0 5px 0',
        fontSize: '16px',
        color: theme.text,
        fontWeight: '500',
    },
    lessonMeta: {
        margin: 0,
        fontSize: '13px',
        color: theme.textSecondary,
    },
    chapterDescription: {
        margin: '15px 0 0 0',
        fontSize: '14px',
        color: theme.textSecondary,
        lineHeight: '1.6',
    },
    resources: {
        marginTop: '15px',
        fontSize: '14px',
        color: theme.text,
    },
    emptyMessage: {
        textAlign: 'center',
        color: theme.textSecondary,
        padding: '40px',
        fontSize: '16px',
    },
    startSection: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '40px',
    },
    startButton: {
        padding: '15px 40px',
        background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '18px',
        fontWeight: '700',
        boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)',
        transition: 'all 0.3s',
    },
    loaderContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: '#fff',
    },
    spinner: {
        border: '4px solid rgba(255, 255, 255, 0.3)',
        borderTop: '4px solid white',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px',
    },
    errorContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: '#fff',
    },
});
