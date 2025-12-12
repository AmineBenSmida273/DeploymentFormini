import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function InstructorCourses() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const styles = getStyles(theme);

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('tous');
    const [filterCategory, setFilterCategory] = useState('tous');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [sortBy, setSortBy] = useState('titre');
    const [sortOrder, setSortOrder] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [viewMode, setViewMode] = useState('table'); // 'table' ou 'grid'

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await courseService.getMyCourses();
            setCourses(response.data || []);
        } catch (error) {
            console.error('Erreur chargement cours:', error);
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    // Statistiques calculées
    const stats = useMemo(() => {
        const total = courses.length;
        const approuves = courses.filter(c => c.statut === 'approuvé').length;
        const enAttente = courses.filter(c => c.statut === 'en_attente').length;
        const rejetes = courses.filter(c => c.statut === 'rejeté').length;
        const revenus = courses.reduce((sum, c) => sum + (c.prix || 0), 0);

        return { total, approuves, enAttente, rejetes, revenus };
    }, [courses]);

    // Filtrage et recherche
    const filteredCourses = useMemo(() => {
        let filtered = [...courses];

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(course =>
                course.titre?.toLowerCase().includes(search) ||
                course.categorie?.toLowerCase().includes(search)
            );
        }

        if (filterStatus !== 'tous') {
            filtered = filtered.filter(c => c.statut === filterStatus);
        }

        if (filterCategory !== 'tous') {
            filtered = filtered.filter(c => c.categorie === filterCategory);
        }

        filtered.sort((a, b) => {
            let aVal = a[sortBy] || '';
            let bVal = b[sortBy] || '';

            if (typeof aVal === 'string') {
                return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });

        return filtered;
    }, [courses, searchTerm, filterStatus, filterCategory, sortBy, sortOrder]);

    // Pagination
    const paginatedCourses = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredCourses.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredCourses, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);

    const categories = useMemo(() => {
        return [...new Set(courses.map(c => c.categorie))].filter(Boolean);
    }, [courses]);

    const handleDeleteCourse = async (courseId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ? Cette action est irréversible.')) return;
        try {
            await courseService.deleteCourse(courseId);
            fetchCourses();
            if (selectedCourse && selectedCourse._id === courseId) {
                setSelectedCourse(null);
            }
        } catch (error) {
            console.error('Erreur suppression cours:', error);
            alert('❌ Erreur suppression');
        }
    };

    const handleEditCourse = (courseId) => {
        // navigate(`/instructor/edit-course/${courseId}`); 
        alert("Modification à implémenter : Redirection vers page modif");
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
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
                            <h1 style={styles.title}>📚 Mes Cours</h1>
                            <p style={styles.subtitle}>Gérez vos cours et suivez leur statut d'approbation.</p>
                        </div>
                    </div>
                    <div style={styles.headerActions}>
                        <button
                            onClick={() => navigate('/create-course')}
                            style={styles.createBtn}
                        >
                            ➕ Nouveau Cours
                        </button>
                        <button
                            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                            style={styles.iconBtn}
                            title={viewMode === 'table' ? 'Vue grille' : 'Vue tableau'}
                        >
                            {viewMode === 'table' ? '⊞' : '☰'}
                        </button>
                    </div>
                </div>
            </header>

            <div style={styles.content}>
                {/* Statistiques */}
                <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <div style={styles.statIcon}>📊</div>
                        <div>
                            <div style={styles.statValue}>{stats.total}</div>
                            <div style={styles.statLabel}>Total Cours</div>
                        </div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={{ ...styles.statIcon, background: '#dcfce7', color: '#166534' }}>✅</div>
                        <div>
                            <div style={styles.statValue}>{stats.approuves}</div>
                            <div style={styles.statLabel}>Approuvés</div>
                        </div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={{ ...styles.statIcon, background: '#fef3c7', color: '#92400e' }}>⏳</div>
                        <div>
                            <div style={styles.statValue}>{stats.enAttente}</div>
                            <div style={styles.statLabel}>En Attente</div>
                        </div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={{ ...styles.statIcon, background: '#fee2e2', color: '#991b1b' }}>⛔</div>
                        <div>
                            <div style={styles.statValue}>{stats.rejetes}</div>
                            <div style={styles.statLabel}>Rejetés</div>
                        </div>
                    </div>
                </div>

                {/* Barre de recherche et filtres */}
                <div style={styles.filtersCard}>
                    <div style={styles.searchBar}>
                        <span style={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            placeholder="Rechercher par titre, catégorie..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>

                    <div style={styles.filtersRow}>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={styles.filterSelect}>
                            <option value="tous">Tous les statuts</option>
                            <option value="approuvé">✅ Approuvés</option>
                            <option value="en_attente">⏳ En attente</option>
                            <option value="rejeté">⛔ Rejetés</option>
                        </select>

                        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={styles.filterSelect}>
                            <option value="tous">Toutes les catégories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} style={styles.filterSelect}>
                            <option value={10}>10 par page</option>
                            <option value={25}>25 par page</option>
                            <option value={50}>50 par page</option>
                        </select>
                    </div>
                </div>

                {/* Vue Tableau ou Grille */}
                {loading ? (
                    <div style={styles.loadingContainer}>
                        <div style={styles.spinner}></div>
                        <p>Chargement des cours...</p>
                    </div>
                ) : viewMode === 'table' ? (
                    // Vue Tableau
                    <div style={styles.card}>
                        <div style={styles.tableHeader}>
                            <h3 style={styles.tableTitle}>📋 Liste de vos Cours ({filteredCourses.length})</h3>
                        </div>
                        <div style={styles.tableContainer}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Image</th>
                                        <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('titre')}>
                                            Titre {sortBy === 'titre' && (sortOrder === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th style={styles.th}>Catégorie</th>
                                        <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('prix')}>
                                            Prix {sortBy === 'prix' && (sortOrder === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th style={styles.th}>Statut</th>
                                        <th style={styles.th}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedCourses.length > 0 ? (
                                        paginatedCourses.map(course => (
                                            <tr key={course._id} style={styles.tr}>
                                                <td style={styles.td}>
                                                    <img
                                                        src={course.image || 'https://via.placeholder.com/60'}
                                                        alt={course.titre}
                                                        style={styles.courseImage}
                                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/60'; }}
                                                    />
                                                </td>
                                                <td style={styles.td}>
                                                    <div style={styles.courseTitle}>{course.titre}</div>
                                                    <div style={styles.courseLevel}>{course.niveau}</div>
                                                </td>
                                                <td style={styles.td}>
                                                    <span style={styles.categoryBadge}>{course.categorie}</span>
                                                </td>
                                                <td style={styles.td}>
                                                    <span style={styles.priceTag}>
                                                        {course.prix === 0 ? 'Gratuit' : `${course.prix} TND`}
                                                    </span>
                                                </td>
                                                <td style={styles.td}>
                                                    <span style={{
                                                        ...styles.statusBadge,
                                                        background: course.statut === 'approuvé' ? '#dcfce7' :
                                                            course.statut === 'rejeté' ? '#fee2e2' : '#fef3c7',
                                                        color: course.statut === 'approuvé' ? '#166534' :
                                                            course.statut === 'rejeté' ? '#991b1b' : '#92400e'
                                                    }}>
                                                        {course.statut === 'approuvé' ? '✅ Approuvé' :
                                                            course.statut === 'rejeté' ? '⛔ Rejeté' : '⏳ En attente'}
                                                    </span>
                                                </td>
                                                <td style={styles.td}>
                                                    <div style={styles.actionsContainer}>
                                                        <button
                                                            style={{ ...styles.actionBtn, background: '#3b82f6' }}
                                                            title="Voir détails"
                                                            onClick={() => setSelectedCourse(course)}
                                                        >👁️</button>
                                                        <button
                                                            style={{ ...styles.actionBtn, background: '#f59e0b' }}
                                                            title="Modifier"
                                                            onClick={() => handleEditCourse(course._id)}
                                                        >✏️</button>
                                                        <button
                                                            style={{ ...styles.actionBtn, background: '#ef4444' }}
                                                            title="Supprimer"
                                                            onClick={() => handleDeleteCourse(course._id)}
                                                        >🗑️</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="6" style={styles.emptyTd}>Aucun cours trouvé.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    // Vue Grille
                    <div style={styles.gridContainer}>
                        {paginatedCourses.map(course => (
                            <div key={course._id} style={styles.gridCard}>
                                <img
                                    src={course.image || 'https://via.placeholder.com/300x150'}
                                    alt={course.titre}
                                    style={styles.gridImage}
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x150'; }}
                                />
                                <div style={styles.gridContent}>
                                    <h4 style={styles.gridTitle}>{course.titre}</h4>
                                    <div style={styles.gridMeta}>
                                        <span style={styles.categoryBadge}>{course.categorie}</span>
                                        <span style={styles.categoryBadge}>{course.niveau}</span>
                                    </div>
                                    <div style={styles.gridFooter}>
                                        <span style={styles.gridPrice}>
                                            {course.prix === 0 ? 'Gratuit' : `${course.prix} TND`}
                                        </span>
                                        <span style={{
                                            ...styles.statusBadge,
                                            background: course.statut === 'approuvé' ? '#dcfce7' :
                                                course.statut === 'rejeté' ? '#fee2e2' : '#fef3c7',
                                            color: course.statut === 'approuvé' ? '#166534' :
                                                course.statut === 'rejeté' ? '#991b1b' : '#92400e'
                                        }}>
                                            {course.statut === 'approuvé' ? '✅' :
                                                course.statut === 'rejeté' ? '⛔' : '⏳'}
                                        </span>
                                    </div>
                                    <div style={styles.gridActions}>
                                        <button onClick={() => setSelectedCourse(course)} style={{ ...styles.gridActionBtn, background: '#3b82f6' }}>
                                            👁️
                                        </button>
                                        <button onClick={() => handleEditCourse(course._id)} style={{ ...styles.gridActionBtn, background: '#f59e0b' }}>
                                            ✏️
                                        </button>
                                        <button onClick={() => handleDeleteCourse(course._id)} style={{ ...styles.gridActionBtn, background: '#ef4444' }}>
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={styles.pagination}>
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            style={styles.paginationBtn}
                        >
                            ⏮️ Début
                        </button>
                        <button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            style={styles.paginationBtn}
                        >
                            ◀️ Précédent
                        </button>
                        <span style={styles.paginationInfo}>
                            Page {currentPage} sur {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            style={styles.paginationBtn}
                        >
                            Suivant ▶️
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            style={styles.paginationBtn}
                        >
                            Fin ⏭️
                        </button>
                    </div>
                )}

                {/* Modal Détails */}
                {selectedCourse && (
                    <div style={styles.modalOverlay} onClick={() => setSelectedCourse(null)}>
                        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <button style={styles.modalClose} onClick={() => setSelectedCourse(null)}>✖️</button>

                            <img src={selectedCourse.image || 'https://via.placeholder.com/400'} alt={selectedCourse.titre} style={styles.modalImage} />

                            <h2 style={styles.modalTitle}>{selectedCourse.titre}</h2>
                            <div style={styles.modalMeta}>
                                <span style={{
                                    ...styles.statusBadge,
                                    marginRight: '10px',
                                    background: selectedCourse.statut === 'approuvé' ? '#dcfce7' :
                                        selectedCourse.statut === 'rejeté' ? '#fee2e2' : '#fef3c7',
                                    color: selectedCourse.statut === 'approuvé' ? '#166534' :
                                        selectedCourse.statut === 'rejeté' ? '#991b1b' : '#92400e'
                                }}>
                                    {selectedCourse.statut === 'approuvé' ? '✅ Approuvé' :
                                        selectedCourse.statut === 'rejeté' ? '⛔ Rejeté' : '⏳ En attente'}
                                </span>
                                <span style={styles.modalBadge}>{selectedCourse.categorie}</span>
                                <span style={styles.modalBadge}>{selectedCourse.niveau}</span>
                                <span style={styles.modalBadge}>{selectedCourse.prix === 0 ? 'Gratuit' : `${selectedCourse.prix} TND`}</span>
                            </div>

                            {selectedCourse.statut === 'rejeté' && selectedCourse.raisonRejet && (
                                <div style={styles.rejectReasonBox}>
                                    <h3 style={styles.rejectTitle}>❌ Raison du refus</h3>
                                    <p style={styles.rejectText}>{selectedCourse.raisonRejet}</p>
                                </div>
                            )}

                            <div style={styles.modalSection}>
                                <h3 style={styles.modalSectionTitle}>📝 Description</h3>
                                <p style={styles.modalText}>{selectedCourse.description}</p>
                            </div>

                            {selectedCourse.programme && (
                                <div style={styles.modalSection}>
                                    <h3 style={styles.modalSectionTitle}>📚 Programme</h3>
                                    <p style={styles.modalText}>{selectedCourse.programme}</p>
                                </div>
                            )}

                            {selectedCourse.chapitres && selectedCourse.chapitres.length > 0 && (
                                <div style={styles.modalSection}>
                                    <h3 style={styles.modalSectionTitle}>📖 Chapitres ({selectedCourse.chapitres.length})</h3>
                                    {selectedCourse.chapitres.map((chap, idx) => (
                                        <div key={idx} style={styles.chapterItem}>
                                            <strong>{idx + 1}. {chap.titre}</strong> ({chap.duree} min)
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={styles.modalActions}>
                                <button onClick={() => setSelectedCourse(null)} style={{ ...styles.modalBtn, background: '#6b7280' }}>
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                )}
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
            gap: '10px',
        },
        iconBtn: {
            padding: '10px 15px',
            background: theme.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '18px',
        },
        createBtn: {
            padding: '10px 20px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
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
        content: {
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '30px 40px',
        },
        statsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '15px',
            marginBottom: '30px',
        },
        statCard: {
            background: theme.paper,
            padding: '20px',
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
        },
        statIcon: {
            width: '50px',
            height: '50px',
            borderRadius: '10px',
            background: theme.primary + '20',
            color: theme.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
        },
        statValue: {
            fontSize: '24px',
            fontWeight: '700',
            color: theme.text,
        },
        statLabel: {
            fontSize: '12px',
            color: theme.textSecondary,
            marginTop: '4px',
        },
        filtersCard: {
            background: theme.paper,
            padding: '20px',
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            marginBottom: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        searchBar: {
            display: 'flex',
            alignItems: 'center',
            background: theme.background,
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            padding: '8px 15px',
            flex: '1',
            minWidth: '300px',
        },
        searchIcon: {
            fontSize: '18px',
            marginRight: '10px',
            color: theme.textSecondary,
        },
        searchInput: {
            border: 'none',
            background: 'transparent',
            outline: 'none',
            color: theme.text,
            width: '100%',
            fontSize: '15px',
        },
        filtersRow: {
            display: 'flex',
            gap: '15px',
            flexWrap: 'wrap',
        },
        filterSelect: {
            padding: '10px 15px',
            borderRadius: '8px',
            border: `1px solid ${theme.border}`,
            background: theme.background,
            color: theme.text,
            outline: 'none',
            cursor: 'pointer',
        },
        card: {
            background: theme.paper,
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            overflow: 'hidden',
        },
        tableHeader: {
            padding: '20px',
            borderBottom: `1px solid ${theme.border}`,
        },
        tableTitle: {
            margin: 0,
            fontSize: '18px',
        },
        tableContainer: {
            overflowX: 'auto',
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
        },
        th: {
            padding: '15px 20px',
            textAlign: 'left',
            background: theme.background,
            color: theme.textSecondary,
            fontSize: '13px',
            fontWeight: '600',
            borderBottom: `1px solid ${theme.border}`,
            whiteSpace: 'nowrap',
        },
        tr: {
            borderBottom: `1px solid ${theme.border}`,
            transition: 'background 0.2s',
        },
        td: {
            padding: '15px 20px',
            fontSize: '14px',
            verticalAlign: 'middle',
        },
        courseImage: {
            width: '60px',
            height: '40px',
            objectFit: 'cover',
            borderRadius: '6px',
        },
        courseTitle: {
            fontWeight: '600',
            color: theme.text,
        },
        courseLevel: {
            fontSize: '12px',
            color: theme.textSecondary,
        },
        categoryBadge: {
            padding: '4px 8px',
            background: theme.primary + '20',
            color: theme.primary,
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '500',
        },
        priceTag: {
            fontWeight: '600',
            color: theme.text,
        },
        statusBadge: {
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
        },
        actionsContainer: {
            display: 'flex',
            gap: '8px',
        },
        actionBtn: {
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '16px',
            color: 'white',
        },
        emptyTd: {
            padding: '40px',
            textAlign: 'center',
            color: theme.textSecondary,
        },
        // Grille stats
        gridContainer: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
        },
        gridCard: {
            background: theme.paper,
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            overflow: 'hidden',
        },
        gridImage: {
            width: '100%',
            height: '160px',
            objectFit: 'cover',
        },
        gridContent: {
            padding: '20px',
        },
        gridTitle: {
            margin: '0 0 10px 0',
            fontSize: '16px',
            fontWeight: '600',
        },
        gridMeta: {
            display: 'flex',
            gap: '10px',
            marginBottom: '15px',
        },
        gridFooter: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px',
        },
        gridPrice: {
            fontWeight: '700',
            fontSize: '16px',
        },
        gridActions: {
            display: 'flex',
            gap: '10px',
        },
        gridActionBtn: {
            flex: 1,
            padding: '8px',
            borderRadius: '6px',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
        },
        // Pagination
        pagination: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            marginTop: '30px',
        },
        paginationBtn: {
            padding: '8px 15px',
            background: theme.paper,
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            cursor: 'pointer',
            color: theme.text,
        },
        paginationInfo: {
            color: theme.textSecondary,
        },
        // Modal
        modalOverlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
        },
        modalContent: {
            background: theme.paper,
            width: '100%',
            maxWidth: '700px',
            borderRadius: '16px',
            padding: '30px',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto',
            color: theme.text,
        },
        modalClose: {
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: theme.textSecondary,
        },
        modalImage: {
            width: '100%',
            height: '250px',
            objectFit: 'cover',
            borderRadius: '12px',
            marginBottom: '20px',
        },
        modalTitle: {
            fontSize: '24px',
            margin: '0 0 15px 0',
        },
        modalMeta: {
            display: 'flex',
            gap: '10px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            alignItems: 'center',
        },
        modalBadge: {
            padding: '5px 12px',
            background: theme.background,
            border: `1px solid ${theme.border}`,
            borderRadius: '20px',
            fontSize: '13px',
        },
        modalSection: {
            marginBottom: '25px',
        },
        modalSectionTitle: {
            fontSize: '16px',
            marginBottom: '10px',
            color: theme.primary,
        },
        modalText: {
            lineHeight: '1.6',
            color: theme.textSecondary,
        },
        chapterItem: {
            padding: '10px',
            background: theme.background,
            borderRadius: '8px',
            marginBottom: '8px',
            fontSize: '14px',
        },
        modalActions: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '15px',
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: `1px solid ${theme.border}`,
        },
        modalBtn: {
            padding: '10px 25px',
            borderRadius: '8px',
            border: 'none',
            color: 'white',
            fontWeight: '600',
            cursor: 'pointer',
        },
        rejectReasonBox: {
            background: '#fee2e2',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #fecaca',
        },
        rejectTitle: {
            color: '#991b1b',
            margin: '0 0 5px 0',
            fontSize: '16px',
        },
        rejectText: {
            color: '#7f1d1d',
            margin: 0,
        },
    };
}
