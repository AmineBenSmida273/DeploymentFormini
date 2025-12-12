import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

export default function ExploreCourses() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const styles = getStyles(theme);

    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [categories, setCategories] = useState(['tous']);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('tous');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [coursesRes, catsRes] = await Promise.all([
                courseService.getAllCourses(),
                courseService.getCategories()
            ]);

            setCourses(coursesRes.data);
            setFilteredCourses(coursesRes.data);

            // Ensure catsRes.data is an array
            const cats = Array.isArray(catsRes.data) ? catsRes.data : [];
            // Deduplicate and lowercase
            const uniqueCats = [...new Set(cats.map(c => c.toLowerCase()))];
            setCategories(['tous', ...uniqueCats]);
        } catch (err) {
            console.error("Error loading courses:", err);
            setError("Impossible de charger les cours.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        let result = courses;

        // Filter by category
        if (selectedCategory !== 'tous') {
            result = result.filter(course => course.categorie.toLowerCase() === selectedCategory);
        }

        // Filter by search query (Title or Description)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(course =>
                course.titre.toLowerCase().includes(query) ||
                (course.description && course.description.toLowerCase().includes(query))
            );
        }

        setFilteredCourses(result);
    };

    // Trigger search when enter key is pressed
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <div style={styles.headerLeft}>
                        <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
                            <span>⬅</span> Retour au Tableau de Bord
                        </button>
                        <div>
                            <h1 style={styles.title}>Explorer les Cours</h1>
                            <p style={styles.subtitle}>Découvrez de nouvelles compétences et avancez dans votre carrière</p>
                        </div>
                    </div>
                    <div style={styles.headerActions}>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main style={styles.main}>
                {/* Search & Filter Section */}
                {/* Search & Filter Section */}
                <div style={styles.filterSection}>
                    <div style={styles.statsCard}>
                        <span style={styles.statsNumber}>{filteredCourses.length}</span>
                        <span style={styles.statsLabel}>Cours disponibles</span>
                    </div>

                    <div style={styles.filtersContainer}>
                        <div style={styles.searchGroup}>
                            <input
                                type="text"
                                placeholder="Rechercher un cours..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                style={styles.searchInput}
                            />
                        </div>

                        <div style={styles.filterGroup}>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                style={styles.categorySelect}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <button onClick={handleSearch} style={styles.searchButton}>
                            Rechercher
                        </button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div style={styles.loaderContainer}>
                        <div style={styles.spinner}></div>
                        <p>Chargement du catalogue...</p>
                    </div>
                ) : error ? (
                    <div style={styles.errorMessage}>{error}</div>
                ) : filteredCourses.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyIcon}>🔍</div>
                        <h3>Aucun cours trouvé</h3>
                        <p style={styles.emptySub}>Essayez de modifier vos critères de recherche.</p>
                        <button onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('tous');
                            setFilteredCourses(courses);
                        }} style={styles.resetButton}>
                            Réinitialiser les filtres
                        </button>
                    </div>
                ) : (
                    <div style={styles.grid}>
                        {filteredCourses.map(course => (
                            <div key={course._id} style={styles.courseCard}>
                                <div style={styles.imageContainer}>
                                    {course.image ? (
                                        <img src={course.image} alt={course.titre} style={styles.courseImage} />
                                    ) : (
                                        <div style={styles.imagePlaceholder}>{course.titre.charAt(0)}</div>
                                    )}
                                    <span style={styles.categoryBadge}>{course.categorie}</span>
                                </div>

                                <div style={styles.cardContent}>
                                    <div style={styles.cardHeader}>
                                        <h3 style={styles.courseTitle}>{course.titre}</h3>
                                        <span style={styles.priceTag}>
                                            {course.prix > 0 ? `${course.prix} DT` : 'Gratuit'}
                                        </span>
                                    </div>

                                    <p style={styles.description}>
                                        {course.description
                                            ? (course.description.length > 100 ? course.description.substring(0, 100) + '...' : course.description)
                                            : "Aucune description disponible."}
                                    </p>

                                    <div style={styles.instructorInfo}>
                                        <span style={styles.instructorLabel}>Formateur:</span>
                                        <span style={styles.instructorName}>
                                            {course.formateur ? `${course.formateur.prenom} ${course.formateur.nom}` : 'Formini'}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => navigate(`/courses/${course._id}`)}
                                        style={styles.exploreButton}
                                    >
                                        Explorer ce cours ➜
                                    </button>
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
    // Updated Main Container to match MyCertificates layout
    main: {
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '0 20px',
        paddingBottom: '60px',
    },
    filterSection: { // Now accessible as controlsSection equivalent
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px',
        gap: '20px',
        flexWrap: 'wrap',
    },
    // New Stats Card Styles matching MyCertificates
    statsCard: {
        background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
        padding: '20px 30px',
        borderRadius: '16px',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 25px rgba(249, 115, 22, 0.3)',
        minWidth: '200px',
    },
    statsNumber: {
        fontSize: '36px',
        fontWeight: '800',
        lineHeight: '1',
        marginBottom: '5px',
    },
    statsLabel: {
        fontSize: '14px',
        fontWeight: '500',
        opacity: 0.9,
    },
    // Filter container for Search + Select
    filtersContainer: {
        display: 'flex',
        gap: '15px',
        background: theme.paper,
        padding: '20px',
        borderRadius: '16px',
        boxShadow: theme.shadow,
        border: `1px solid ${theme.border}`,
        alignItems: 'center',
        flex: 1,
    },
    searchGroup: {
        flex: 1,
        minWidth: '200px',
    },
    searchInput: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '8px',
        border: `1px solid ${theme.border}`,
        background: theme.background,
        color: theme.text,
        fontSize: '16px',
        outline: 'none',
        transition: 'border-color 0.2s',
        ':focus': {
            borderColor: theme.primary,
        }
    },
    filterGroup: {
        minWidth: '200px',
    },
    categorySelect: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '8px',
        border: `1px solid ${theme.border}`,
        background: theme.background,
        color: theme.text,
        fontSize: '16px',
        outline: 'none',
        cursor: 'pointer',
    },
    searchButton: {
        padding: '12px 24px',
        background: theme.primary,
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': {
            opacity: 0.9,
            transform: 'translateY(-1px)',
        }
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '30px',
    },
    courseCard: {
        display: 'flex',
        flexDirection: 'column',
        background: theme.paper,
        borderRadius: '16px',
        overflow: 'hidden',
        border: `1px solid ${theme.border}`,
        boxShadow: theme.shadow,
        transition: 'all 0.3s ease',
        ':hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 15px 30px rgba(0,0,0,0.1)',
        }
    },
    imageContainer: {
        height: '200px',
        width: '100%',
        position: 'relative',
        background: '#e5e7eb',
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
        fontSize: '64px',
        color: '#9ca3af',
        background: '#f3f4f6',
    },
    categoryBadge: {
        position: 'absolute',
        top: '15px',
        left: '15px',
        padding: '6px 12px',
        background: 'rgba(0, 0, 0, 0.6)',
        color: 'white',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        backdropFilter: 'blur(4px)',
    },
    cardContent: {
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '10px',
    },
    courseTitle: {
        margin: 0,
        fontSize: '18px',
        fontWeight: '700',
        color: theme.text,
        lineHeight: '1.4',
        flex: 1,
        marginRight: '10px',
    },
    priceTag: {
        fontWeight: '700',
        color: theme.primary,
        fontSize: '18px',
    },
    description: {
        color: theme.textSecondary,
        fontSize: '14px',
        lineHeight: '1.6',
        marginBottom: '20px',
        display: '-webkit-box',
        WebkitLineClamp: '3',
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
    },
    instructorInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '20px',
        fontSize: '14px',
    },
    instructorLabel: {
        color: theme.textSecondary,
    },
    instructorName: {
        fontWeight: '600',
        color: theme.text,
    },
    exploreButton: {
        marginTop: 'auto',
        width: '100%',
        padding: '12px',
        background: 'transparent',
        border: `2px solid ${theme.primary}`,
        color: theme.primary,
        borderRadius: '10px',
        fontWeight: '600',
        fontSize: '15px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': {
            background: theme.primary,
            color: 'white',
        }
    },
    loaderContainer: {
        textAlign: 'center',
        padding: '60px',
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
    errorMessage: {
        padding: '20px',
        background: '#fee2e2',
        color: '#dc2626',
        borderRadius: '12px',
        textAlign: 'center',
    },
    emptyState: {
        textAlign: 'center',
        padding: '60px',
        background: theme.paper,
        borderRadius: '16px',
        border: `1px dashed ${theme.border}`,
    },
    emptyIcon: {
        fontSize: '48px',
        marginBottom: '20px',
    },
    emptySub: {
        color: theme.textSecondary,
        marginBottom: '20px',
    },
    resetButton: {
        padding: '10px 20px',
        background: theme.paperSecondary,
        color: theme.text,
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '500',
    }
});
