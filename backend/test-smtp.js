const nodemailer = require('nodemailer');

// Installe une seule fois si pas déjà fait : npm install nodemailer

async function test() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,                 // false = STARTTLS (obligatoire sur 587)
    auth: {
      user: 'aminebensmida46@gmail.com',
      pass: 'fqycqeyobqepbqax'     // ton app password 16 caractères sans espace
    },
    tls: {
      rejectUnauthorized: false   // évite certains blocages antivirus/firewall
    },
    debug: true,                   // ← affiche tout le dialogue SMTP
    logger: true                   // ← encore plus de logs
  });

  try {
    console.log('Test de connexion en cours...');
    await transporter.verify();   // teste juste la connexion + auth
    console.log('Connexion et authentification OK ✅');

    // Envoi du vrai mail de test
    const info = await transporter.sendMail({
      from: '"Amine Test" <aminebensmida46@gmail.com>',
      to: 'azizbensmida0@gmail.com',
      subject: 'Test SMTP depuis mon PC – Ça marche enfin !',
      text: 'Salut Aziz,\n\nSi tu lis ce message, c’est que Gmail SMTP fonctionne parfaitement sur mon PC maintenant !\n\nEnvoyé le ' + new Date().toLocaleString('fr-FR'),
      html: '<b>Salut Aziz,</b><br><br>Si tu lis ce message, c’est que Gmail SMTP fonctionne parfaitement sur mon PC maintenant !<br><br>Envoyé le ' + new Date().toLocaleString('fr-FR')
    });

    console.log('MAIL ENVOYÉ ! Message ID:', info.messageId);
    console.log('Vérifie la boîte de azizbensmida0@gmail.com (et les spams)');
  } catch (err) {
    console.log('ÉCHEC :', err.message);
    if (err.response) console.log('Réponse serveur :', err.response);
  }
}

test();