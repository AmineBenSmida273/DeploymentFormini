import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function AdminCourses() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const styles = getStyles(theme);

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('tous');
    const [filterCategory, setFilterCategory] = useState('tous');
    const [filterLevel, setFilterLevel] = useState('tous');
    const [selectedCourses, setSelectedCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [sortBy, setSortBy] = useState('titre');
    const [sortOrder, setSortOrder] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [viewMode, setViewMode] = useState('table'); // 'table' ou 'grid'
    const [showCharts, setShowCharts] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await courseService.getAllCourses();
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
        const gratuits = courses.filter(c => c.prix === 0).length;
        const payants = courses.filter(c => c.prix > 0).length;

        // Stats par catégorie
        const parCategorie = {};
        courses.forEach(c => {
            parCategorie[c.categorie] = (parCategorie[c.categorie] || 0) + 1;
        });

        return { total, approuves, enAttente, rejetes, revenus, gratuits, payants, parCategorie };
    }, [courses]);

    // Filtrage et recherche
    const filteredCourses = useMemo(() => {
        let filtered = [...courses];

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(course =>
                course.titre?.toLowerCase().includes(search) ||
                course.categorie?.toLowerCase().includes(search) ||
                (course.formateur && `${course.formateur.prenom} ${course.formateur.nom}`.toLowerCase().includes(search))
            );
        }

        if (filterStatus !== 'tous') {
            filtered = filtered.filter(c => c.statut === filterStatus);
        }

        if (filterCategory !== 'tous') {
            filtered = filtered.filter(c => c.categorie === filterCategory);
        }

        if (filterLevel !== 'tous') {
            filtered = filtered.filter(c => c.niveau === filterLevel);
        }

        filtered.sort((a, b) => {
            let aVal = a[sortBy] || '';
            let bVal = b[sortBy] || '';

            if (sortBy === 'formateur') {
                aVal = a.formateur ? `${a.formateur.prenom} ${a.formateur.nom}` : '';
                bVal = b.formateur ? `${b.formateur.prenom} ${b.formateur.nom}` : '';
            }

            if (typeof aVal === 'string') {
                return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });

        return filtered;
    }, [courses, searchTerm, filterStatus, filterCategory, filterLevel, sortBy, sortOrder]);

    // Pagination
    const paginatedCourses = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredCourses.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredCourses, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);

    const categories = useMemo(() => {
        return [...new Set(courses.map(c => c.categorie))].filter(Boolean);
    }, [courses]);

    const handleCourseStatus = async (courseId, newStatus) => {
        try {
            if (!window.confirm(`Voulez-vous vraiment passer le statut à "${newStatus}" ?`)) return;
            await courseService.updateCourse(courseId, { statut: newStatus });
            fetchCourses();
        } catch (error) {
            console.error('Erreur status cours:', error);
            alert('❌ Erreur mise à jour statut');
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) return;
        try {
            await courseService.deleteCourse(courseId);
            fetchCourses();
        } catch (error) {
            console.error('Erreur suppression cours:', error);
            alert('❌ Erreur suppression');
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedCourses.length === 0) {
            alert('Veuillez sélectionner au moins un cours');
            return;
        }

        if (!window.confirm(`Confirmer l'action "${action}" sur ${selectedCourses.length} cours ?`)) return;

        try {
            for (const courseId of selectedCourses) {
                if (action === 'supprimer') {
                    await courseService.deleteCourse(courseId);
                } else {
                    await courseService.updateCourse(courseId, { statut: action });
                }
            }
            setSelectedCourses([]);
            fetchCourses();
        } catch (error) {
            console.error('Erreur action groupée:', error);
            alert('❌ Erreur lors de l\'action groupée');
        }
    };

    const toggleCourseSelection = (courseId) => {
        setSelectedCourses(prev =>
            prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedCourses.length === paginatedCourses.length) {
            setSelectedCourses([]);
        } else {
            setSelectedCourses(paginatedCourses.map(c => c._id));
        }
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const exportToCSV = () => {
        const headers = ['Titre', 'Formateur', 'Catégorie', 'Niveau', 'Prix', 'Statut'];
        const rows = filteredCourses.map(c => [
            c.titre,
            c.formateur ? `${c.formateur.prenom} ${c.formateur.nom}` : 'Inconnu',
            c.categorie,
            c.niveau,
            c.prix,
            c.statut
        ]);

        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `cours_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
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
                            <h1 style={styles.title}>📚 Gestion des Cours</h1>
                            <p style={styles.subtitle}>Gérez, approuvez et modérez les cours de la plateforme.</p>
                        </div>
                    </div>
                    <div style={styles.headerActions}>
                        <button onClick={() => setShowCharts(!showCharts)} style={styles.iconBtn} title="Graphiques">
                            📊
                        </button>
                        <button onClick={exportToCSV} style={styles.iconBtn} title="Exporter CSV">
                            📥
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
                    <div style={styles.statCard}>
                        <div style={{ ...styles.statIcon, background: '#dbeafe', color: '#1e40af' }}>💰</div>
                        <div>
                            <div style={styles.statValue}>{stats.revenus.toFixed(2)} TND</div>
                            <div style={styles.statLabel}>Revenus Estimés</div>
                        </div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={{ ...styles.statIcon, background: '#e0e7ff', color: '#4338ca' }}>🆓</div>
                        <div>
                            <div style={styles.statValue}>{stats.gratuits}/{stats.payants}</div>
                            <div style={styles.statLabel}>Gratuits/Payants</div>
                        </div>
                    </div>
                </div>

                {/* Graphiques */}
                {showCharts && (
                    <div style={styles.chartsCard}>
                        <h3 style={styles.chartTitle}>📊 Répartition des Cours</h3>
                        <div style={styles.chartsGrid}>
                            {/* Graphique par catégorie */}
                            <div style={styles.chartContainer}>
                                <h4 style={styles.chartSubtitle}>Par Catégorie</h4>
                                {Object.entries(stats.parCategorie).map(([cat, count]) => (
                                    <div key={cat} style={styles.barItem}>
                                        <span style={styles.barLabel}>{cat}</span>
                                        <div style={styles.barTrack}>
                                            <div
                                                style={{
                                                    ...styles.barFill,
                                                    width: `${(count / stats.total) * 100}%`
                                                }}
                                            >
                                                {count}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Graphique par statut */}
                            <div style={styles.chartContainer}>
                                <h4 style={styles.chartSubtitle}>Par Statut</h4>
                                <div style={styles.pieChart}>
                                    <div style={styles.pieItem}>
                                        <div style={{ ...styles.pieDot, background: '#10b981' }}></div>
                                        <span>Approuvés: {stats.approuves}</span>
                                    </div>
                                    <div style={styles.pieItem}>
                                        <div style={{ ...styles.pieDot, background: '#f59e0b' }}></div>
                                        <span>En attente: {stats.enAttente}</span>
                                    </div>
                                    <div style={styles.pieItem}>
                                        <div style={{ ...styles.pieDot, background: '#ef4444' }}></div>
                                        <span>Rejetés: {stats.rejetes}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Barre de recherche et filtres */}
                <div style={styles.filtersCard}>
                    <div style={styles.searchBar}>
                        <span style={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            placeholder="Rechercher par titre, formateur, catégorie..."
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

                        <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} style={styles.filterSelect}>
                            <option value="tous">Tous les niveaux</option>
                            <option value="débutant">Débutant</option>
                            <option value="intermédiaire">Intermédiaire</option>
                            <option value="avancé">Avancé</option>
                        </select>

                        <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} style={styles.filterSelect}>
                            <option value={10}>10 par page</option>
                            <option value={25}>25 par page</option>
                            <option value={50}>50 par page</option>
                            <option value={100}>100 par page</option>
                        </select>
                    </div>
                </div>

                {/* Actions groupées */}
                {selectedCourses.length > 0 && (
                    <div style={styles.bulkActionsBar}>
                        <span style={styles.bulkText}>{selectedCourses.length} cours sélectionné(s)</span>
                        <div style={styles.bulkButtons}>
                            <button onClick={() => handleBulkAction('approuvé')} style={{ ...styles.bulkBtn, background: '#10b981' }}>
                                ✅ Approuver
                            </button>
                            <button onClick={() => handleBulkAction('rejeté')} style={{ ...styles.bulkBtn, background: '#ef4444' }}>
                                ⛔ Rejeter
                            </button>
                            <button onClick={() => handleBulkAction('supprimer')} style={{ ...styles.bulkBtn, background: '#6b7280' }}>
                                🗑️ Supprimer
                            </button>
                            <button onClick={() => setSelectedCourses([])} style={{ ...styles.bulkBtn, background: '#9ca3af' }}>
                                ✖️ Annuler
                            </button>
                        </div>
                    </div>
                )}

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
                            <h3 style={styles.tableTitle}>📋 Liste des Cours ({filteredCourses.length})</h3>
                        </div>
                        <div style={styles.tableContainer}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>
                                            <input
                                                type="checkbox"
                                                checked={selectedCourses.length === paginatedCourses.length && paginatedCourses.length > 0}
                                                onChange={toggleSelectAll}
                                                style={styles.checkbox}
                                            />
                                        </th>
                                        <th style={styles.th}>Image</th>
                                        <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('titre')}>
                                            Titre {sortBy === 'titre' && (sortOrder === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('formateur')}>
                                            Formateur {sortBy === 'formateur' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCourses.includes(course._id)}
                                                        onChange={() => toggleCourseSelection(course._id)}
                                                        style={styles.checkbox}
                                                    />
                                                </td>
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
                                                    <div style={styles.instructorName}>
                                                        {course.formateur ? `${course.formateur.prenom} ${course.formateur.nom}` : 'Inconnu'}
                                                    </div>
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
                                                            style={{ ...styles.actionBtn, background: '#10b981' }}
                                                            title="Approuver"
                                                            onClick={() => handleCourseStatus(course._id, 'approuvé')}
                                                        >✅</button>
                                                        <button
                                                            style={{ ...styles.actionBtn, background: '#ef4444' }}
                                                            title="Rejeter"
                                                            onClick={() => handleCourseStatus(course._id, 'rejeté')}
                                                        >⛔</button>
                                                        <button
                                                            style={{ ...styles.actionBtn, background: '#6b7280' }}
                                                            title="Supprimer"
                                                            onClick={() => handleDeleteCourse(course._id)}
                                                        >🗑️</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="8" style={styles.emptyTd}>Aucun cours trouvé.</td></tr>
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
                                <input
                                    type="checkbox"
                                    checked={selectedCourses.includes(course._id)}
                                    onChange={() => toggleCourseSelection(course._id)}
                                    style={styles.gridCheckbox}
                                />
                                <img
                                    src={course.image || 'https://via.placeholder.com/300x150'}
                                    alt={course.titre}
                                    style={styles.gridImage}
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x150'; }}
                                />
                                <div style={styles.gridContent}>
                                    <h4 style={styles.gridTitle}>{course.titre}</h4>
                                    <p style={styles.gridInstructor}>
                                        👨‍🏫 {course.formateur ? `${course.formateur.prenom} ${course.formateur.nom}` : 'Inconnu'}
                                    </p>
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
                                            👁️ Voir
                                        </button>
                                        <button onClick={() => handleCourseStatus(course._id, 'approuvé')} style={{ ...styles.gridActionBtn, background: '#10b981' }}>
                                            ✅
                                        </button>
                                        <button onClick={() => handleCourseStatus(course._id, 'rejeté')} style={{ ...styles.gridActionBtn, background: '#ef4444' }}>
                                            ⛔
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
                                <span style={styles.modalBadge}>{selectedCourse.categorie}</span>
                                <span style={styles.modalBadge}>{selectedCourse.niveau}</span>
                                <span style={styles.modalBadge}>{selectedCourse.prix === 0 ? 'Gratuit' : `${selectedCourse.prix} TND`}</span>
                            </div>

                            <div style={styles.modalSection}>
                                <h3 style={styles.modalSectionTitle}>📝 Description</h3>
                                <p style={styles.modalText}>{selectedCourse.description}</p>
                            </div>

                            <div style={styles.modalSection}>
                                <h3 style={styles.modalSectionTitle}>👨‍🏫 Formateur</h3>
                                <p style={styles.modalText}>
                                    {selectedCourse.formateur ? `${selectedCourse.formateur.prenom} ${selectedCourse.formateur.nom}` : 'Non défini'}
                                </p>
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
                                <button onClick={() => { handleCourseStatus(selectedCourse._id, 'approuvé'); setSelectedCourse(null); }} style={{ ...styles.modalBtn, background: '#10b981' }}>
                                    ✅ Approuver
                                </button>
                                <button onClick={() => { handleCourseStatus(selectedCourse._id, 'rejeté'); setSelectedCourse(null); }} style={{ ...styles.modalBtn, background: '#ef4444' }}>
                                    ⛔ Rejeter
                                </button>
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
        chartsCard: {
            background: theme.paper,
            padding: '25px',
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            marginBottom: '20px',
        },
        chartTitle: {
            margin: '0 0 20px 0',
            fontSize: '18px',
            fontWeight: '600',
        },
        chartsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px',
        },
        chartContainer: {
            padding: '15px',
        },
        chartSubtitle: {
            margin: '0 0 15px 0',
            fontSize: '14px',
            fontWeight: '600',
            color: theme.textSecondary,
        },
        barItem: {
            marginBottom: '12px',
        },
        barLabel: {
            fontSize: '13px',
            marginBottom: '5px',
            display: 'block',
        },
        barTrack: {
            background: theme.background,
            height: '30px',
            borderRadius: '6px',
            overflow: 'hidden',
        },
        barFill: {
            background: theme.primary,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '12px',
            fontWeight: '600',
            transition: 'width 0.3s',
        },
        pieChart: {
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
        },
        pieItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
        },
        pieDot: {
            width: '16px',
            height: '16px',
            borderRadius: '50%',
        },
        filtersCard: {
            background: theme.paper,
            padding: '20px',
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            marginBottom: '20px',
        },
        searchBar: {
            position: 'relative',
            marginBottom: '15px',
        },
        searchIcon: {
            position: 'absolute',
            left: '15px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '18px',
        },
        searchInput: {
            width: '100%',
            padding: '12px 12px 12px 45px',
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            fontSize: '14px',
            background: theme.background,
            color: theme.text,
            outline: 'none',
            boxSizing: 'border-box',
        },
        filtersRow: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
        },
        filterSelect: {
            padding: '10px',
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            background: theme.background,
            color: theme.text,
            fontSize: '14px',
            cursor: 'pointer',
        },
        bulkActionsBar: {
            background: theme.primary + '20',
            padding: '15px 20px',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
        },
        bulkText: {
            fontWeight: '600',
            color: theme.text,
        },
        bulkButtons: {
            display: 'flex',
            gap: '10px',
        },
        bulkBtn: {
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
        },
        card: {
            background: theme.paper,
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            overflow: 'hidden',
            marginBottom: '20px',
        },
        tableHeader: {
            padding: '20px',
            borderBottom: `1px solid ${theme.border}`,
        },
        tableTitle: {
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
        },
        tableContainer: {
            overflowX: 'auto',
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
        },
        th: {
            padding: '15px',
            textAlign: 'left',
            borderBottom: `2px solid ${theme.border}`,
            fontWeight: '600',
            fontSize: '13px',
            color: theme.textSecondary,
            background: theme.background,
        },
        tr: {
            borderBottom: `1px solid ${theme.border}`,
            transition: 'background 0.2s',
        },
        td: {
            padding: '15px',
            fontSize: '14px',
        },
        checkbox: {
            width: '18px',
            height: '18px',
            cursor: 'pointer',
        },
        courseImage: {
            width: '60px',
            height: '40px',
            objectFit: 'cover',
            borderRadius: '6px',
        },
        courseTitle: {
            fontWeight: '600',
            marginBottom: '4px',
        },
        courseLevel: {
            fontSize: '12px',
            color: theme.textSecondary,
        },
        instructorName: {
            fontSize: '14px',
        },
        categoryBadge: {
            padding: '4px 12px',
            background: theme.primary + '20',
            color: theme.primary,
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500',
        },
        priceTag: {
            fontWeight: '600',
            color: theme.primary,
        },
        statusBadge: {
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500',
        },
        actionsContainer: {
            display: 'flex',
            gap: '8px',
        },
        actionBtn: {
            padding: '6px 10px',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            fontSize: '14px',
            cursor: 'pointer',
        },
        emptyTd: {
            padding: '40px',
            textAlign: 'center',
            color: theme.textSecondary,
        },
        gridContainer: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '20px',
        },
        gridCard: {
            background: theme.paper,
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            overflow: 'hidden',
            position: 'relative',
            transition: 'transform 0.2s, box-shadow 0.2s',
        },
        gridCheckbox: {
            position: 'absolute',
            top: '10px',
            left: '10px',
            width: '20px',
            height: '20px',
            cursor: 'pointer',
            zIndex: 1,
        },
        gridImage: {
            width: '100%',
            height: '150px',
            objectFit: 'cover',
        },
        gridContent: {
            padding: '15px',
        },
        gridTitle: {
            margin: '0 0 10px 0',
            fontSize: '16px',
            fontWeight: '600',
        },
        gridInstructor: {
            margin: '0 0 10px 0',
            fontSize: '13px',
            color: theme.textSecondary,
        },
        gridMeta: {
            display: 'flex',
            gap: '8px',
            marginBottom: '10px',
        },
        gridFooter: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
        },
        gridPrice: {
            fontWeight: '600',
            color: theme.primary,
        },
        gridActions: {
            display: 'flex',
            gap: '8px',
        },
        gridActionBtn: {
            flex: 1,
            padding: '8px',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            fontSize: '13px',
            cursor: 'pointer',
        },
        pagination: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            padding: '20px',
            background: theme.paper,
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
        },
        paginationBtn: {
            padding: '8px 16px',
            background: theme.primary,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
        },
        paginationInfo: {
            fontWeight: '600',
            fontSize: '14px',
        },
        loadingContainer: {
            padding: '60px',
            textAlign: 'center',
        },
        spinner: {
            width: '50px',
            height: '50px',
            border: `4px solid ${theme.border}`,
            borderTop: `4px solid ${theme.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
        },
        modalOverlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
        },
        modalContent: {
            background: theme.paper,
            borderRadius: '16px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            padding: '30px',
        },
        modalClose: {
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: theme.text,
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
            fontWeight: '700',
            marginBottom: '15px',
        },
        modalMeta: {
            display: 'flex',
            gap: '10px',
            marginBottom: '20px',
        },
        modalBadge: {
            padding: '6px 14px',
            background: theme.primary + '20',
            color: theme.primary,
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '500',
        },
        modalSection: {
            marginBottom: '20px',
        },
        modalSectionTitle: {
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '10px',
        },
        modalText: {
            fontSize: '14px',
            lineHeight: '1.6',
            color: theme.textSecondary,
        },
        chapterItem: {
            padding: '10px',
            background: theme.background,
            borderRadius: '6px',
            marginBottom: '8px',
            fontSize: '14px',
        },
        modalActions: {
            display: 'flex',
            gap: '10px',
            marginTop: '25px',
        },
        modalBtn: {
            flex: 1,
            padding: '12px',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
        },
    };
}
