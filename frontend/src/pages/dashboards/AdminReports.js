import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import { adminService } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AdminReports() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState({
        userGrowth: [],
        revenue: [],
        topCourses: [],
        summary: {},
        categoryDistribution: [],
        trends: {}
    });

    useEffect(() => {
        const fetchReports = async () => {
            try {
                setLoading(true);
                const response = await adminService.getReports();
                const data = response.data.data;

                console.log('📊 Données des rapports:', data);

                setReportData({
                    userGrowth: data.userGrowth || [],
                    revenue: data.revenue || [],
                    topCourses: data.topCourses || [],
                    summary: data.summary || {},
                    categoryDistribution: data.categoryDistribution || [],
                    trends: data.trends || {}
                });

                setLoading(false);
            } catch (error) {
                console.error('Erreur chargement rapports:', error);
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    const handleExport = (format) => {
        if (format === 'PDF') {
            generatePDF();
        } else if (format === 'CSV') {
            generateCSV();
        }
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        const currentDate = new Date().toLocaleDateString('fr-FR');

        doc.setFontSize(20);
        doc.setTextColor(249, 115, 22);
        doc.text('Rapports Détaillés - Formini', 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Généré le ${currentDate}`, 14, 28);

        let yPosition = 40;

        // Statistiques globales
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('📊 Statistiques Globales', 14, yPosition);
        yPosition += 8;

        const summaryData = [
            ['Total Utilisateurs', reportData.summary.totalUsers || 0],
            ['Étudiants', reportData.summary.totalStudents || 0],
            ['Formateurs', reportData.summary.totalInstructors || 0],
            ['Taux de Rétention', `${reportData.summary.userRetentionRate || 0}%`],
            ['Total Cours', reportData.summary.totalCourses || 0],
            ['Revenus Totaux', `${reportData.summary.totalRevenue || 0} TND`],
        ];

        autoTable(doc, {
            startY: yPosition,
            head: [['Métrique', 'Valeur']],
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: [249, 115, 22] },
            margin: { left: 14 }
        });

        yPosition = doc.lastAutoTable.finalY + 15;

        // Top Courses
        doc.setFontSize(14);
        doc.text('🏆 Top 5 Cours', 14, yPosition);
        yPosition += 8;

        const coursesData = reportData.topCourses.map(c => [
            c.title,
            c.instructor,
            c.enrollments,
            `${c.completionRate}%`,
            c.rating,
            `${c.revenue} TND`
        ]);

        autoTable(doc, {
            startY: yPosition,
            head: [['Cours', 'Formateur', 'Inscriptions', 'Complétion', 'Note', 'Revenus']],
            body: coursesData,
            theme: 'grid',
            headStyles: { fillColor: [249, 115, 22] },
            margin: { left: 14 }
        });

        doc.save(`rapport_formini_${currentDate}.pdf`);
    };

    const generateCSV = () => {
        const headers = ['Cours', 'Formateur', 'Inscriptions', 'Taux Complétion', 'Note', 'Revenus'];
        const rows = reportData.topCourses.map(c => [
            c.title,
            c.instructor,
            c.enrollments,
            `${c.completionRate}%`,
            c.rating,
            `${c.revenue} TND`
        ]);

        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `rapport_formini_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    if (loading) {
        return (
            <div style={styles.loading}>
                <div style={styles.spinner}></div>
                <p>Chargement des rapports...</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <div>
                        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
                            ← Retour
                        </button>
                        <h1 style={styles.title}>📊 Rapports Détaillés</h1>
                        <p style={styles.subtitle}>Analyses et statistiques complètes de la plateforme</p>
                    </div>
                    <div style={styles.headerActions}>
                        <ThemeToggle />
                        <button onClick={() => handleExport('PDF')} style={styles.exportBtn}>
                            📄 Exporter PDF
                        </button>
                        <button onClick={() => handleExport('CSV')} style={styles.exportBtn}>
                            📊 Exporter CSV
                        </button>
                    </div>
                </div>
            </header>

            <main style={styles.main}>
                {/* Statistiques Clés */}
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>📈 Statistiques Clés</h2>
                    <div style={styles.statsGrid}>
                        <div style={styles.statCard}>
                            <div style={styles.statIcon}>👥</div>
                            <div>
                                <div style={styles.statValue}>{reportData.summary.totalUsers || 0}</div>
                                <div style={styles.statLabel}>Total Utilisateurs</div>
                                <div style={styles.statTrend}>
                                    {reportData.summary.avgMonthlyUserGrowth || '0%'} / mois
                                </div>
                            </div>
                        </div>

                        <div style={styles.statCard}>
                            <div style={styles.statIcon}>💰</div>
                            <div>
                                <div style={styles.statValue}>{reportData.summary.totalRevenue || 0} TND</div>
                                <div style={styles.statLabel}>Revenus Totaux</div>
                                <div style={styles.statTrend}>
                                    {reportData.summary.avgMonthlyRevenueGrowth || '0%'} / mois
                                </div>
                            </div>
                        </div>

                        <div style={styles.statCard}>
                            <div style={styles.statIcon}>📚</div>
                            <div>
                                <div style={styles.statValue}>{reportData.summary.totalCourses || 0}</div>
                                <div style={styles.statLabel}>Total Cours</div>
                                <div style={styles.statTrend}>
                                    {reportData.summary.courseApprovalRate || 0}% approuvés
                                </div>
                            </div>
                        </div>

                        <div style={styles.statCard}>
                            <div style={styles.statIcon}>✅</div>
                            <div>
                                <div style={styles.statValue}>{reportData.summary.userRetentionRate || 0}%</div>
                                <div style={styles.statLabel}>Taux de Rétention</div>
                                <div style={styles.statTrend}>
                                    {reportData.summary.activeUsers || 0} actifs
                                </div>
                            </div>
                        </div>

                        <div style={styles.statCard}>
                            <div style={styles.statIcon}>👨‍🏫</div>
                            <div>
                                <div style={styles.statValue}>{reportData.summary.avgCoursesPerInstructor || 0}</div>
                                <div style={styles.statLabel}>Cours / Formateur</div>
                                <div style={styles.statTrend}>
                                    {reportData.summary.totalInstructors || 0} formateurs
                                </div>
                            </div>
                        </div>

                        <div style={styles.statCard}>
                            <div style={styles.statIcon}>🆕</div>
                            <div>
                                <div style={styles.statValue}>{reportData.summary.recentNewUsers || 0}</div>
                                <div style={styles.statLabel}>Nouveaux (30j)</div>
                                <div style={styles.statTrend}>
                                    Tendance: {reportData.trends.userGrowthTrend === 'positive' ? '📈' : '📉'}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Croissance Utilisateurs */}
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>📈 Croissance des Utilisateurs (6 derniers mois)</h2>
                    <div style={styles.chartCard}>
                        <div style={styles.chart}>
                            {reportData.userGrowth.map((item, index) => {
                                const maxValue = Math.max(...reportData.userGrowth.map(i => i.total || 0));
                                const height = maxValue > 0 ? (item.total / maxValue) * 200 : 0;

                                return (
                                    <div key={index} style={styles.chartBar}>
                                        <div style={styles.chartBarContainer}>
                                            <div
                                                style={{
                                                    ...styles.chartBarFill,
                                                    height: `${height}px`,
                                                    background: 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)'
                                                }}
                                                title={`Total: ${item.total}`}
                                            >
                                                <span style={styles.chartValue}>{item.total}</span>
                                            </div>
                                        </div>
                                        <div style={styles.chartLabel}>{item.month}</div>
                                        {item.growthRate && item.growthRate !== 0 && (
                                            <div style={{
                                                ...styles.chartGrowth,
                                                color: item.growthRate > 0 ? '#10b981' : '#ef4444'
                                            }}>
                                                {item.growthRate > 0 ? '↗' : '↘'} {item.growthRate}%
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Revenus */}
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>💰 Évolution des Revenus</h2>
                    <div style={styles.chartCard}>
                        <div style={styles.chart}>
                            {reportData.revenue.map((item, index) => {
                                const maxValue = Math.max(...reportData.revenue.map(i => i.amount || 0));
                                const height = maxValue > 0 ? (item.amount / maxValue) * 200 : 0;

                                return (
                                    <div key={index} style={styles.chartBar}>
                                        <div style={styles.chartBarContainer}>
                                            <div
                                                style={{
                                                    ...styles.chartBarFill,
                                                    height: `${height}px`,
                                                    background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)'
                                                }}
                                                title={`${item.amount} TND`}
                                            >
                                                <span style={styles.chartValue}>{item.amount.toFixed(0)}</span>
                                            </div>
                                        </div>
                                        <div style={styles.chartLabel}>{item.month}</div>
                                        {item.growthRate && item.growthRate !== 0 && (
                                            <div style={{
                                                ...styles.chartGrowth,
                                                color: item.growthRate > 0 ? '#10b981' : '#ef4444'
                                            }}>
                                                {item.growthRate > 0 ? '↗' : '↘'} {item.growthRate}%
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Top Courses */}
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>🏆 Top 5 Cours par Revenus</h2>
                    <div style={styles.tableCard}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Cours</th>
                                    <th style={styles.th}>Formateur</th>
                                    <th style={styles.th}>Inscriptions</th>
                                    <th style={styles.th}>Complétion</th>
                                    <th style={styles.th}>Note</th>
                                    <th style={styles.th}>Engagement</th>
                                    <th style={styles.th}>Revenus</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.topCourses.map((course, index) => (
                                    <tr key={index} style={styles.tr}>
                                        <td style={styles.td}>
                                            <div style={styles.courseTitle}>{course.title}</div>
                                            <div style={styles.courseCategory}>{course.category} • {course.level}</div>
                                        </td>
                                        <td style={styles.td}>{course.instructor}</td>
                                        <td style={styles.td}>
                                            <span style={styles.badge}>{course.enrollments}</span>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.progressBar}>
                                                <div style={{
                                                    ...styles.progressFill,
                                                    width: `${course.completionRate}%`,
                                                    background: course.completionRate > 70 ? '#10b981' : course.completionRate > 50 ? '#f59e0b' : '#ef4444'
                                                }}></div>
                                            </div>
                                            <span style={styles.progressText}>{course.completionRate}%</span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.rating}>⭐ {course.rating}</span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.engagement}>{course.engagement}</span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.revenue}>{course.revenue.toFixed(2)} TND</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Distribution par Catégorie */}
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>📚 Distribution par Catégorie</h2>
                    <div style={styles.categoryGrid}>
                        {reportData.categoryDistribution.map((cat, index) => (
                            <div key={index} style={styles.categoryCard}>
                                <div style={styles.categoryHeader}>
                                    <span style={styles.categoryName}>{cat.category}</span>
                                    <span style={styles.categoryCount}>{cat.count} cours</span>
                                </div>
                                <div style={styles.categoryBar}>
                                    <div style={{
                                        ...styles.categoryBarFill,
                                        width: `${cat.percentage}%`
                                    }}></div>
                                </div>
                                <div style={styles.categoryPercentage}>{cat.percentage}%</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Tendances */}
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>🔮 Tendances et Insights</h2>
                    <div style={styles.trendsGrid}>
                        <div style={styles.trendCard}>
                            <div style={styles.trendIcon}>📈</div>
                            <div style={styles.trendTitle}>Croissance Utilisateurs</div>
                            <div style={{
                                ...styles.trendValue,
                                color: reportData.trends.userGrowthTrend === 'positive' ? '#10b981' : '#ef4444'
                            }}>
                                {reportData.trends.userGrowthTrend === 'positive' ? 'Positive' : 'Négative'}
                            </div>
                        </div>

                        <div style={styles.trendCard}>
                            <div style={styles.trendIcon}>💰</div>
                            <div style={styles.trendTitle}>Croissance Revenus</div>
                            <div style={{
                                ...styles.trendValue,
                                color: reportData.trends.revenueGrowthTrend === 'positive' ? '#10b981' : '#ef4444'
                            }}>
                                {reportData.trends.revenueGrowthTrend === 'positive' ? 'Positive' : 'Négative'}
                            </div>
                        </div>

                        <div style={styles.trendCard}>
                            <div style={styles.trendIcon}>🏆</div>
                            <div style={styles.trendTitle}>Catégorie Populaire</div>
                            <div style={styles.trendValue}>{reportData.trends.topCategory}</div>
                        </div>

                        <div style={styles.trendCard}>
                            <div style={styles.trendIcon}>⭐</div>
                            <div style={styles.trendTitle}>Cours le Plus Engageant</div>
                            <div style={styles.trendValue}>{reportData.trends.mostEngagedCourse}</div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function getStyles(theme) {
    return {
        container: {
            minHeight: '100vh',
            background: theme.background,
            color: theme.text,
        },
        loading: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: theme.background,
            color: theme.text,
        },
        spinner: {
            width: '50px',
            height: '50px',
            border: `4px solid ${theme.border}`,
            borderTop: `4px solid ${theme.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px',
        },
        header: {
            background: theme.paper,
            padding: '24px 40px',
            borderBottom: `1px solid ${theme.border}`,
        },
        headerContent: {
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
        },
        backBtn: {
            padding: '8px 16px',
            background: theme.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '10px',
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
        headerActions: {
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
        },
        exportBtn: {
            padding: '10px 20px',
            background: theme.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
        },
        main: {
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '30px 40px',
        },
        section: {
            marginBottom: '40px',
        },
        sectionTitle: {
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '20px',
            color: theme.text,
        },
        statsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
        },
        statCard: {
            background: theme.paper,
            padding: '24px',
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
        },
        statIcon: {
            fontSize: '36px',
        },
        statValue: {
            fontSize: '28px',
            fontWeight: '700',
            color: theme.text,
            marginBottom: '4px',
        },
        statLabel: {
            fontSize: '13px',
            color: theme.textSecondary,
            marginBottom: '4px',
        },
        statTrend: {
            fontSize: '12px',
            color: theme.primary,
            fontWeight: '500',
        },
        chartCard: {
            background: theme.paper,
            padding: '30px',
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
        },
        chart: {
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'flex-end',
            gap: '20px',
            minHeight: '250px',
        },
        chartBar: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
        },
        chartBarContainer: {
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            height: '200px',
        },
        chartBarFill: {
            width: '60px',
            borderRadius: '8px 8px 0 0',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '8px 0',
            transition: 'height 0.5s ease',
        },
        chartValue: {
            color: 'white',
            fontSize: '12px',
            fontWeight: '600',
        },
        chartLabel: {
            fontSize: '12px',
            color: theme.textSecondary,
            textAlign: 'center',
        },
        chartGrowth: {
            fontSize: '11px',
            fontWeight: '600',
        },
        tableCard: {
            background: theme.paper,
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            overflow: 'hidden',
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
        },
        th: {
            padding: '16px',
            textAlign: 'left',
            borderBottom: `2px solid ${theme.border}`,
            fontWeight: '600',
            fontSize: '13px',
            color: theme.textSecondary,
            background: theme.background,
        },
        tr: {
            borderBottom: `1px solid ${theme.border}`,
        },
        td: {
            padding: '16px',
            fontSize: '14px',
        },
        courseTitle: {
            fontWeight: '600',
            marginBottom: '4px',
        },
        courseCategory: {
            fontSize: '12px',
            color: theme.textSecondary,
        },
        badge: {
            padding: '4px 12px',
            background: theme.primary + '20',
            color: theme.primary,
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '600',
        },
        progressBar: {
            width: '100px',
            height: '8px',
            background: theme.background,
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '4px',
        },
        progressFill: {
            height: '100%',
            borderRadius: '4px',
            transition: 'width 0.3s',
        },
        progressText: {
            fontSize: '12px',
            color: theme.textSecondary,
        },
        rating: {
            fontSize: '14px',
            fontWeight: '600',
        },
        engagement: {
            fontSize: '14px',
            fontWeight: '600',
            color: theme.primary,
        },
        revenue: {
            fontSize: '14px',
            fontWeight: '700',
            color: '#10b981',
        },
        categoryGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
        },
        categoryCard: {
            background: theme.paper,
            padding: '20px',
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
        },
        categoryHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px',
        },
        categoryName: {
            fontWeight: '600',
            fontSize: '14px',
        },
        categoryCount: {
            fontSize: '13px',
            color: theme.textSecondary,
        },
        categoryBar: {
            width: '100%',
            height: '8px',
            background: theme.background,
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '8px',
        },
        categoryBarFill: {
            height: '100%',
            background: theme.primary,
            borderRadius: '4px',
            transition: 'width 0.5s',
        },
        categoryPercentage: {
            fontSize: '12px',
            color: theme.textSecondary,
            textAlign: 'right',
        },
        trendsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
        },
        trendCard: {
            background: theme.paper,
            padding: '24px',
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            textAlign: 'center',
        },
        trendIcon: {
            fontSize: '48px',
            marginBottom: '12px',
        },
        trendTitle: {
            fontSize: '14px',
            color: theme.textSecondary,
            marginBottom: '8px',
        },
        trendValue: {
            fontSize: '18px',
            fontWeight: '700',
        },
    };
}
