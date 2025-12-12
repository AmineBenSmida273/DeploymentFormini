import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, courseService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { jsPDF } from 'jspdf';
// Logo import removed to avoid build errors. We will use text logo.

export default function MyCertificates() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const styles = getStyles(theme);

    const [certificates, setCertificates] = useState([]);
    const [categories, setCategories] = useState(['Tous']);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterCategory, setFilterCategory] = useState('Tous');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [certsRes, catsRes] = await Promise.all([
                    userService.getMyCertificates(),
                    courseService.getCategories()
                ]);
                setCertificates(certsRes.data);
                // Ensure catsRes.data is an array and add 'Tous'
                const cats = Array.isArray(catsRes.data) ? catsRes.data : [];
                setCategories(['Tous', ...cats]);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Impossible de charger les données.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleDownloadPDF = (cert) => {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        // --- BORDERS & ORNAMENTS ---
        // Main Border (Orange)
        doc.setDrawColor(249, 115, 22); // Orange primary
        doc.setLineWidth(4);
        doc.rect(10, 10, 277, 190);

        // Inner Border (Dark Grey) with corner styling
        doc.setDrawColor(55, 65, 81); // Dark grey
        doc.setLineWidth(1);
        doc.rect(15, 15, 267, 180);

        // Corner ornaments (simple lines for elegance)
        doc.setDrawColor(55, 65, 81);
        doc.setLineWidth(2);
        // Top Left
        doc.line(15, 25, 25, 25);
        doc.line(25, 25, 25, 15);
        // Top Right
        doc.line(272, 25, 282, 25); // Adjusted for margin
        doc.line(272, 25, 272, 15);
        // Bottom Left
        doc.line(15, 185, 25, 185);
        doc.line(25, 185, 25, 195);
        // Bottom Right
        doc.line(272, 185, 282, 185);
        doc.line(272, 185, 272, 195);


        // --- HEADER ---
        doc.setFont("times", "normal");
        doc.setFontSize(50);
        doc.setTextColor(31, 41, 55); // Dark text
        doc.text("CERTIFICATE", 148.5, 50, { align: "center" });

        doc.setFontSize(20);
        doc.setFont("times", "normal");
        doc.text("OF APPRECIATION", 148.5, 62, { align: "center", charSpace: 3 });

        // --- AWARD TEXT ---
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(107, 114, 128); // Gray
        // doc.text("This certificate is proudly awarded to", 148.5, 80, { align: "center" });

        // --- STUDENT NAME (Line 1) ---
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const studentName = (user.prenom && user.nom) ? `${user.prenom} ${user.nom}` : "L'Étudiant";

        doc.setFontSize(32);
        doc.setTextColor(31, 41, 55); // Dark
        doc.setFont("times", "italic"); // Italic for script-like feel
        doc.text(studentName, 148.5, 105, { align: "center" });

        // Line under name
        doc.setDrawColor(209, 213, 219); // Light gray line
        doc.setLineWidth(0.5);
        doc.line(70, 108, 227, 108);

        // --- COURSE TITLE (Line 2) ---
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(107, 114, 128);
        // doc.text("pour avoir complété avec succès / for successfully completing", 148.5, 125, { align: "center" });

        doc.setFontSize(24);
        doc.setTextColor(249, 115, 22); // Orange highlight
        doc.setFont("helvetica", "bold");
        doc.text(cert.courseTitle, 148.5, 140, { align: "center" });

        // Line under course
        doc.setDrawColor(209, 213, 219);
        doc.line(70, 143, 227, 143);


        // --- DATE ---
        const dateStr = new Date(cert.date).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        doc.setFontSize(14);
        doc.setTextColor(31, 41, 55);
        doc.setFont("times", "normal");
        doc.text(`Date: ${dateStr}`, 148.5, 155, { align: "center" });


        // --- SIGNATURES ---
        const startY = 175;

        // Signature 1
        doc.setFont("times", "italic");
        doc.setFontSize(20);
        doc.text("Formini Team", 70, startY - 5, { align: "center" }); // Fake signature
        doc.setDrawColor(31, 41, 55);
        doc.line(40, startY, 100, startY);
        doc.setFont("times", "normal");
        doc.setFontSize(12);
        doc.text("Company President", 70, startY + 6, { align: "center" });

        // Logo Center Bottom
        doc.setFontSize(16);
        doc.setTextColor(249, 115, 22); // Orange
        doc.setFont("helvetica", "bold");
        doc.text("F{ }RMINI", 148.5, startY, { align: "center" });

        // Signature 2
        doc.setFont("times", "italic");
        doc.setFontSize(20);
        doc.setTextColor(31, 41, 55);
        doc.text(cert.instructorName, 227, startY - 5, { align: "center" }); // Instructor signature
        doc.line(197, startY, 257, startY);
        doc.setFont("times", "normal");
        doc.setFontSize(12);
        doc.text("Branch Manager", 227, startY + 6, { align: "center" });

        doc.save(`Certificat-${cert.courseTitle.replace(/\s+/g, '-')}.pdf`);
    };

    // Categories are now fetched from backend

    const filteredCertificates = filterCategory === 'Tous'
        ? certificates
        : certificates.filter(c => c.category === filterCategory);

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <div style={styles.headerLeft}>
                        <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
                            <span>⬅</span> Retour au Tableau de Bord
                        </button>
                        <div>
                            <h1 style={styles.title}>Mes Certificats</h1>
                            <p style={styles.subtitle}>Vos accomplissements et diplômes officiels</p>
                        </div>
                    </div>
                    <div style={styles.headerActions}>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main style={styles.main}>
                {/* Stats / Filter Section */}
                <div style={styles.controlsSection}>
                    <div style={styles.statsCard}>
                        <span style={styles.statsNumber}>{certificates.length}</span>
                        <span style={styles.statsLabel}>Certificats obtenus</span>
                    </div>

                    <div style={styles.filterWrapper}>
                        <label style={styles.filterLabel}>Filtrer par catégorie</label>
                        <div style={styles.selectContainer}>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                style={styles.filterSelect}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <span style={styles.selectArrow}>▼</span>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={styles.loaderContainer}>
                        <div style={styles.spinner}></div>
                        <p>Chargement de vos réussites...</p>
                    </div>
                ) : error ? (
                    <div style={styles.errorMessage}>{error}</div>
                ) : filteredCertificates.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyIcon}>🎓</div>
                        <h3>Aucun certificat trouvé</h3>
                        <p style={styles.emptySub}>Terminez des cours pour enrichir votre portfolio professionnel !</p>
                        <button onClick={() => navigate('/dashboard')} style={styles.primaryButton}>
                            Explorer les cours
                        </button>
                    </div>
                ) : (
                    <div style={styles.grid}>
                        {filteredCertificates.map(cert => (
                            <div key={cert.id} style={styles.certCard}>
                                <div style={styles.certOrnament}></div>
                                <div style={styles.certContent}>
                                    <div style={styles.certHeader}>
                                        <span style={styles.categoryBadge}>{cert.category}</span>
                                        <span style={styles.dateBadge}>{new Date(cert.date).toLocaleDateString()}</span>
                                    </div>

                                    <div style={styles.certBody}>
                                        <div style={styles.certIcon}>🏆</div>
                                        <h3 style={styles.certTitle}>{cert.courseTitle}</h3>
                                        <p style={styles.certSubtitle}>Délivré par Formini</p>
                                        <p style={styles.instructorName}>Formateur : {cert.instructorName}</p>
                                    </div>

                                    <div style={styles.certFooter}>
                                        <button
                                            onClick={() => handleDownloadPDF(cert)}
                                            style={styles.downloadBtn}
                                        >
                                            <span style={styles.btnIcon}>📥</span> Télécharger
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

const getStyles = (theme) => ({
    container: {
        minHeight: '100vh',
        background: theme.background, // Keep theme background
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
    headerContent: { // Max width centered
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
        flexDirection: 'column', // Changed to column for title/subtitle
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
        paddingBottom: '60px',
    },
    controlsSection: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '30px',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '40px',
    },
    statsCard: {
        background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryLight})`,
        padding: '20px 30px',
        borderRadius: '16px',
        color: 'white',
        boxShadow: '0 10px 20px rgba(249, 115, 22, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        minWidth: '200px',
    },
    statsNumber: {
        fontSize: '36px',
        fontWeight: '800',
        lineHeight: 1,
    },
    statsLabel: {
        fontSize: '14px',
        opacity: 0.9,
        fontWeight: '500',
    },
    filterWrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    filterLabel: {
        fontSize: '14px',
        fontWeight: '600',
        color: theme.textSecondary,
        marginLeft: '4px',
    },
    selectContainer: {
        position: 'relative',
        width: '250px',
    },
    filterSelect: {
        width: '100%',
        padding: '12px 20px',
        paddingRight: '40px',
        borderRadius: '12px',
        border: `2px solid ${theme.border}`,
        background: theme.paper,
        color: theme.text,
        fontSize: '15px',
        fontWeight: '500',
        appearance: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':focus': {
            borderColor: theme.primary,
            outline: 'none',
            boxShadow: `0 0 0 3px ${theme.primary}20`,
        }
    },
    selectArrow: {
        position: 'absolute',
        right: '15px',
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
        color: theme.textSecondary,
        fontSize: '12px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '30px',
    },
    // New Card Design
    certCard: {
        background: theme.paper,
        borderRadius: '20px',
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${theme.border}`,
        boxShadow: theme.shadow,
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
    },
    certOrnament: {
        height: '8px',
        width: '100%',
        background: `linear-gradient(90deg, ${theme.primary}, ${theme.primaryLight})`,
    },
    certContent: {
        padding: '25px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    certHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '20px',
    },
    categoryBadge: {
        padding: '6px 12px',
        background: theme.paperSecondary,
        color: theme.textSecondary,
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    dateBadge: {
        fontSize: '12px',
        color: theme.textSecondary,
        fontFamily: 'monospace',
        background: theme.background,
        padding: '4px 8px',
        borderRadius: '6px',
        border: `1px solid ${theme.border}`,
    },
    certBody: {
        textAlign: 'center',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '25px',
    },
    certIcon: {
        fontSize: '48px',
        marginBottom: '15px',
        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
    },
    certTitle: {
        margin: '0 0 8px 0',
        fontSize: '18px',
        fontWeight: '700',
        color: theme.text,
        lineHeight: '1.3',
    },
    certSubtitle: {
        margin: '0',
        fontSize: '14px',
        color: theme.textSecondary,
    },
    instructorName: {
        margin: '15px 0 0 0',
        fontSize: '13px',
        color: theme.textSecondary,
        fontStyle: 'italic',
        background: theme.paperSecondary,
        padding: '4px 12px',
        borderRadius: '12px',
    },
    certFooter: {
        marginTop: 'auto',
    },
    downloadBtn: {
        width: '100%',
        padding: '12px',
        background: 'transparent',
        border: `2px solid ${theme.primary}`,
        color: theme.primary,
        borderRadius: '12px',
        fontWeight: '600',
        fontSize: '15px',
        cursor: 'pointer',
        transition: 'all 0.3s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ':hover': {
            background: theme.primary,
            color: 'white',
            transform: 'translateY(-2px)',
            boxShadow: `0 5px 15px ${theme.primary}40`,
        }
    },
    loaderContainer: {
        textAlign: 'center',
        padding: '60px',
        color: theme.textSecondary,
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: `4px solid ${theme.border}`,
        borderTop: `4px solid ${theme.primary}`,
        borderRadius: '50%',
        margin: '0 auto 20px auto',
        animation: 'spin 1s linear infinite',
    },
    emptyState: {
        textAlign: 'center',
        padding: '80px 20px',
        background: theme.paper,
        borderRadius: '24px',
        border: `1px dashed ${theme.border}`,
    },
    emptyIcon: {
        fontSize: '64px',
        marginBottom: '20px',
        opacity: 0.5,
    },
    emptySub: {
        color: theme.textSecondary,
        maxWidth: '400px',
        margin: '10px auto 30px auto',
        lineHeight: '1.5',
    },
    primaryButton: {
        padding: '12px 30px',
        background: theme.primary,
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s',
        boxShadow: '0 4px 6px rgba(249, 115, 22, 0.2)',
        ':hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 15px rgba(249, 115, 22, 0.3)',
        }
    }
});
