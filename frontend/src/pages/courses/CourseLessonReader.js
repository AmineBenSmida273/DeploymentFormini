import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService, enrollmentService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function CourseLessonReader() {
    const { courseId, chapterIndex, lessonIndex } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const styles = getStyles(theme);

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [showCertificate, setShowCertificate] = useState(false);
    const [userData, setUserData] = useState(null);

    const currentLessonIndex = parseInt(lessonIndex) || 0;
    const totalLessons = course?.chapitres?.length || 0;
    const currentLesson = course?.chapitres?.[currentLessonIndex];
    const progressPercent = totalLessons > 0 ? Math.round(((currentLessonIndex + 1) / totalLessons) * 100) : 0;

    useEffect(() => {
        fetchCourseData();
        fetchUserData();
    }, [courseId]);

    const fetchUserData = async () => {
        try {
            const authData = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
            if (authData.prenom && authData.nom) {
                setUserData(authData);
            }
        } catch (err) {
            console.error('Error getting user data:', err);
        }
    };

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

    const navigateToLesson = async (index) => {
        // Update progress before navigating
        try {
            await enrollmentService.updateCourseProgress(courseId, index, totalLessons);
        } catch (error) {
            console.error('Error updating progress:', error);
        }
        navigate(`/course/${courseId}/lesson/0/${index}`);
    };

    const handlePrevious = () => {
        if (currentLessonIndex > 0) {
            navigateToLesson(currentLessonIndex - 1);
        }
    };

    const handleNext = async () => {
        if (currentLessonIndex < totalLessons - 1) {
            await navigateToLesson(currentLessonIndex + 1);
        } else {
            // Dernière leçon - marquer le cours comme terminé
            try {
                await enrollmentService.markCourseCompleted(courseId);
                console.log('Course marked as completed');
            } catch (error) {
                console.error('Error marking course completed:', error);
            }
            // Afficher le certificat
            setShowCertificate(true);
        }
    };

    const getYoutubeEmbedUrl = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
    };

    const renderLessonContent = () => {
        if (!currentLesson) return null;

        if (currentLesson.type === 'video') {
            const embedUrl = getYoutubeEmbedUrl(currentLesson.contenu);
            if (embedUrl) {
                return (
                    <div style={styles.videoContainer}>
                        <iframe
                            width="100%"
                            height="500"
                            src={embedUrl}
                            title={currentLesson.titre}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={styles.iframe}
                        ></iframe>
                    </div>
                );
            } else {
                return <p style={styles.errorText}>URL vidéo invalide: {currentLesson.contenu}</p>;
            }
        }

        return (
            <div
                style={styles.lessonContent}
                dangerouslySetInnerHTML={{ __html: currentLesson.contenu }}
            />
        );
    };

    const downloadCertificate = async () => {
        const certificateElement = document.getElementById('certificate');
        if (!certificateElement) return;

        try {
            // Capture the certificate as canvas
            const canvas = await html2canvas(certificateElement, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
            });

            // Calculate dimensions for PDF (A4 landscape)
            const imgWidth = 297; // A4 landscape width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Create PDF
            const pdf = new jsPDF({
                orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

            // Download PDF with student name and course name
            const fileName = `Certificat_${userData?.prenom || 'Student'}_${course?.titre?.replace(/\s+/g, '_') || 'Course'}.pdf`;
            pdf.save(fileName);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Erreur lors de la génération du PDF');
        }
    };

    if (loading) {
        return (
            <div style={styles.loaderContainer}>
                <div style={styles.spinner}></div>
                <p>Chargement de la leçon...</p>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div style={styles.errorContainer}>
                <p>{error || 'Cours non trouvé'}</p>
                <button onClick={() => navigate('/dashboard')} style={styles.button}>
                    Retour au tableau de bord
                </button>
            </div>
        );
    }

    return (
        <div style={fullscreen ? styles.containerFullscreen : styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <div style={styles.headerLeft}>
                        <button
                            onClick={() => navigate(`/course/${courseId}/chapters`)}
                            style={styles.backButton}
                        >
                            ← Retour aux chapitres
                        </button>
                        <h1 style={styles.courseTitle}>{course.titre}</h1>
                    </div>
                    <div style={styles.headerActions}>
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            style={styles.iconButton}
                            title={sidebarCollapsed ? "Afficher la structure" : "Masquer la structure"}
                        >
                            {sidebarCollapsed ? '☰' : '✕'}
                        </button>
                        <button
                            onClick={() => setFullscreen(!fullscreen)}
                            style={styles.iconButton}
                            title={fullscreen ? "Quitter plein écran" : "Mode plein écran"}
                        >
                            {fullscreen ? '⛶' : '⛶'}
                        </button>
                        <ThemeToggle />
                    </div>
                </div>
                {/* Progress Bar */}
                <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${progressPercent}%` }}></div>
                </div>
                <p style={styles.progressText}>
                    Progression: {progressPercent}% • Leçon {currentLessonIndex + 1} sur {totalLessons}
                </p>
            </header>

            <div style={styles.mainWrapper}>
                {/* Sidebar */}
                {!sidebarCollapsed && (
                    <aside style={styles.sidebar}>
                        <h3 style={styles.sidebarTitle}>📚 Structure du cours</h3>
                        <div style={styles.lessonsList}>
                            {course.chapitres && course.chapitres.map((lesson, index) => (
                                <div
                                    key={index}
                                    onClick={() => navigateToLesson(index)}
                                    style={{
                                        ...styles.lessonItem,
                                        ...(index === currentLessonIndex ? styles.lessonItemActive : {})
                                    }}
                                >
                                    <div style={styles.lessonNumber}>
                                        {index === currentLessonIndex ? '▶' : index + 1}
                                    </div>
                                    <div style={styles.lessonInfo}>
                                        <p style={styles.lessonTitle}>{lesson.titre}</p>
                                        <p style={styles.lessonDuration}>⏱️ {lesson.duree} min</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                )}

                {/* Main Content */}
                <main style={sidebarCollapsed ? styles.contentFull : styles.content}>
                    {currentLesson ? (
                        <>
                            <div style={styles.lessonHeader}>
                                <span style={styles.lessonBadge}>
                                    Leçon {currentLessonIndex + 1}
                                </span>
                                <h2 style={styles.lessonHeading}>{currentLesson.titre}</h2>
                                <div style={styles.lessonMeta}>
                                    <span>⏱️ {currentLesson.duree} minutes</span>
                                </div>
                            </div>

                            <div style={styles.lessonBody}>
                                {renderLessonContent()}

                                {currentLesson.ressources && currentLesson.ressources.length > 0 && (
                                    <div style={styles.resources}>
                                        <h4 style={styles.resourcesTitle}>📎 Ressources complémentaires</h4>
                                        <ul style={styles.resourcesList}>
                                            {currentLesson.ressources.map((resource, i) => (
                                                <li key={i}>
                                                    <a
                                                        href={resource}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={styles.resourceLink}
                                                    >
                                                        Ressource {i + 1}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Navigation Buttons */}
                            <div style={styles.navigation}>
                                <button
                                    onClick={handlePrevious}
                                    disabled={currentLessonIndex === 0}
                                    style={{
                                        ...styles.navButton,
                                        ...(currentLessonIndex === 0 ? styles.navButtonDisabled : {})
                                    }}
                                >
                                    ← Leçon précédente
                                </button>
                                <button
                                    onClick={handleNext}
                                    style={{
                                        ...styles.navButton,
                                        ...styles.navButtonNext,
                                    }}
                                >
                                    {currentLessonIndex >= totalLessons - 1 ? '✓ Terminer' : 'Leçon suivante →'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={styles.emptyState}>
                            <p>Leçon non trouvée</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Certificate Modal */}
            {showCertificate && (
                <div style={styles.certificateModal} className="no-print">
                    <div style={styles.certificateCard}>
                        <div style={styles.certificateContent} id="certificate">
                            {/* Decorative corners */}
                            <div style={styles.cornerTopLeft}>
                                <svg width="100" height="100" viewBox="0 0 100 100">
                                    <path d="M 20 10 Q 10 10 10 20 L 10 40 Q 10 30 20 30 L 40 30 Q 30 30 30 20 L 30 10 Q 30 20 20 20 Z" fill="#666" />
                                </svg>
                            </div>
                            <div style={styles.cornerTopRight}>
                                <svg width="100" height="100" viewBox="0 0 100 100">
                                    <path d="M 80 10 Q 90 10 90 20 L 90 40 Q 90 30 80 30 L 60 30 Q 70 30 70 20 L 70 10 Q 70 20 80 20 Z" fill="#666" />
                                </svg>
                            </div>
                            <div style={styles.cornerBottomLeft}>
                                <svg width="100" height="100" viewBox="0 0 100 100">
                                    <path d="M 20 90 Q 10 90 10 80 L 10 60 Q 10 70 20 70 L 40 70 Q 30 70 30 80 L 30 90 Q 30 80 20 80 Z" fill="#666" />
                                </svg>
                            </div>
                            <div style={styles.cornerBottomRight}>
                                <svg width="100" height="100" viewBox="0 0 100 100">
                                    <path d="M 80 90 Q 90 90 90 80 L 90 60 Q 90 70 80 70 L 60 70 Q 70 70 70 80 L 70 90 Q 70 80 80 80 Z" fill="#666" />
                                </svg>
                            </div>

                            {/* Certificate Header */}
                            <h1 style={styles.certificateTitle}>CERTIFICATE</h1>
                            <p style={styles.certificateSubtitle}>OF APPRECIATION</p>
                            <p style={styles.certificateText}>This certificate is proudly awarded to</p>

                            {/* Student Name */}
                            <div style={styles.certificateName}>
                                {userData?.prenom || 'Prénom'} {userData?.nom || 'Nom'}
                            </div>

                            {/* Course Name */}
                            <div style={styles.certificateCourse}>
                                {course?.titre || 'Nom du cours'}
                            </div>

                            {/* Date */}
                            <p style={styles.certificateDate}>
                                Date: {new Date().toLocaleDateString('fr-FR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>

                            {/* Signatures */}
                            <div style={styles.certificateSignatures}>
                                <div style={styles.signatureBlock}>
                                    <div style={styles.signature}>MMMD</div>
                                    <div style={styles.signatureLabel}>Company President</div>
                                </div>

                                {/* Logo */}
                                <div style={styles.certificateLogo}>
                                    <div style={styles.logoBox}>
                                        <span style={styles.logoText}>FO<span style={{ color: '#f97316' }}>RMINI</span></span>
                                    </div>
                                </div>

                                <div style={styles.signatureBlock}>
                                    <div style={styles.signature}>TOTAL</div>
                                    <div style={styles.signatureLabel}>Branch Manager</div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div style={styles.certificateActions} className="no-print">
                            <button
                                onClick={downloadCertificate}
                                style={styles.downloadButton}
                            >
                                📥 Télécharger le certificat
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                style={styles.dashboardButton}
                            >
                                ← Retour au tableau de bord
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @media print {
                    .no-print { display: none !important; }
                    body * { visibility: hidden; }
                    #certificate, #certificate * { visibility: visible; }
                    #certificate { position: absolute; left: 0; top: 0; width: 100%; }
                }
            `}</style>
        </div>
    );
}

const getStyles = (theme) => ({
    container: {
        minHeight: '100vh',
        background: theme.background,
        display: 'flex',
        flexDirection: 'column',
    },
    containerFullscreen: {
        minHeight: '100vh',
        background: theme.background,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
    },
    header: {
        background: theme.paper,
        boxShadow: theme.shadow,
        borderBottom: `1px solid ${theme.border}`,
        padding: '15px 30px',
    },
    headerContent: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1400px',
        margin: '0 auto',
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
    },
    backButton: {
        padding: '8px 16px',
        background: 'transparent',
        color: theme.text,
        border: `2px solid ${theme.border}`,
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'all 0.3s',
    },
    courseTitle: {
        margin: 0,
        fontSize: '20px',
        color: theme.text,
        fontWeight: '600',
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    iconButton: {
        padding: '10px',
        background: theme.background,
        color: theme.text,
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '18px',
        transition: 'all 0.3s',
    },
    progressBar: {
        width: '100%',
        height: '6px',
        background: theme.border,
        borderRadius: '3px',
        overflow: 'hidden',
        marginTop: '15px',
    },
    progressFill: {
        height: '100%',
        background: 'linear-gradient(90deg, #f97316, #fb923c)',
        transition: 'width 0.5s ease',
    },
    progressText: {
        margin: '8px 0 0 0',
        fontSize: '13px',
        color: theme.textSecondary,
        textAlign: 'center',
    },
    mainWrapper: {
        display: 'flex',
        flex: 1,
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
    },
    sidebar: {
        width: '300px',
        background: theme.paper,
        borderRight: `1px solid ${theme.border}`,
        padding: '20px',
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 150px)',
    },
    sidebarTitle: {
        margin: '0 0 20px 0',
        fontSize: '18px',
        color: theme.text,
        fontWeight: '600',
    },
    lessonsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    lessonItem: {
        display: 'flex',
        gap: '12px',
        padding: '12px',
        background: theme.background,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.3s',
        border: `1px solid ${theme.border}`,
    },
    lessonItemActive: {
        background: '#f973161a',
        border: '1px solid #f97316',
    },
    lessonNumber: {
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        background: theme.border,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: '600',
        color: theme.text,
    },
    lessonInfo: {
        flex: 1,
    },
    lessonTitle: {
        margin: '0 0 4px 0',
        fontSize: '14px',
        color: theme.text,
        fontWeight: '500',
    },
    lessonDuration: {
        margin: 0,
        fontSize: '12px',
        color: theme.textSecondary,
    },
    content: {
        flex: 1,
        padding: '30px',
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 150px)',
    },
    contentFull: {
        flex: 1,
        padding: '30px',
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 150px)',
        maxWidth: '900px',
        margin: '0 auto',
    },
    lessonHeader: {
        marginBottom: '30px',
    },
    lessonBadge: {
        display: 'inline-block',
        padding: '6px 12px',
        background: '#f97316',
        color: 'white',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        marginBottom: '10px',
    },
    lessonHeading: {
        margin: '10px 0',
        fontSize: '32px',
        color: theme.text,
        fontWeight: '700',
    },
    lessonMeta: {
        display: 'flex',
        gap: '20px',
        fontSize: '14px',
        color: theme.textSecondary,
    },
    videoContainer: {
        position: 'relative',
        paddingBottom: '56.25%', /* 16:9 */
        height: 0,
        marginBottom: '30px',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: theme.shadow,
    },
    iframe: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
    },
    lessonBody: {
        marginBottom: '40px',
    },
    lessonContent: {
        fontSize: '16px',
        lineHeight: '1.8',
        color: theme.text,
        marginBottom: '30px',
    },
    resources: {
        background: theme.paper,
        padding: '20px',
        borderRadius: '12px',
        border: `1px solid ${theme.border}`,
        marginTop: '30px',
    },
    resourcesTitle: {
        margin: '0 0 15px 0',
        fontSize: '18px',
        color: theme.text,
        fontWeight: '600',
    },
    resourcesList: {
        margin: 0,
        paddingLeft: '20px',
    },
    resourceLink: {
        color: '#f97316',
        textDecoration: 'none',
        fontWeight: '500',
    },
    navigation: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '20px',
        paddingTop: '30px',
        borderTop: `1px solid ${theme.border}`,
    },
    navButton: {
        padding: '12px 24px',
        background: theme.paper,
        color: theme.text,
        border: `2px solid ${theme.border}`,
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'all 0.3s',
    },
    navButtonNext: {
        background: '#f97316',
        color: 'white',
        border: '2px solid #f97316',
    },
    navButtonDisabled: {
        opacity: 0.4,
        cursor: 'not-allowed',
    },
    emptyState: {
        textAlign: 'center',
        padding: '60px 20px',
        color: theme.textSecondary,
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
    button: {
        padding: '12px 24px',
        background: '#f97316',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        marginTop: '20px',
    },
    // Certificate Modal Styles
    certificateModal: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
    },
    certificateCard: {
        background: 'white',
        borderRadius: '12px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    },
    certificateContent: {
        background: '#fefefe',
        border: '15px solid #f97316',
        padding: '60px 80px',
        position: 'relative',
        minHeight: '600px',
    },
    cornerTopLeft: {
        position: 'absolute',
        top: '-5px',
        left: '-5px',
    },
    cornerTopRight: {
        position: 'absolute',
        top: '-5px',
        right: '-5px',
    },
    cornerBottomLeft: {
        position: 'absolute',
        bottom: '-5px',
        left: '-5px',
    },
    cornerBottomRight: {
        position: 'absolute',
        bottom: '-5px',
        right: '-5px',
    },
    certificateTitle: {
        fontSize: '64px',
        fontWeight: '700',
        textAlign: 'center',
        margin: '20px 0 10px 0',
        letterSpacing: '8px',
        fontFamily: 'serif',
        color: '#1a1a1a',
    },
    certificateSubtitle: {
        fontSize: '20px',
        textAlign: 'center',
        margin: '0 0 30px 0',
        letterSpacing: '4px',
        fontFamily: 'serif',
        color: '#444',
    },
    certificateText: {
        fontSize: '16px',
        textAlign: 'center',
        margin: '20px 0 40px 0',
        fontFamily: 'serif',
        color: '#666',
    },
    certificateName: {
        fontSize: '28px',
        fontWeight: '600',
        textAlign: 'center',
        margin: '40px 0',
        padding: '0 40px',
        borderBottom: '2px solid #333',
        paddingBottom: '10px',
        fontFamily: 'serif',
        color: '#1a1a1a',
    },
    certificateCourse: {
        fontSize: '24px',
        textAlign: 'center',
        margin: '40px 0',
        padding: '0 40px',
        borderBottom: '2px solid #333',
        paddingBottom: '10px',
        fontFamily: 'serif',
        color: '#1a1a1a',
    },
    certificateDate: {
        fontSize: '16px',
        textAlign: 'center',
        margin: '40px 0',
        fontFamily: 'serif',
        color: '#666',
    },
    certificateSignatures: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: '60px',
        gap: '40px',
    },
    signatureBlock: {
        flex: 1,
        textAlign: 'center',
    },
    signature: {
        fontSize: '34px',
        fontWeight: '600',
        fontFamily: 'cursive',
        marginBottom: '10px',
        color: '#1a1a1a',
    },
    signatureLabel: {
        fontSize: '14px',
        borderTop: '2px solid #333',
        paddingTop: '8px',
        fontFamily: 'serif',
        color: '#666',
    },
    certificateLogo: {
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoBox: {
        border: '4px solid #f97316',
        borderRadius: '50%',
        padding: '20px 30px',
        background: 'white',
    },
    logoText: {
        fontSize: '28px',
        fontWeight: '900',
        color: '#1a1a1a',
    },
    certificateActions: {
        display: 'flex',
        gap: '20px',
        padding: '30px',
        justifyContent: 'center',
        background: '#f9f9f9',
        borderTop: '1px solid #ddd',
    },
    downloadButton: {
        padding: '14px 28px',
        background: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        transition: 'all 0.3s',
    },
    dashboardButton: {
        padding: '14px 28px',
        background: '#f97316',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        transition: 'all 0.3s',
    },
});
