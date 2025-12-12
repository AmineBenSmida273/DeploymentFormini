require("dotenv").config();
const nodemailer = require("nodemailer");

async function testEmail() {
  try {
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

    await transporter.verify();
    console.log("✅ SMTP connecté.");

    const info = await transporter.sendMail({
      from: `"Test App" <${process.env.SMTP_USER}>`,
      to: 'azizbensmida0@gmail.com',
      subject: "Test Email",
      text: "Email fonctionnel !",
    });

    console.log("📨 Email envoyé :", info.messageId);

  } catch (err) {
    console.error("❌ ERREUR SMTP :", err);
  }
}

testEmail();
