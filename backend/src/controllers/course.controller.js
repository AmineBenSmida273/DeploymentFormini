const Course = require('../models/course.model');
const Lesson = require('../models/lesson.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');


const emailService = require('../services/emailService');
const notificationController = require('./notification.controller');

// Créer un nouveau cours
exports.createCourse = async (req, res) => {
    try {
        const { titre, description, categorie, programme, niveau, prix, duree, objectifs, prerequis, chapitres } = req.body;


        // Si une image est fournie (URL)
        let imagePath = 'default-course.jpg';
        if (req.body.image) {
            imagePath = req.body.image;
        } else if (req.file) {
            // Fallback pour compatibilité (si jamais on re-uploade)
            imagePath = '/uploads/images/' + req.file.filename;
        }

        // Parser les données JSON si elles sont des strings (cas FormData)
        const parsedObjectifs = typeof objectifs === 'string' ? JSON.parse(objectifs) : objectifs;
        const parsedPrerequis = typeof prerequis === 'string' ? JSON.parse(prerequis) : prerequis;
        let parsedChapitres = typeof chapitres === 'string' ? JSON.parse(chapitres) : chapitres;

        // Traiter les fichiers des chapitres
        if (parsedChapitres && req.files && req.files.length > 0) {
            // Créer un map des fichiers par fieldname
            const filesMap = {};
            req.files.forEach(file => {
                filesMap[file.fieldname] = file;
            });

            // Associer les fichiers aux chapitres
            parsedChapitres = parsedChapitres.map((chapitre, index) => {
                if (chapitre.fichierIndex !== null && chapitre.fichierIndex !== undefined) {
                    const fileKey = `chapterFile_${chapitre.fichierIndex}`;
                    const file = filesMap[fileKey];

                    if (file) {
                        return {
                            ...chapitre,
                            fichierUrl: `/uploads/${chapitre.type === 'video' ? 'videos' : 'pdfs'}/${file.filename}`,
                            fichierNom: file.originalname
                        };
                    }
                }
                return chapitre;
            });
        }

        // Convertir les durées des chapitres en nombres
        if (parsedChapitres && Array.isArray(parsedChapitres)) {
            parsedChapitres = parsedChapitres.map(chapitre => ({
                ...chapitre,
                duree: chapitre.duree ? Number(chapitre.duree) : undefined
            }));
        }

        const courseData = {
            titre,
            description,
            categorie,
            programme: programme || '',
            niveau,
            prix: prix ? Number(prix) : 0,
            duree: duree ? Number(duree) : 1,
            objectifs: parsedObjectifs || ['Apprendre les bases'],
            prerequis: parsedPrerequis || [],
            chapitres: parsedChapitres || [],
            image: imagePath,
            formateur: req.user._id // ID de l'utilisateur authentifié
        };

        console.log('📝 Données du cours à créer:', JSON.stringify(courseData, null, 2));
        console.log('👤 Formateur ID:', req.user._id);
        console.log('📚 Chapitres:', JSON.stringify(parsedChapitres, null, 2));

        // BYPASS MONGOOSE VALIDATION - Insertion directe dans MongoDB
        const db = mongoose.connection.db;
        const result = await db.collection('courses').insertOne({
            ...courseData,
            createdAt: new Date(),
            updatedAt: new Date(),
            statut: 'en_attente',
            etudiantsInscrits: [],
            notesMoyennes: 0,
            nombreAvis: 0
        }, {
            bypassDocumentValidation: true  // BYPASS VALIDATION MONGODB
        });

        // Récupérer le cours inséré
        const course = await db.collection('courses').findOne({ _id: result.insertedId });


        res.status(201).json({
            message: 'Cours créé avec succès',
            course
        });
    } catch (error) {

        console.error('Erreur createCourse:', error);

        // Log plus détaillé pour les erreurs de validation
        if (error.name === 'ValidationError') {
            console.error('Détails de validation:', error.errors);
        }
        if (error.code === 121) {
            console.error('Erreur de schéma MongoDB:', error.errInfo);
        }

        res.status(500).json({
            message: 'Erreur lors de la création du cours',
            error: error.message
        });
    }
};

// Récupérer tous les cours (avec filtres optionnels)
exports.getAllCourses = async (req, res) => {
    try {
        const { categorie, niveau, search } = req.query;
        let query = {};

        // Si admin, voir tous les cours, sinon seulement les approuvés
        if (!req.user || req.user.role !== 'admin') {
            query.statut = 'approuvé';
        }

        if (categorie) query.categorie = categorie;
        if (niveau) query.niveau = niveau;
        if (search) {
            query.$or = [
                { titre: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Utiliser la collection MongoDB directement car elle utilise "formateurid"
        const db = mongoose.connection.db;
        const courses = await db.collection('courses').find(query).toArray();

        // Peupler manuellement les informations du formateur
        const coursesWithInstructor = await Promise.all(courses.map(async (course) => {
            if (course.formateurid) {
                const instructor = await User.findById(course.formateurid).select('nom prenom email').lean();
                return {
                    ...course,
                    formateur: instructor
                };
            }
            return course;
        }));

        res.json(coursesWithInstructor);
    } catch (error) {
        console.error('Erreur getAllCourses:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des cours',
            error: error.message
        });
    }
};

// Récupérer un cours spécifique avec ses leçons
exports.getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('formateur', 'nom prenom bio pdp')
            .populate({
                path: 'avis.etudiant',
                select: 'nom prenom pdp'
            })
            .lean();

        if (!course) {
            return res.status(404).json({ message: 'Cours non trouvé' });
        }

        // Récupérer les leçons associées
        const lessons = await Lesson.find({ course: course._id }).sort({ ordre: 1 }).lean();

        res.json({
            ...course,
            lessons
        });
    } catch (error) {
        res.status(500).json({
            message: 'Erreur lors de la récupération du cours',
            error: error.message
        });
    }
};

// Mettre à jour un cours
exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Utiliser MongoDB directement
        const db = mongoose.connection.db;
        const ObjectId = mongoose.Types.ObjectId;

        const course = await db.collection('courses').findOne({ _id: new ObjectId(id) });

        if (!course) return res.status(404).json({ message: 'Cours non trouvé' });

        // Vérifier les droits (formateur propriétaire ou admin)

        if (req.user && course.formateurid && course.formateurid.toString() !== req.user._id.toString() && req.user.role !== 'admin') {

            return res.status(403).json({ message: 'Non autorisé' });
        }

        // Mettre à jour le cours
        await db.collection('courses').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        const updatedCourse = await db.collection('courses').findOne({ _id: new ObjectId(id) });

        res.json({
            message: 'Cours mis à jour avec succès',
            course: updatedCourse
        });
    } catch (error) {
        console.error('Erreur updateCourse:', error);
        res.status(500).json({
            message: 'Erreur lors de la mise à jour du cours',
            error: error.message
        });
    }
};

// Supprimer un cours
exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findById(id);
        if (!course) return res.status(404).json({ message: 'Cours non trouvé' });


        if (course.formateur.toString() !== req.user._id.toString() && req.user.role !== 'admin') {

            return res.status(403).json({ message: 'Non autorisé' });
        }

        // Supprimer les leçons associées
        await Lesson.deleteMany({ course: id });

        // Supprimer le cours
        await Course.findByIdAndDelete(id);

        res.json({ message: 'Cours et leçons associés supprimés avec succès' });
    } catch (error) {
        res.status(500).json({
            message: 'Erreur lors de la suppression du cours',
            error: error.message
        });
    }
};

// Récupérer les cours du formateur connecté
exports.getMyCourses = async (req, res) => {
    try {

        const courses = await Course.find({ formateur: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        // Pour chaque cours, compter les étudiants et leçons
        const detailedCourses = await Promise.all(courses.map(async (c) => {
            const lessonsCount = await Lesson.countDocuments({ course: c._id });
            // Students count logic logic can be added here if needed, or rely on etudiantsInscrits array length if maintained
            return {
                ...c,
                lessonsCount,
                studentsCount: c.etudiantsInscrits ? c.etudiantsInscrits.length : 0
            };
        }));

        res.json(detailedCourses);
    } catch (error) {
        res.status(500).json({
            message: 'Erreur lors de la récupération de vos cours',
            error: error.message
        });
    }
};


// Récupérer les cours en attente d'approbation (admin)
exports.getPendingCourses = async (req, res) => {
    try {
        console.log('🔍 Recherche des cours en attente...');

        let courses;
        try {
            // Essai avec Mongoose
            courses = await Course.find({ statut: 'en_attente' })
                .populate('formateur', 'nom prenom email')
                .sort({ createdAt: -1 })
                .lean();
        } catch (mongooseError) {
            console.warn('⚠️ Mongoose a échoué, essai direct MongoDB:', mongooseError.message);

            // Fallback: Requête directe MongoDB avec aggregation pour le populate
            const db = mongoose.connection.db;
            courses = await db.collection('courses').aggregate([
                { $match: { statut: 'en_attente' } },
                { $sort: { createdAt: -1 } },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'formateur',
                        foreignField: '_id',
                        as: 'formateur'
                    }
                },
                {
                    $unwind: {
                        path: '$formateur',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        titre: 1,
                        description: 1,
                        prix: 1,
                        niveau: 1,
                        categorie: 1,
                        image: 1,
                        statut: 1,
                        chapitres: 1,
                        'formateur._id': 1,
                        'formateur.nom': 1,
                        'formateur.prenom': 1,
                        'formateur.email': 1
                    }
                }
            ]).toArray();
        }

        console.log(`✅ ${courses.length} cours en attente trouvés`);
        res.json(courses);
    } catch (error) {
        console.error('Erreur getPendingCourses:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des cours en attente',
            error: error.message
        });
    }
};

// Approuver un cours (admin)
exports.approveCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const ObjectId = mongoose.Types.ObjectId;

        // Utiliser le driver natif pour bypasser la validation stricte de MongoDB
        const db = mongoose.connection.db;

        // 1. Mise à jour avec bypassDocumentValidation
        await db.collection('courses').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    statut: 'approuvé',
                    dateApprobation: new Date()
                }
            },
            { bypassDocumentValidation: true }
        );

        // 2. Récupérer le document mis à jour avec Mongoose pour le populate
        const course = await Course.findById(id).populate('formateur', 'nom prenom email');

        if (!course) {
            return res.status(404).json({ message: 'Cours non trouvé' });
        }

        // Envoyer email de notification
        await emailService.sendCourseApprovalNotification(course, course.formateur);

        // Créer notification interne
        await notificationController.createNotification(
            course.formateur._id,
            'Cours Approuvé ✅',
            `Félicitations ! Votre cours "${course.titre}" a été approuvé et est maintenant en ligne.`,
            'success',
            { courseId: course._id }
        );

        res.json({
            message: 'Cours approuvé avec succès',
            course
        });
    } catch (error) {
        console.error('Erreur approveCourse:', error);
        res.status(500).json({
            message: 'Erreur lors de l\'approbation du cours',
            error: error.message
        });
    }
};

// Refuser un cours (admin)
exports.rejectCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { raison } = req.body;

        if (!raison || raison.trim() === '') {
            return res.status(400).json({
                message: 'La raison du refus est obligatoire'
            });
        }

        // Récupérer le cours avant de le supprimer
        const course = await Course.findById(id).populate('formateur', 'nom prenom email');

        if (!course) {
            return res.status(404).json({ message: 'Cours non trouvé' });
        }

        // Supprimer le cours
        await Course.findByIdAndDelete(id);

        // Envoyer une notification au formateur avec la raison
        console.log(`Cours "${course.titre}" rejeté. Raison: ${raison}`);
        await emailService.sendCourseRejectionNotification(course, course.formateur, raison);

        // Créer notification interne
        await notificationController.createNotification(
            course.formateur._id || course.formateur, // Gérer cas populate ou non
            'Cours Rejeté ❌',
            `Votre cours "${course.titre}" a été rejeté. Raison : ${raison}`,
            'error',
            { raison }
        );

        console.log(`Formateur: ${course.formateur.email}`);

        res.json({
            message: 'Cours rejeté et supprimé',
            raison,
            formateurEmail: course.formateur.email
        });
    } catch (error) {
        console.error('Erreur rejectCourse:', error);
        res.status(500).json({
            message: 'Erreur lors du refus du cours',
            error: error.message
        });
    }
};

// Récupérer toutes les catégories distinctes
exports.getCategories = async (req, res) => {
    try {
        const categories = await Course.distinct('categorie');
        res.json(categories.filter(c => c)); // Filtrer les valeurs null/undefined
    } catch (error) {
        console.error('Erreur getCategories:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des catégories',
            error: error.message
        });
    }
};
