// Test rapide de l'endpoint courses
const axios = require('axios');

async function testCoursesAPI() {
    try {
        console.log('🧪 Test de l\'API courses...\n');

        // Test sans authentification (devrait retourner seulement les cours approuvés)
        const response = await axios.get('http://localhost:5000/api/courses');

        console.log('✅ Réponse reçue!');
        console.log(`📊 Nombre de cours: ${response.data.length}`);

        if (response.data.length > 0) {
            console.log('\n📚 Premier cours:');
            const course = response.data[0];
            console.log(`   Titre: ${course.titre}`);
            console.log(`   Catégorie: ${course.categorie}`);
            console.log(`   Niveau: ${course.niveau}`);
            console.log(`   Prix: ${course.prix} TND`);
            console.log(`   Formateur: ${course.formateur ? `${course.formateur.prenom} ${course.formateur.nom}` : 'Non défini'}`);
        } else {
            console.log('\n⚠️  Aucun cours trouvé');
        }

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testCoursesAPI();
