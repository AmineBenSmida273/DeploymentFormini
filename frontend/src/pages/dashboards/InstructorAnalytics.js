import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function InstructorAnalytics() {
    const navigate = useNavigate();
    const { theme, isDarkMode } = useTheme();
    const styles = getStyles(theme);

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('month'); // Pour l'affichage UI, le backend renvoie déjà 30 jours par défaut pour timeline

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await dashboardService.getInstructorStats();
            setStats(response.data);
        } catch (error) {
            console.error('Erreur chargement analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadReport = () => {
        if (!stats) return;

        const doc = new jsPDF();

        // En-tête
        doc.setFontSize(22);
        doc.text('Rapport Analytique Formateur', 14, 20);

        doc.setFontSize(12);
        doc.text(`Généré le: ${new Date().toLocaleDateString()}`, 14, 30);

        // Résumé
        doc.setFontSize(16);
        doc.text('Résumé des Performances', 14, 45);

        const summaryData = [
            ['Revenu Total', `${stats.stats.totalRevenue} TND`],
            ['Nombre d\'étudiants', stats.stats.totalStudents.toString()],
            ['Cours Actifs', stats.stats.activeCourses.toString()],
            ['Note Moyenne', `${stats.stats.averageRating}/5`]
        ];

        autoTable(doc, {
            startY: 50,
            head: [['Métrique', 'Valeur']],
            body: summaryData,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] }
        });

        // Détails par cours
        doc.setFontSize(16);
        doc.text('Détails des Cours', 14, doc.lastAutoTable.finalY + 15);

        const coursesData = stats.myCourses.map(c => [
            c.title,
            c.status,
            `${c.rating}/5`,
            `${c.revenue} TND`,
            c.students.toString()
        ]);

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Titre', 'Statut', 'Note', 'Revenus', 'Étudiants']],
            body: coursesData,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] }
        });

        doc.save('rapport_activite_formateur.pdf');
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <div style={styles.headerLeft}>
                        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
                            ← Retour Dashboard
                        </button>
                        <div>
                            <h1 style={styles.title}>📊 Analytiques</h1>
                            <p style={styles.subtitle}>Suivez vos performances basées sur les données réelles.</p>
                        </div>
                    </div>
                    <div style={styles.headerActions}>
                        <button onClick={downloadReport} style={styles.downloadBtn}>
                            📥 Télécharger le rapport
                        </button>
                    </div>
                </div>
            </header>

            <div style={styles.content}>
                {loading || !stats ? (
                    <div style={styles.loadingContainer}>
                        <div style={styles.spinner}></div>
                        <p>Chargement des données...</p>
                    </div>
                ) : (
                    <>
                        {/* KPI Cards */}
                        <div style={styles.kpiGrid}>
                            <KpiCard
                                title="Revenus Totaux"
                                value={`${stats.stats.totalRevenue} TND`}
                                icon="💰"
                                color="#10b981"
                                theme={theme}
                            />
                            <KpiCard
                                title="Étudiants Inscrits"
                                value={stats.stats.totalStudents}
                                icon="👥"
                                color="#3b82f6"
                                theme={theme}
                            />
                            <KpiCard
                                title="Cours Actifs"
                                value={stats.stats.activeCourses}
                                icon="📚"
                                color="#8b5cf6"
                                theme={theme}
                            />
                            <KpiCard
                                title="Note Moyenne"
                                value={stats.stats.averageRating}
                                icon="⭐"
                                color="#f59e0b"
                                theme={theme}
                            />
                        </div>

                        <div style={styles.chartsRow}>
                            {/* Revenue Chart */}
                            <div style={styles.chartCard}>
                                <h3 style={styles.cardTitle}>📈 Évolution des Revenus (30 derniers jours)</h3>
                                <div style={styles.chartContainer}>
                                    <div style={styles.chartBars}>
                                        {stats.revenueTimeline.map((item, idx) => {
                                            const maxVal = Math.max(...stats.revenueTimeline.map(d => d.revenue), 1); // Avoid div by 0
                                            return (
                                                <div key={idx} style={styles.barGroup}>
                                                    <div
                                                        style={{
                                                            ...styles.bar,
                                                            height: `${(item.revenue / maxVal) * 100}%`
                                                        }}
                                                    >
                                                        <div style={styles.tooltip}>{item.revenue} TND</div>
                                                    </div>
                                                    {/* Show label only every ~5 days to avoid crowding */}
                                                    {idx % 5 === 0 && <div style={styles.barLabel}>{item.date.split(' ')[0]}</div>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Top Courses List */}
                            <div style={styles.chartCard}>
                                <h3 style={styles.cardTitle}>🏆 Cours les plus performants</h3>
                                <div style={styles.topCoursesList}>
                                    {stats.myCourses
                                        .sort((a, b) => b.revenue - a.revenue)
                                        .slice(0, 5)
                                        .map((course, idx) => (
                                            <div key={course.id} style={styles.courseRow}>
                                                <div style={styles.courseRank}>{idx + 1}</div>
                                                <div style={styles.courseInfo}>
                                                    <div style={styles.courseTitle}>{course.title}</div>
                                                    <div style={styles.courseCat}>
                                                        {course.students} étudiants • ⭐ {course.rating}
                                                    </div>
                                                </div>
                                                <div style={styles.coursePrice}>{course.revenue} TND</div>
                                            </div>
                                        ))}
                                    {stats.myCourses.length === 0 && (
                                        <div style={styles.emptyState}>Aucun cours pour le moment.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function KpiCard({ title, value, icon, color, theme }) {
    const cardStyles = {
        background: theme.paper,
        borderRadius: '16px',
        padding: '25px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        boxShadow: theme.shadow,
        border: `1px solid ${theme.border}`
    };

    return (
        <div style={cardStyles}>
            <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: `${color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px'
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '5px' }}>{title}</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: theme.text }}>{value}</div>
            </div>
        </div>
    );
}

function getStyles(theme) {
    return {
        container: {
            minHeight: '100vh',
            background: theme.background,
            color: theme.text,
            fontFamily: "'Inter', sans-serif",
        },
        header: {
            background: theme.paper,
            borderBottom: `1px solid ${theme.border}`,
            padding: '20px 40px',
        },
        headerContent: {
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        headerLeft: {
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
        },
        headerActions: {
            display: 'flex',
            gap: '15px',
            alignItems: 'center',
        },
        backBtn: {
            padding: '10px 20px',
            background: theme.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
        },
        title: {
            margin: '0 0 5px 0',
            fontSize: '28px',
            fontWeight: '700',
        },
        subtitle: {
            margin: 0,
            color: theme.textSecondary,
            fontSize: '14px',
        },
        downloadBtn: {
            padding: '12px 24px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)',
        },
        content: {
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '40px',
        },
        kpiGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '25px',
            marginBottom: '40px',
        },
        chartsRow: {
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '30px',
            alignItems: 'start',
        },
        chartCard: {
            background: theme.paper,
            borderRadius: '20px',
            padding: '30px',
            boxShadow: theme.shadow,
            border: `1px solid ${theme.border}`,
            minHeight: '400px',
        },
        cardTitle: {
            margin: '0 0 30px 0',
            fontSize: '20px',
            fontWeight: '700',
            color: theme.text,
        },
        chartContainer: {
            height: '300px',
            position: 'relative',
        },
        chartBars: {
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'flex-end',
            height: '100%',
            paddingBottom: '30px',
            borderBottom: `1px solid ${theme.border}`,
        },
        barGroup: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            height: '100%',
            justifyContent: 'flex-end',
            width: '20px', // Thinner bars for 30 days
            position: 'relative',
        },
        bar: {
            width: '100%',
            background: theme.primary,
            borderRadius: '4px 4px 0 0',
            transition: 'height 0.5s ease',
            position: 'relative',
            cursor: 'pointer',
            minHeight: '4px',
        },
        barLabel: {
            marginTop: '10px',
            fontSize: '10px',
            color: theme.textSecondary,
            transform: 'rotate(-45deg)',
            whiteSpace: 'nowrap',
        },
        tooltip: {
            position: 'absolute',
            top: '-35px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1e293b',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            opacity: 0,
            transition: 'opacity 0.2s',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 10,
        },
        topCoursesList: {
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
        },
        courseRow: {
            display: 'flex',
            alignItems: 'center',
            padding: '15px',
            background: theme.background,
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
        },
        courseRank: {
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: theme.primary,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '14px',
            marginRight: '15px',
            flexShrink: 0,
        },
        courseInfo: {
            flex: 1,
            minWidth: 0, // Text truncate fix
        },
        courseTitle: {
            fontWeight: '600',
            color: theme.text,
            marginBottom: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        },
        courseCat: {
            fontSize: '12px',
            color: theme.textSecondary,
        },
        coursePrice: {
            fontWeight: 'bold',
            color: '#10b981',
            marginLeft: '10px',
        },
        loadingContainer: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '400px',
            color: theme.textSecondary,
        },
        spinner: {
            border: `4px solid ${theme.border}`,
            borderTop: `4px solid ${theme.primary}`,
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            marginBottom: '15px',
        },
        emptyState: {
            textAlign: 'center',
            color: theme.textSecondary,
            padding: '30px',
        }
    };
}

// Add simple style tag for hover effects
const style = document.createElement('style');
style.textContent = `
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  .bar-group:hover .tooltip { opacity: 1 !important; }
`;
document.head.appendChild(style);
