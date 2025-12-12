import React, { useState, useEffect } from 'react';
import { courseService } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function PendingCoursesSection() {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const [pendingCourses, setPendingCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [courseToReject, setCourseToReject] = useState(null);

    useEffect(() => {
        fetchPendingCourses();
    }, []);

    const fetchPendingCourses = async () => {
        try {
            setLoading(true);
            const response = await courseService.getPendingCourses();
            setPendingCourses(response.data);
        } catch (error) {
            console.error('Erreur chargement cours en attente:', error);
            alert('Erreur lors du chargement des cours en attente');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (course) => {
        setSelectedCourse(course);
        setShowDetailsModal(true);
    };

    const handleApprove = async (courseId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir approuver ce cours ?')) return;

        try {
            await courseService.approveCourse(courseId);
            alert('✅ Cours approuvé avec succès !');
            fetchPendingCourses();
        } catch (error) {
            console.error('Erreur approbation:', error);
            alert('❌ Erreur lors de l\'approbation du cours');
        }
    };

    const handleOpenRejectModal = (course) => {
        setCourseToReject(course);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            alert('Veuillez indiquer une raison pour le refus');
            return;
        }

        try {
            await courseService.rejectCourse(courseToReject._id, rejectReason);
            alert('✅ Cours rejeté et supprimé');
            setShowRejectModal(false);
            setCourseToReject(null);
            setRejectReason('');
            fetchPendingCourses();
        } catch (error) {
            console.error('Erreur refus:', error);
            alert('❌ Erreur lors du refus du cours');
        }
    };

    if (loading) {
        return <div style={styles.loading}>⏳ Chargement des cours en attente...</div>;
    }

    return (
        <section style={styles.section}>
            <h2 style={styles.sectionTitle}>📋 Cours en Attente d'Approbation ({pendingCourses.length})</h2>

            {pendingCourses.length === 0 ? (
                <div style={styles.emptyState}>
                    <p>✅ Aucun cours en attente d'approbation</p>
                </div>
            ) : (
                <div style={styles.coursesGrid}>
                    {pendingCourses.map(course => (
                        <div key={course._id} style={styles.courseCard}>
                            <div style={styles.courseImage}>
                                <img
                                    src={course.image || '/default-course.jpg'}
                                    alt={course.titre}
                                    style={styles.image}
                                />
                            </div>

                            <div style={styles.courseInfo}>
                                <h3 style={styles.courseTitle}>{course.titre}</h3>
                                <p style={styles.courseFormateur}>
                                    👤 {course.formateur?.prenom} {course.formateur?.nom}
                                </p>
                                <p style={styles.courseEmail}>📧 {course.formateur?.email}</p>
                                <div style={styles.courseMeta}>
                                    <span style={styles.metaItem}>📚 {course.categorie}</span>
                                    <span style={styles.metaItem}>💰 {course.prix} TND</span>
                                    <span style={styles.metaItem}>📊 {course.niveau}</span>
                                </div>
                                <p style={styles.courseChapters}>
                                    📑 {course.chapitres?.length || 0} chapitre(s)
                                </p>
                            </div>

                            <div style={styles.actions}>
                                <button
                                    onClick={() => handleViewDetails(course)}
                                    style={styles.detailsBtn}
                                >
                                    👁️ Voir Détails
                                </button>
                                <button
                                    onClick={() => handleApprove(course._id)}
                                    style={styles.approveBtn}
                                >
                                    ✅ Approuver
                                </button>
                                <button
                                    onClick={() => handleOpenRejectModal(course)}
                                    style={styles.rejectBtn}
                                >
                                    ❌ Refuser
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Détails */}
            {showDetailsModal && selectedCourse && (
                <div style={styles.modalOverlay} onClick={() => setShowDetailsModal(false)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>{selectedCourse.titre}</h2>
                            <button onClick={() => setShowDetailsModal(false)} style={styles.closeBtn}>✕</button>
                        </div>

                        <div style={styles.modalBody}>
                            <div style={styles.detailSection}>
                                <strong>Description:</strong>
                                <p>{selectedCourse.description}</p>
                            </div>

                            {selectedCourse.programme && (
                                <div style={styles.detailSection}>
                                    <strong>Programme:</strong>
                                    <p style={styles.preformatted}>{selectedCourse.programme}</p>
                                </div>
                            )}

                            <div style={styles.detailSection}>
                                <strong>Chapitres ({selectedCourse.chapitres?.length || 0}):</strong>
                                {selectedCourse.chapitres?.map((ch, i) => (
                                    <div key={i} style={styles.chapterDetail}>
                                        <h4>{i + 1}. {ch.titre}</h4>
                                        <p><strong>Type:</strong> {ch.type === 'text' ? '📝 Texte' : ch.type === 'video' ? '📹 Vidéo' : '📄 PDF'}</p>
                                        <p><strong>Description:</strong> {ch.description}</p>
                                        <p><strong>Durée:</strong> {ch.duree} minutes</p>
                                        {ch.type === 'text' && ch.contenu && (
                                            <p style={styles.chapterContent}>{ch.contenu.substring(0, 200)}...</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Refus */}
            {showRejectModal && courseToReject && (
                <div style={styles.modalOverlay} onClick={() => setShowRejectModal(false)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>Refuser le cours</h2>
                            <button onClick={() => setShowRejectModal(false)} style={styles.closeBtn}>✕</button>
                        </div>

                        <div style={styles.modalBody}>
                            <p><strong>Cours:</strong> {courseToReject.titre}</p>
                            <p><strong>Formateur:</strong> {courseToReject.formateur?.prenom} {courseToReject.formateur?.nom}</p>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Raison du refus <span style={styles.required}>*</span></label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Expliquez pourquoi ce cours est refusé..."
                                    rows="5"
                                    style={styles.textarea}
                                />
                            </div>

                            <div style={styles.modalActions}>
                                <button onClick={() => setShowRejectModal(false)} style={styles.cancelBtn}>
                                    Annuler
                                </button>
                                <button onClick={handleReject} style={styles.confirmRejectBtn}>
                                    Confirmer le refus
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

const getStyles = (theme) => ({
    section: {
        background: theme.paper,
        borderRadius: '16px',
        padding: '30px',
        boxShadow: theme.shadow,
        border: `1px solid ${theme.border}`,
        marginBottom: '30px',
    },
    sectionTitle: {
        fontSize: '24px',
        fontWeight: '700',
        color: theme.text,
        marginBottom: '20px',
    },
    loading: {
        textAlign: 'center',
        padding: '40px',
        fontSize: '18px',
        color: theme.textSecondary,
    },
    emptyState: {
        textAlign: 'center',
        padding: '40px',
        color: theme.textSecondary,
        fontSize: '16px',
    },
    coursesGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '20px',
    },
    courseCard: {
        background: theme.background,
        borderRadius: '12px',
        border: `1px solid ${theme.border}`,
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
    },
    courseImage: {
        width: '100%',
        height: '180px',
        overflow: 'hidden',
        background: theme.border,
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    courseInfo: {
        padding: '20px',
    },
    courseTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: theme.text,
        marginBottom: '10px',
    },
    courseFormateur: {
        fontSize: '14px',
        color: theme.text,
        marginBottom: '5px',
    },
    courseEmail: {
        fontSize: '13px',
        color: theme.textSecondary,
        marginBottom: '10px',
    },
    courseMeta: {
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        marginBottom: '10px',
    },
    metaItem: {
        fontSize: '13px',
        color: theme.textSecondary,
        background: theme.paper,
        padding: '4px 8px',
        borderRadius: '4px',
    },
    courseChapters: {
        fontSize: '13px',
        color: theme.textSecondary,
    },
    actions: {
        display: 'flex',
        gap: '10px',
        padding: '15px 20px',
        borderTop: `1px solid ${theme.border}`,
        flexWrap: 'wrap',
    },
    detailsBtn: {
        flex: 1,
        padding: '10px 16px',
        background: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'all 0.2s',
    },
    approveBtn: {
        flex: 1,
        padding: '10px 16px',
        background: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'all 0.2s',
    },
    rejectBtn: {
        flex: 1,
        padding: '10px 16px',
        background: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'all 0.2s',
    },
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
    },
    modal: {
        background: theme.paper,
        borderRadius: '16px',
        maxWidth: '700px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 30px',
        borderBottom: `1px solid ${theme.border}`,
    },
    modalTitle: {
        fontSize: '22px',
        fontWeight: '700',
        color: theme.text,
        margin: 0,
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        color: theme.textSecondary,
        padding: '0',
        width: '30px',
        height: '30px',
    },
    modalBody: {
        padding: '30px',
    },
    detailSection: {
        marginBottom: '20px',
    },
    preformatted: {
        whiteSpace: 'pre-wrap',
        fontSize: '14px',
        color: theme.textSecondary,
    },
    chapterDetail: {
        background: theme.background,
        padding: '15px',
        borderRadius: '8px',
        marginTop: '10px',
        border: `1px solid ${theme.border}`,
    },
    chapterContent: {
        fontSize: '13px',
        color: theme.textSecondary,
        fontStyle: 'italic',
    },
    formGroup: {
        marginBottom: '20px',
    },
    label: {
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        color: theme.text,
        marginBottom: '8px',
    },
    required: {
        color: '#ef4444',
    },
    textarea: {
        width: '100%',
        padding: '12px',
        border: `2px solid ${theme.border}`,
        borderRadius: '8px',
        fontSize: '14px',
        fontFamily: 'inherit',
        background: theme.background,
        color: theme.text,
        resize: 'vertical',
    },
    modalActions: {
        display: 'flex',
        gap: '15px',
        justifyContent: 'flex-end',
    },
    cancelBtn: {
        padding: '12px 24px',
        background: '#6b7280',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
    },
    confirmRejectBtn: {
        padding: '12px 24px',
        background: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
    },
});
