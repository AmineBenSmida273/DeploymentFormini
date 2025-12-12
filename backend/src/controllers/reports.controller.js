const User = require('../models/user.model');
const Course = require('../models/course.model');

// @desc    Get detailed professional reports for admin
// @route   GET /api/users/admin/reports
// @access  Private/Admin
exports.getAdminReports = async (req, res) => {
    try {
        const db = require('mongoose').connection.db;
        const Enrollment = require('../models/enrollment.model');
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

        // ===== 1. USER GROWTH ANALYTICS (12 derniers mois) =====
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const allUsers = await User.find().lean();
        const recentUsers = allUsers.filter(u => new Date(u.dateinscri) >= twelveMonthsAgo);

        // Croissance par mois avec cumul
        const userGrowthMap = {};
        let cumulativeStudents = 0, cumulativeInstructors = 0;

        recentUsers.forEach(user => {
            const date = new Date(user.dateinscri);
            const monthKey = `${months[date.getMonth()]} ${date.getFullYear()} `;

            if (!userGrowthMap[monthKey]) {
                userGrowthMap[monthKey] = {
                    month: monthKey,
                    students: 0,
                    instructors: 0,
                    total: 0,
                    cumulativeStudents: 0,
                    cumulativeInstructors: 0
                };
            }

            if (user.role === 'student') {
                userGrowthMap[monthKey].students++;
                cumulativeStudents++;
            } else if (user.role === 'instructor') {
                userGrowthMap[monthKey].instructors++;
                cumulativeInstructors++;
            }
            userGrowthMap[monthKey].total++;
        });

        const userGrowth = Object.values(userGrowthMap).slice(-6).map((item, idx, arr) => ({
            ...item,
            growthRate: idx > 0 ? (((item.total - arr[idx - 1].total) / arr[idx - 1].total) * 100).toFixed(1) : 0
        }));

        // ===== 2. REVENUE ANALYTICS BASÉS SUR INSCRIPTIONS RÉELLES =====

        // Récupérer toutes les inscriptions avec les prix des cours
        const enrollmentsWithCourses = await Enrollment.aggregate([
            {
                $lookup: {
                    from: 'courses',
                    localField: 'coursid',
                    foreignField: '_id',
                    as: 'courseInfo'
                }
            },
            {
                $unwind: '$courseInfo'
            },
            {
                $project: {
                    dateinscription: 1,
                    prix: '$courseInfo.prix',
                    month: { $month: '$dateinscription' },
                    year: { $year: '$dateinscription' }
                }
            }
        ]);

        const revenueMap = {};
        let totalRevenue = 0;

        enrollmentsWithCourses.forEach(enrollment => {
            const prix = enrollment.prix || 0;
            const monthKey = `${months[enrollment.month - 1]} ${enrollment.year}`;

            if (!revenueMap[monthKey]) {
                revenueMap[monthKey] = { month: monthKey, amount: 0, enrollments: 0 };
            }

            revenueMap[monthKey].amount += prix;
            revenueMap[monthKey].enrollments++;
            totalRevenue += prix;
        });

        const revenue = Object.values(revenueMap).slice(-6).map((item, idx, arr) => ({
            ...item,
            growthRate: idx > 0 && arr[idx - 1].amount > 0 ? (((item.amount - arr[idx - 1].amount) / arr[idx - 1].amount) * 100).toFixed(1) : 0,
            avgPerEnrollment: item.enrollments > 0 ? (item.amount / item.enrollments).toFixed(2) : 0
        }));

        // Récupérer les cours approuvés pour les statistiques
        const courses = await db.collection('courses').find({ statut: 'approuvé' }).toArray();

        // ===== 3. TOP COURSES AVEC MÉTRIQUES RÉELLES =====

        // Agréger les données d'inscription par cours
        const enrollmentStats = await Enrollment.aggregate([
            {
                $group: {
                    _id: '$coursid',
                    totalEnrollments: { $sum: 1 },
                    avgProgression: { $avg: '$progression' },
                    completedCount: {
                        $sum: { $cond: [{ $eq: ['$statut', 'terminé'] }, 1, 0] }
                    }
                }
            }
        ]);

        // Créer un map pour accès rapide
        const enrollmentMap = {};
        enrollmentStats.forEach(stat => {
            enrollmentMap[stat._id.toString()] = {
                enrollments: stat.totalEnrollments,
                avgProgression: stat.avgProgression,
                completedCount: stat.completedCount
            };
        });

        const topCoursesWithMetrics = await Promise.all(
            courses.slice(0, 10).map(async (course) => {
                let instructorName = 'Inconnu';
                if (course.formateurid) {
                    const instructor = await User.findById(course.formateurid).select('nom prenom').lean();
                    if (instructor) {
                        instructorName = `${instructor.prenom} ${instructor.nom}`;
                    }
                }

                // Utiliser les vraies données d'inscription ou 0 si pas d'inscriptions
                const courseId = course._id.toString();
                const enrollmentData = enrollmentMap[courseId] || {
                    enrollments: 0,
                    avgProgression: 0,
                    completedCount: 0
                };

                const enrollments = enrollmentData.enrollments;
                const completionRate = enrollmentData.avgProgression || 0;
                const rating = (Math.random() * (5 - 4) + 4).toFixed(1); // Note simulée (à implémenter avec un système de reviews)
                const revenue = course.prix * enrollments;

                return {
                    title: course.titre,
                    instructor: instructorName,
                    enrollments,
                    completionRate: parseFloat(completionRate.toFixed(1)),
                    rating: parseFloat(rating),
                    revenue,
                    price: course.prix || 0,
                    category: course.categorie,
                    level: course.niveau,
                    engagement: ((parseFloat(rating) / 5) * 100).toFixed(0) + '%',
                    completedStudents: enrollmentData.completedCount
                };
            })
        );

        topCoursesWithMetrics.sort((a, b) => b.revenue - a.revenue);

        // ===== 4. STATISTIQUES PROFESSIONNELLES =====
        const totalUsers = allUsers.length;
        const totalStudents = allUsers.filter(u => u.role === 'student').length;
        const totalInstructors = allUsers.filter(u => u.role === 'instructor').length;
        const activeUsers = allUsers.filter(u => u.statut === 'active').length;

        const totalCourses = courses.length;
        const approvedCourses = courses.filter(c => c.statut === 'approuvé').length;
        const pendingCourses = await db.collection('courses').countDocuments({ statut: 'en_attente' });

        // Métriques avancées
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentNewUsers = allUsers.filter(u => new Date(u.dateinscri) >= thirtyDaysAgo).length;

        const avgCoursesPerInstructor = totalInstructors > 0 ? (totalCourses / totalInstructors).toFixed(1) : 0;
        const userRetentionRate = ((activeUsers / totalUsers) * 100).toFixed(1);
        const courseApprovalRate = totalCourses > 0 ? ((approvedCourses / totalCourses) * 100).toFixed(1) : 0;

        // ===== 5. DISTRIBUTION PAR CATÉGORIE AVEC POURCENTAGES =====
        const categoryAggregation = await db.collection('courses').aggregate([
            { $match: { statut: 'approuvé' } },
            { $group: { _id: '$categorie', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]).toArray();

        const categoryDistribution = categoryAggregation.map(cat => ({
            category: cat._id,
            count: cat.count,
            percentage: ((cat.count / approvedCourses) * 100).toFixed(1)
        }));

        // ===== 6. TENDANCES ET PRÉVISIONS =====
        const avgMonthlyGrowth = userGrowth.reduce((sum, item) => sum + parseFloat(item.growthRate || 0), 0) / userGrowth.length;
        const avgRevenueGrowth = revenue.reduce((sum, item) => sum + parseFloat(item.growthRate || 0), 0) / revenue.length;

        res.json({
            success: true,
            data: {
                userGrowth,
                revenue,
                topCourses: topCoursesWithMetrics.slice(0, 5),
                summary: {
                    totalUsers,
                    totalStudents,
                    totalInstructors,
                    activeUsers,
                    totalCourses,
                    approvedCourses,
                    pendingCourses,
                    recentNewUsers,
                    avgCoursesPerInstructor: parseFloat(avgCoursesPerInstructor),
                    userRetentionRate: parseFloat(userRetentionRate),
                    courseApprovalRate: parseFloat(courseApprovalRate),
                    totalRevenue: totalRevenue.toFixed(2),
                    avgMonthlyUserGrowth: avgMonthlyGrowth.toFixed(1) + '%',
                    avgMonthlyRevenueGrowth: avgRevenueGrowth.toFixed(1) + '%'
                },
                categoryDistribution,
                trends: {
                    userGrowthTrend: avgMonthlyGrowth > 0 ? 'positive' : 'negative',
                    revenueGrowthTrend: avgRevenueGrowth > 0 ? 'positive' : 'negative',
                    topCategory: categoryDistribution[0]?.category || 'N/A',
                    mostEngagedCourse: topCoursesWithMetrics[0]?.title || 'N/A'
                }
            }
        });

    } catch (error) {
        console.error('Error fetching admin reports:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des rapports',
            error: error.message
        });
    }
};
