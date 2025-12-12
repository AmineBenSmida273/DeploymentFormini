
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connecté: ${conn.connection.host}`);
    console.log(`📁 Base de données: ${conn.connection.name}`);
    
  } catch (error) {
    console.error(`❌ Erreur de connexion MongoDB: ${error.message}`);
    console.log('💡 Vérifie que:');
    console.log('   - Ton lien MongoDB Atlas est correct dans le .env');
    console.log('   - Ton utilisateur a les bonnes permissions');
    console.log('   - Ton IP est autorisée dans Network Access');
    console.log('   - Internet fonctionne');
    
    process.exit(1);
  }
};

mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connecté à la base de données');
});

mongoose.connection.on('error', (err) => {
  console.log(`❌ Erreur Mongoose: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose déconnecté');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('👋 Connexion MongoDB fermée - Arrêt de l\'application');
  process.exit(0);
});

module.exports = connectDB;
