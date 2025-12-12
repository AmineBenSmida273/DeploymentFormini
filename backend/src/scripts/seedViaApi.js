const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@formini.com';
const ADMIN_PASSWORD = 'formini.lab2025';

const seed = async () => {
    try {
        console.log('🔄 Logging in as Admin...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            mdp: ADMIN_PASSWORD
        });

        const token = loginRes.data.token;
        if (!token) throw new Error('No token received');
        console.log('✅ Logged in successfully');

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        const courses = [
            {
                titre: "Introduction au React.js",
                description: "Apprenez les bases de React, hooks, et composants. Un cours complet pour débutants souhaitant maîtriser le frontend moderne.",
                categorie: "Développement Web",
                niveau: "débutant",
                prix: 49.99,
                duree: 10,
                programme: "1. Introduction\n2. Components\n3. Hooks\n4. Routing",
                objectifs: ["Maîtriser JSX", "Comprendre le State", "Utiliser React Router"],
                prerequis: ["HTML/CSS de base", "JavaScript ES6"]
            },
            {
                titre: "UX/UI Design Modern",
                description: "Conception d'interfaces utilisateurs modernes avec Figma. Théorie des couleurs, typographie et prototypage.",
                categorie: "Design",
                niveau: "intermédiaire",
                prix: 89.99,
                duree: 15,
                programme: "1. Design Thinking\n2. Figma Basics\n3. Prototyping",
                objectifs: ["Créer des maquettes", "Prototypage interactif"],
                prerequis: ["Aucun"]
            },
            {
                titre: "Node.js & Express - Backend Avancé",
                description: "Créez des API RESTful performantes et sécurisées avec Node.js et MongoDB.",
                categorie: "Développement Web",
                niveau: "avancé",
                prix: 120,
                duree: 20,
                programme: "1. Node Internals\n2. Express Routing\n3. Authentication JWT\n4. MongoDB",
                objectifs: ["API sécurisée", "Connexion DB", "Déploiement"],
                prerequis: ["JS Avancé", "Bases HTTP"]
            }
        ];

        console.log('🔄 Creating courses...');
        for (const course of courses) {
            try {
                await axios.post(`${BASE_URL}/courses`, course, config);
                console.log(`✅ Created: ${course.titre}`);
            } catch (err) {
                console.log(`⚠️ Skiping ${course.titre}: ${err.response?.data?.message || err.message}`);
            }
        }

        // Now approve them all (if needed)
        // Actually, createCourse controller creates them. They might be 'en_attente' strictly if I didn't override status.
        // Admin can override status? No, createCourse doesn't take 'statut' from body usually, it defaults.
        // Let's verify statuses.
        // I can fetch all courses and update status to 'approuvé'.

        console.log('🔄 Approving all courses...');
        const allCourses = await axios.get(`${BASE_URL}/courses`, config); // Admins see all
        for (const c of allCourses.data) {
            if (c.statut !== 'approuvé') {
                await axios.put(`${BASE_URL}/courses/${c._id}`, { statut: 'approuvé' }, config);
                console.log(`✅ Approved: ${c.titre}`);
            }
        }

        console.log('✅ Seeding completed! All courses created and approved.');

    } catch (error) {
        console.error('❌ Seeding failed:', error.response?.data || error.message);
    }
};

seed();
