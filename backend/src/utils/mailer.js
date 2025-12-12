const nodemailer = require("nodemailer");

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

/**
 * Envoie un email
 */
const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Formini" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html
    });

    console.log("📨 Email envoyé :", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Erreur email :", error.message);
    return false; // Ne bloque jamais l'app
  }
};

/**
 * Envoie un code MFA
 */
exports.sendVerificationCode = async (email, code) => {
  const html = `
    <h2>Votre code Formini</h2>
    <p>Voici votre code de vérification :</p>
    <div style="
      font-size: 32px;
      background:#ef7212;
      color:white;
      padding:15px;
      width:200px;
      text-align:center;
      border-radius:10px;
    ">
      ${code}
    </div>
    <p>Ce code expire dans 10 minutes.</p>
  `;

  return sendEmail(email, "Votre code de vérification", html);
};
