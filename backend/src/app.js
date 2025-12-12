const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Configuration EJS pour les vues
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware pour accepter les requêtes JSON et le CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware pour les fichiers statiques (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Servir les fichiers uploadés (CVs)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes utilisateurs
app.use('/api/users', require('./routes/user.routes'));

// Routes d'authentification MFA
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/courses', require('./routes/course.routes'));
app.use('/api/payment', require('./routes/payment.routes'));
app.use('/api/enrollments', require('./routes/enrollment.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));

// Routes pour les pages (ajoutez cette section)
app.use('/auth', require('./routes/auth.routes'));

// Route test
app.get('/', (req, res) => {
  res.send('Formini API Running ✅');
});

module.exports = app;