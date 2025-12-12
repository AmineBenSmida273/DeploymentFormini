import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, dashboardService, courseService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import NotificationBell from '../../components/NotificationBell';
export default function InstructorDashboard({ user }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalEnrollments: 0,
  });
  const [myCourses, setMyCourses] = useState([]);
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [studentEngagement, setStudentEngagement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [sortBy, setSortBy] = useState('recent');
  // États pour la gestion des cours
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [courseFormData, setCourseFormData] = useState({
    titre: '',
    description: '',
    categorie: 'Développement Web',
    niveau: 'débutant',
    prix: 0,
    duree: 1,
    programme: '',
    objectifs: [''],
    prerequis: ['']
  });
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();

    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchDashboardData();
      }, 30000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await dashboardService.getInstructorStats();
      const data = response.data;

      // Utiliser les données réelles de la base de données
      setStats(data.stats || {
        totalCourses: 0,
        activeCourses: 0,
        totalStudents: 0,
        totalRevenue: 0,
        averageRating: 0,
        totalEnrollments: 0,
      });

      setMyCourses(data.myCourses || []);
      setRecentEnrollments(data.recentEnrollments || []);
      setRevenueData(data.revenueTimeline || []);
      setStudentEngagement(data.engagementByCourse || []);

      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setError('Impossible de charger les données du dashboard');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // Gestion du formulaire de cours
  const resetForm = () => {
    setCourseFormData({
      titre: '',
      description: '',
      categorie: 'Développement Web',
      niveau: 'débutant',
      prix: 0,
      duree: 1,
      programme: '',
      objectifs: [''],
      prerequis: ['']
    });
    setIsEditing(false);
    setCurrentCourse(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setShowCourseModal(true);
  };

  const handleOpenEditModal = (course) => {
    setCourseFormData({
      titre: course.titre || course.title,
      description: course.description,
      categorie: course.categorie || 'Développement Web',
      niveau: course.niveau || 'débutant',
      prix: course.prix || 0,
      duree: course.duree || 1,
      programme: course.programme || '',
      objectifs: course.objectifs || [''],
      prerequis: course.prerequis || ['']
    });
    setIsEditing(true);
    setCurrentCourse(course);
    setShowCourseModal(true);
  };

  const handleSubmitCourse = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await courseService.updateCourse(currentCourse.id || currentCourse._id, courseFormData);
        alert('✅ Cours mis à jour avec succès');
      } else {
        await courseService.createCourse(courseFormData);
        alert('✅ Cours créé avec succès');
      }
      setShowCourseModal(false);
      fetchDashboardData();
    } catch (error) {
      console.error('Erreur sauvegarde cours:', error);
      alert('❌ Erreur lors de la sauvegarde du cours');
    }
  };

  // Handlers pour les tableaux dynamiques (objectifs, prérequis)
  const handleArrayChange = (field, index, value) => {
    const newArray = [...courseFormData[field]];
    newArray[index] = value;
    setCourseFormData({ ...courseFormData, [field]: newArray });
  };

  const addArrayItem = (field) => {
    setCourseFormData({ ...courseFormData, [field]: [...courseFormData[field], ''] });
  };

  const removeArrayItem = (field, index) => {
    const newArray = courseFormData[field].filter((_, i) => i !== index);
    setCourseFormData({ ...courseFormData, [field]: newArray });
  };

  const getMaxRevenueValue = (series) => {
    if (!series || series.length === 0) return 1;
    return Math.max(...series.map(d => d.revenue), 1);
  };

  const getMaxEngagementValue = () => {
    if (studentEngagement.length === 0) return 1;
    return Math.max(...studentEngagement.map(e => e.students || 0), 1);
  };

  const sortedCourses = [...myCourses].sort((a, b) => {
    switch (sortBy) {
      case 'students':
        return (b.students || 0) - (a.students || 0);
      case 'revenue':
        return (b.revenue || 0) - (a.revenue || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return new Date(b.id) - new Date(a.id);
    }
  });

  if (loading && myCourses.length === 0) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (error && myCourses.length === 0) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.error}>
          <h2>⚠️ Erreur</h2>
          <p>{error}</p>
          <button onClick={fetchDashboardData} style={styles.retryBtn}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const revenueWindow = selectedTimeframe === 'week' ? 7 : selectedTimeframe === 'quarter' ? 30 : 30;
  const displayedRevenue = revenueData.slice(-revenueWindow);
  const maxRevenueValue = getMaxRevenueValue(displayedRevenue);
  const maxEngagementValue = getMaxEngagementValue();

  return (
    <div style={styles.container}>
      {/* Modal Création/Édition Cours */}
      {showCourseModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>{isEditing ? 'Modifier le cours' : 'Créer un nouveau cours'}</h2>
              <button onClick={() => setShowCourseModal(false)} style={styles.closeBtn}>&times;</button>
            </div>
            <form onSubmit={handleSubmitCourse}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label>Titre</label>
                  <input
                    type="text"
                    value={courseFormData.titre}
                    onChange={e => setCourseFormData({ ...courseFormData, titre: e.target.value })}
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label>Catégorie</label>
                  <select
                    value={courseFormData.categorie}
                    onChange={e => setCourseFormData({ ...courseFormData, categorie: e.target.value })}
                    style={styles.input}
                  >
                    <option value="Développement Web">Développement Web</option>
                    <option value="Design">Design</option>
                    <option value="Business">Business</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label>Prix (TND)</label>
                  <input
                    type="number"
                    value={courseFormData.prix}
                    onChange={e => setCourseFormData({ ...courseFormData, prix: Number(e.target.value) })}
                    min="0"
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label>Niveau</label>
                  <select
                    value={courseFormData.niveau}
                    onChange={e => setCourseFormData({ ...courseFormData, niveau: e.target.value })}
                    style={styles.input}
                  >
                    <option value="débutant">Débutant</option>
                    <option value="intermédiaire">Intermédiaire</option>
                    <option value="avancé">Avancé</option>
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label>Description</label>
                <textarea
                  rows="3"
                  value={courseFormData.description}
                  onChange={e => setCourseFormData({ ...courseFormData, description: e.target.value })}
                  required
                  style={styles.textarea}
                />
              </div>

              <div style={styles.formGroup}>
                <label>Programme (résumé)</label>
                <textarea
                  rows="3"
                  value={courseFormData.programme}
                  onChange={e => setCourseFormData({ ...courseFormData, programme: e.target.value })}
                  required
                  style={styles.textarea}
                />
              </div>

              <div style={styles.formAction}>
                <button type="submit" style={styles.submitBtn}>
                  {isEditing ? 'Mettre à jour' : 'Créer le cours'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>👨‍🏫 Dashboard Formateur</h1>
            <p style={styles.subtitle}>
              {autoRefresh && <span style={styles.autoRefreshBadge}>🔄 Auto-actualisation</span>}
            </p>
          </div>
          <div style={styles.headerActions}>
            <NotificationBell />
            <label style={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={styles.toggle}
              />
              Auto-refresh
            </label>
            <button onClick={fetchDashboardData} style={styles.refreshBtn} title="Actualiser">
              🔄
            </button>
            <ThemeToggle />
            <div style={styles.userInfo}>
              <span style={styles.welcome}>Bienvenue, {user?.prenom} {user?.nom}</span>
              <button onClick={() => navigate('/instructor-settings')} style={styles.settingsBtn}>⚙️</button>
              <button onClick={handleLogout} style={styles.logoutBtn}>Déconnexion</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Statistiques */}
        <section style={styles.statsSection}>
          <h2 style={styles.sectionTitle}>📊 Mes Statistiques</h2>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📚</div>
              <div style={styles.statContent}>
                <h3 style={styles.statValue}>{stats.totalCourses}</h3>
                <p style={styles.statLabel}>Total Cours</p>
                <p style={styles.statSubtext}>{stats.activeCourses} actifs</p>
                <div style={styles.statProgress}>
                  <div style={{
                    ...styles.statProgressBar,
                    width: `${(stats.activeCourses / stats.totalCourses) * 100}%`,
                    background: '#f97316'
                  }}></div>
                </div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>👥</div>
              <div style={styles.statContent}>
                <h3 style={styles.statValue}>{stats.totalStudents}</h3>
                <p style={styles.statLabel}>Étudiants Totaux</p>
                <p style={styles.statSubtext}>{stats.totalEnrollments} inscriptions</p>
                <div style={styles.statProgress}>
                  <div style={{
                    ...styles.statProgressBar,
                    width: `${(stats.totalStudents / 500) * 100}%`,
                    background: '#10b981'
                  }}></div>
                </div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>💰</div>
              <div style={styles.statContent}>
                <h3 style={styles.statValue}>{stats.totalRevenue.toLocaleString('fr-FR')} TND</h3>
                <p style={styles.statLabel}>Revenus Totaux</p>
                <p style={styles.statSubtext}>Moyenne: {(stats.totalRevenue / stats.totalCourses).toFixed(0)} TND/cours</p>
                <div style={styles.statProgress}>
                  <div style={{
                    ...styles.statProgressBar,
                    width: `${(stats.totalRevenue / 20000) * 100}%`,
                    background: '#f59e0b'
                  }}></div>
                </div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>⭐</div>
              <div style={styles.statContent}>
                <h3 style={styles.statValue}>{stats.averageRating.toFixed(1)}</h3>
                <p style={styles.statLabel}>Note Moyenne</p>
                <p style={styles.statSubtext}>Sur 5.0</p>
                <div style={styles.statProgress}>
                  <div style={{
                    ...styles.statProgressBar,
                    width: `${(stats.averageRating / 5) * 100}%`,
                    background: '#f97316'
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Graphique de revenus */}
        {revenueData.length > 0 && (
          <section style={styles.chartSection}>
            <div style={styles.chartHeader}>
              <h2 style={styles.sectionTitle}>💰 Évolution des Revenus</h2>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                style={styles.timeframeSelect}
              >
                <option value="week">7 derniers jours</option>
                <option value="month">30 derniers jours</option>
                <option value="quarter">90 derniers jours</option>
              </select>
            </div>
            <div style={styles.chartContainer}>
              <div style={styles.chart}>
                {displayedRevenue.map((data, index) => (
                  <div key={index} style={styles.chartBar}>
                    <div
                      style={{
                        ...styles.chartBarItem,
                        height: `${(data.revenue / maxRevenueValue) * 100}%`,
                        background: '#f59e0b',
                        title: `${data.revenue} TND`
                      }}
                    ></div>
                    <span style={styles.chartLabel}>{data.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Engagement des étudiants */}
        {studentEngagement.length > 0 && (
          <section style={styles.engagementSection}>
            <h2 style={styles.sectionTitle}>📈 Engagement des Étudiants par Cours</h2>
            <div style={styles.engagementContainer}>
              {studentEngagement.map((engagement) => (
                <div key={engagement.courseId} style={styles.engagementCard}>
                  <h4 style={styles.engagementCourseName}>{engagement.title}</h4>
                  <div style={styles.engagementStats}>
                    <div style={styles.engagementStat}>
                      <span style={styles.engagementStatLabel}>Étudiants actifs:</span>
                      <span style={styles.engagementStatValue}>{engagement.students}</span>
                    </div>
                    <div style={styles.engagementStat}>
                      <span style={styles.engagementStatLabel}>Taux de complétion:</span>
                      <span style={styles.engagementStatValue}>{engagement.completionRate}%</span>
                    </div>
                  </div>
                  <div style={styles.engagementBar}>
                    <div
                      style={{
                        ...styles.engagementBarFill,
                        width: `${(engagement.students / maxEngagementValue) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mes Cours */}
        <section style={styles.coursesSection}>
          <div style={styles.coursesHeader}>
            <h2 style={styles.sectionTitle}>📖 Mes Cours</h2>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={styles.sortSelect}
            >
              <option value="recent">Plus récents</option>
              <option value="students">Plus d'étudiants</option>
              <option value="revenue">Plus de revenus</option>
              <option value="rating">Meilleure note</option>
            </select>
          </div>
          {sortedCourses.length > 0 ? (
            <div style={styles.coursesGrid}>
              {sortedCourses.length > 0 ? sortedCourses.map((course) => (
                <div key={course.id} style={styles.courseCard}>
                  <div style={styles.courseHeader}>
                    <h3 style={styles.courseTitle}>{course.title}</h3>
                    <span style={{
                      ...styles.statusBadge,
                      background: course.status === 'active' ? '#10b981' : '#6b7280'
                    }}>
                      {course.status === 'active' ? 'Actif' : 'Brouillon'}
                    </span>
                  </div>
                  <p style={styles.courseDescription}>{course.description || 'Aucune description'}</p>
                  <div style={styles.courseStats}>
                    <div style={styles.courseStat}>
                      <span style={styles.courseStatIcon}>👥</span>
                      <span style={styles.courseStatText}>{course.students || 0} étudiants</span>
                    </div>
                    <div style={styles.courseStat}>
                      <span style={styles.courseStatIcon}>⭐</span>
                      <span style={styles.courseStatText}>{course.rating ? course.rating.toFixed(1) : 'N/A'} / 5</span>
                    </div>
                    <div style={styles.courseStat}>
                      <span style={styles.courseStatIcon}>💰</span>
                      <span style={styles.courseStatText}>{course.revenue || 0} TND</span>
                    </div>
                    <div style={styles.courseStat}>
                      <span style={styles.courseStatIcon}>📊</span>
                      <span style={styles.courseStatText}>{course.enrollments || 0} inscriptions</span>
                    </div>
                    <div style={styles.courseStat}>
                      <span style={styles.courseStatIcon}>✅</span>
                      <span style={styles.courseStatText}>{course.completionRate || 0}% complétion</span>
                    </div>
                  </div>
                  {course.completionRate > 0 && (
                    <div style={styles.completionBar}>
                      <div
                        style={{
                          ...styles.completionBarFill,
                          width: `${course.completionRate}%`,
                        }}
                      ></div>
                    </div>
                  )}
                  <div style={styles.courseActions}>
                    <button style={styles.editBtn} onClick={() => handleOpenEditModal(course)}>Modifier</button>
                    <button style={styles.viewBtn}>Voir les détails</button>
                    <button
                      style={{ ...styles.viewBtn, background: '#ef4444', marginLeft: '10px' }}
                      onClick={async () => {
                        if (window.confirm('Voulez-vous vraiment supprimer ce cours ?')) {
                          try {
                            await courseService.deleteCourse(course.id || course._id);
                            alert('Cours supprimé');
                            fetchDashboardData();
                          } catch (err) { alert('Erreur suppression'); }
                        }
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              )) : (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>📚</div>
                  <p style={styles.emptyText}>Vous n'avez pas encore créé de cours</p>
                  <button style={styles.createBtn} onClick={() => navigate('/create-course')}>
                    ➕ Créer mon premier cours
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📚</div>
              <p style={styles.emptyText}>Vous n'avez pas encore créé de cours</p>
              <button style={styles.createBtn} onClick={() => navigate('/create-course')}>
                ➕ Créer mon premier cours
              </button>
            </div>
          )}
        </section>

        {/* Inscriptions Récentes */}
        <section style={styles.enrollmentsSection}>
          <h2 style={styles.sectionTitle}>🕐 Inscriptions Récentes</h2>
          {recentEnrollments.length > 0 ? (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Étudiant</th>
                    <th style={styles.th}>Cours</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEnrollments.map((enrollment) => (
                    <tr key={enrollment.id} style={styles.tr}>
                      <td style={styles.td}>{enrollment.studentName}</td>
                      <td style={styles.td}>{enrollment.courseName}</td>
                      <td style={styles.td}>
                        {new Date(enrollment.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          background: enrollment.status === 'active' ? '#10b981' : '#6b7280'
                        }}>
                          {enrollment.status === 'active' ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>👥</div>
              <p style={styles.emptyText}>Aucune inscription récente</p>
            </div>
          )}
        </section>

        {/* Actions Rapides */}
        <section style={styles.actionsSection}>
          <h2 style={styles.sectionTitle}>⚡ Actions Rapides</h2>
          <div style={styles.actionsGrid}>
            <button style={styles.actionBtn} onClick={() => navigate('/create-course')}>
              ➕ Créer un Cours
            </button>
            <button style={styles.actionBtn} onClick={() => navigate('/instructor/courses')}>
              📚 Gérer mes Cours
            </button>
            <button style={styles.actionBtn} onClick={() => navigate('/instructor/analytics')}>
              📊 Voir les Analytiques
            </button>
          </div>
        </section>
      </main>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
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
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontSize: '18px',
    color: 'white',
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
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: theme.background,
  },
  error: {
    background: theme.paper,
    padding: '40px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.border}`,
  },
  retryBtn: {
    padding: '10px 20px',
    background: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    marginTop: '20px',
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
    maxWidth: '1400px',
    margin: '0 auto',
    flexWrap: 'wrap',
    gap: '20px',
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
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  autoRefreshBadge: {
    padding: '4px 8px',
    background: '#10b981',
    color: 'white',
    borderRadius: '4px',
    fontSize: '12px',
    animation: 'pulse 2s infinite',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: theme.textSecondary,
    cursor: 'pointer',
  },
  toggle: {
    cursor: 'pointer',
  },
  refreshBtn: {
    padding: '8px 12px',
    background: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '18px',
    transition: 'transform 0.2s',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  welcome: {
    fontSize: '16px',
    color: theme.textSecondary,
  },
  settingsBtn: {
    padding: '10px 20px',
    background: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s',
  },
  logoutBtn: {
    padding: '10px 20px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s',
  },
  main: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  statsSection: {
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '24px',
    color: theme.text,
    marginBottom: '20px',
    fontWeight: '600',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  statCard: {
    background: theme.paper,
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.border}`,
    transition: 'transform 0.3s',
  },
  statIcon: {
    fontSize: '48px',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    margin: 0,
    fontSize: '32px',
    fontWeight: 'bold',
    color: theme.text,
  },
  statLabel: {
    margin: '5px 0 0 0',
    fontSize: '14px',
    color: theme.textSecondary,
  },
  statSubtext: {
    margin: '5px 0 0 0',
    fontSize: '12px',
    color: theme.textSecondary,
  },
  statProgress: {
    marginTop: '10px',
    height: '4px',
    background: theme.border,
    borderRadius: '2px',
    overflow: 'hidden',
  },
  statProgressBar: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.5s ease',
  },
  chartSection: {
    marginBottom: '40px',
    background: theme.paper,
    borderRadius: '12px',
    padding: '24px',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.border}`,
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  timeframeSelect: {
    padding: '8px 12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    background: theme.paper,
    cursor: 'pointer',
  },
  chartContainer: {
    marginTop: '20px',
  },
  chart: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '300px',
    gap: '10px',
    marginBottom: '20px',
  },
  chartBar: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
  },
  chartBarItem: {
    width: '100%',
    minHeight: '4px',
    borderRadius: '4px 4px 0 0',
    transition: 'height 0.5s ease',
    cursor: 'pointer',
  },
  chartLabel: {
    marginTop: '10px',
    fontSize: '11px',
    color: theme.textSecondary,
    textAlign: 'center',
  },
  engagementSection: {
    marginBottom: '40px',
    background: theme.paper,
    borderRadius: '12px',
    padding: '24px',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.border}`,
  },
  engagementContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  engagementCard: {
    padding: '20px',
    background: theme.background,
    borderRadius: '8px',
    border: `1px solid ${theme.border}`,
  },
  engagementCourseName: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: theme.text,
  },
  engagementStats: {
    display: 'flex',
    gap: '20px',
    marginBottom: '15px',
    flexWrap: 'wrap',
  },
  engagementStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  engagementStatLabel: {
    fontSize: '12px',
    color: theme.textSecondary,
  },
  engagementStatValue: {
    fontSize: '18px',
    fontWeight: '600',
    color: theme.text,
  },
  engagementBar: {
    height: '8px',
    background: theme.border,
    borderRadius: '4px',
    overflow: 'hidden',
  },
  engagementBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #f97316, #fb923c)',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
  },
  coursesSection: {
    marginBottom: '40px',
  },
  coursesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  sortSelect: {
    padding: '8px 12px',
    border: `2px solid ${theme.border}`,
    borderRadius: '8px',
    fontSize: '14px',
    background: theme.paper,
    color: theme.text,
    cursor: 'pointer',
  },
  coursesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  courseCard: {
    background: theme.paper,
    borderRadius: '12px',
    padding: '24px',
    boxShadow: theme.shadow,
    transition: 'transform 0.3s',
    border: `1px solid ${theme.border}`,
  },
  courseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(5px)',
  },
  modalContent: {
    background: theme.paper,
    borderRadius: '20px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '30px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '10px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: theme.textSecondary,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    marginTop: '5px',
    fontSize: '14px',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    marginTop: '5px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    background: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '10px',
  },
  courseTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: theme.text,
    flex: 1,
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
    marginLeft: '10px',
  },
  courseDescription: {
    margin: '0 0 15px 0',
    fontSize: '14px',
    color: theme.textSecondary,
  },
  courseStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginBottom: '15px',
    padding: '15px 0',
    borderTop: `1px solid ${theme.border}`,
    borderBottom: `1px solid ${theme.border}`,
  },
  courseStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: theme.textSecondary,
  },
  courseStatIcon: {
    fontSize: '18px',
  },
  courseStatText: {
    fontSize: '14px',
  },
  completionBar: {
    height: '6px',
    background: theme.border,
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '15px',
  },
  completionBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #f97316, #fb923c)',
    borderRadius: '3px',
    transition: 'width 0.5s ease',
  },
  courseActions: {
    display: 'flex',
    gap: '10px',
  },
  editBtn: {
    flex: 1,
    padding: '10px',
    background: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  viewBtn: {
    flex: 1,
    padding: '10px',
    background: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  enrollmentsSection: {
    marginBottom: '40px',
    background: theme.paper,
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #e5e7eb',
    color: theme.text,
    fontWeight: '600',
  },
  tr: {
    borderBottom: '1px solid #e5e7eb',
  },
  td: {
    padding: '12px',
    color: theme.textSecondary,
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
  },
  emptyState: {
    background: theme.paper,
    borderRadius: '12px',
    padding: '60px 24px',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '20px',
  },
  createBtn: {
    padding: '12px 24px',
    background: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  actionsSection: {
    marginBottom: '40px',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
  },
  actionBtn: {
    padding: '16px 24px',
    background: theme.paper,
    border: `1px solid ${theme.border}`,
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: theme.shadow,
    transition: 'transform 0.2s',
    color: theme.text,
  },
});
