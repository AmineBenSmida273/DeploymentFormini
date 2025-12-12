const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');


// Créer les dossiers uploads s'ils n'existent pas
const cvUploadsDir = path.join(__dirname, '../uploads/cvs');
const imageUploadsDir = path.join(__dirname, '../uploads/images');

if (!fs.existsSync(cvUploadsDir)) {
  fs.mkdirSync(cvUploadsDir, { recursive: true });
}
if (!fs.existsSync(imageUploadsDir)) {
  fs.mkdirSync(imageUploadsDir, { recursive: true });
}

// Parser multipart/form-data simple sans dépendance externe
function parseMultipart(req, res, next) {
  const contentType = req.headers['content-type'] || '';


  if (!contentType.includes('multipart/form-data')) {
    return next();
  }

  const boundary = contentType.split('boundary=')[1];
  if (!boundary) {
    return res.status(400).json({ message: 'Boundary manquant dans Content-Type' });
  }

  let body = '';
  const chunks = [];

  req.on('data', (chunk) => {
    chunks.push(chunk);
  });

  req.on('end', () => {
    try {
      const buffer = Buffer.concat(chunks);
      const parts = buffer.toString('binary').split('--' + boundary);

      req.body = {};
      let cvFile = null;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part || part.trim() === '' || part.trim() === '--') continue;

        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) continue;

        const headers = part.substring(0, headerEnd);
        const content = part.substring(headerEnd + 4);

        // Extraire le nom du champ
        const nameMatch = headers.match(/name="([^"]+)"/);
        if (!nameMatch) continue;

        const fieldName = nameMatch[1];

        // Vérifier si c'est un fichier
        const filenameMatch = headers.match(/filename="([^"]+)"/);


        if (filenameMatch && fieldName === 'cv') {
          // C'est le fichier CV
          const filename = filenameMatch[1];

          // Vérifier l'extension
          if (!filename.toLowerCase().endsWith('.pdf')) {
            return res.status(400).json({
              message: 'Seuls les fichiers PDF sont autorisés'
            });
          }

          // Extraire le contenu du fichier (enlever les \r\n de fin)
          const fileContent = content.replace(/\r\n$/, '');
          const fileBuffer = Buffer.from(fileContent, 'binary');

          // Vérifier la taille (5MB max)
          if (fileBuffer.length > 5 * 1024 * 1024) {

            return res.status(400).json({
              message: 'Le fichier est trop volumineux (max 5MB)'
            });
          }

          // Générer un nom de fichier unique
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const email = req.body.email ? req.body.email.split('@')[0] : 'user';
          const newFileName = `${email}-${uniqueSuffix}.pdf`;

          const newFilePath = path.join(cvUploadsDir, newFileName);

          // Sauvegarder le fichier
          fs.writeFileSync(newFilePath, fileBuffer);
          req.uploadedCV = `/uploads/cvs/${newFileName}`;
        } else {
          // C'est un champ texte normal
          const fieldValue = content.replace(/\r\n$/, '').trim();
          req.body[fieldName] = fieldValue;
        }
      }

      next();
    } catch (error) {
      console.error('Erreur parsing multipart:', error);

      return res.status(500).json({
        message: 'Erreur lors du traitement de la requête',
        error: error.message
      });
    }
  });

  req.on('error', (error) => {

    return res.status(500).json({
      message: 'Erreur lors de la réception des données',
      error: error.message
    });
  });
}


// Middleware générique pour upload d'images
function parseImageUpload(fieldName) {
  return (req, res, next) => {
    const contentType = req.headers['content-type'] || '';

    if (!contentType.includes('multipart/form-data')) {
      return next();
    }

    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      return res.status(400).json({ message: 'Boundary manquant dans Content-Type' });
    }

    const chunks = [];

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const parts = buffer.toString('binary').split('--' + boundary);

        req.body = {};

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (!part || part.trim() === '' || part.trim() === '--') continue;

          const headerEnd = part.indexOf('\r\n\r\n');
          if (headerEnd === -1) continue;

          const headers = part.substring(0, headerEnd);
          const content = part.substring(headerEnd + 4);

          const nameMatch = headers.match(/name="([^"]+)"/);
          if (!nameMatch) continue;

          const currentFieldName = nameMatch[1];
          const filenameMatch = headers.match(/filename="([^"]+)"/);

          if (filenameMatch && currentFieldName === fieldName) {
            // C'est le fichier image
            const filename = filenameMatch[1];
            const ext = path.extname(filename).toLowerCase();

            // Vérifier l'extension
            const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            if (!allowedExts.includes(ext)) {
              return res.status(400).json({
                message: 'Format d\'image non autorisé. Utilisez JPG, PNG, GIF ou WEBP'
              });
            }

            // Extraire le contenu du fichier
            const fileContent = content.replace(/\r\n$/, '');
            const fileBuffer = Buffer.from(fileContent, 'binary');

            // Vérifier la taille (5MB max)
            if (fileBuffer.length > 5 * 1024 * 1024) {
              return res.status(400).json({
                message: 'L\'image est trop volumineuse (max 5MB)'
              });
            }

            // Générer un nom de fichier unique
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const newFileName = `course-${uniqueSuffix}${ext}`;
            const newFilePath = path.join(imageUploadsDir, newFileName);

            // Sauvegarder le fichier
            fs.writeFileSync(newFilePath, fileBuffer);

            // Ajouter les infos du fichier à req.file (compatible avec multer)
            req.file = {
              fieldname: fieldName,
              originalname: filename,
              filename: newFileName,
              path: newFilePath,
              size: fileBuffer.length,
              mimetype: `image/${ext.substring(1)}`
            };
          } else if (!filenameMatch) {
            // C'est un champ texte normal
            const fieldValue = content.replace(/\r\n$/, '').trim();
            req.body[currentFieldName] = fieldValue;
          }
        }

        next();
      } catch (error) {
        console.error('Erreur parsing image upload:', error);
        return res.status(500).json({
          message: 'Erreur lors du traitement de l\'image',
          error: error.message
        });
      }
    });

    req.on('error', (error) => {
      return res.status(500).json({
        message: 'Erreur lors de la réception des données',
        error: error.message
      });
    });
  };
}

// Export avec interface compatible multer
module.exports = {
  uploadMiddleware: parseMultipart,
  validatePDF: (req, res, next) => {
    // La validation est déjà faite dans parseMultipart
    next();

  },
  single: (fieldName) => parseImageUpload(fieldName),
  // Middleware pour gérer plusieurs fichiers (pour les chapitres)
  fields: (fieldsArray) => {
    return (req, res, next) => {
      const contentType = req.headers['content-type'] || '';

      if (!contentType.includes('multipart/form-data')) {
        return next();
      }

      const boundary = contentType.split('boundary=')[1];
      if (!boundary) {
        return res.status(400).json({ message: 'Boundary manquant dans Content-Type' });
      }

      const chunks = [];

      req.on('data', (chunk) => {
        chunks.push(chunk);
      });

      req.on('end', () => {
        try {
          const buffer = Buffer.concat(chunks);
          const parts = buffer.toString('binary').split('--' + boundary);

          req.body = {};
          req.files = [];

          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!part || part.trim() === '' || part.trim() === '--') continue;

            const headerEnd = part.indexOf('\r\n\r\n');
            if (headerEnd === -1) continue;

            const headers = part.substring(0, headerEnd);
            const content = part.substring(headerEnd + 4);

            const nameMatch = headers.match(/name="([^"]+)"/);
            if (!nameMatch) continue;

            const fieldName = nameMatch[1];
            const filenameMatch = headers.match(/filename="([^"]+)"/);

            if (filenameMatch) {
              // C'est un fichier
              const filename = filenameMatch[1];
              const ext = path.extname(filename).toLowerCase();

              // Déterminer le type de fichier et le dossier de destination
              let uploadDir, allowedExts, maxSize, fileType;

              if (fieldName === 'image' || fieldName.startsWith('chapterFile_')) {
                // Vérifier si c'est une vidéo ou une image
                const videoExts = ['.mp4', '.webm', '.ogg', '.avi'];
                const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
                const pdfExts = ['.pdf'];

                if (videoExts.includes(ext)) {
                  uploadDir = path.join(__dirname, '../uploads/videos');
                  allowedExts = videoExts;
                  maxSize = 100 * 1024 * 1024; // 100MB
                  fileType = 'video';
                } else if (imageExts.includes(ext)) {
                  uploadDir = imageUploadsDir;
                  allowedExts = imageExts;
                  maxSize = 5 * 1024 * 1024; // 5MB
                  fileType = 'image';
                } else if (pdfExts.includes(ext)) {
                  uploadDir = path.join(__dirname, '../uploads/pdfs');
                  allowedExts = pdfExts;
                  maxSize = 10 * 1024 * 1024; // 10MB
                  fileType = 'pdf';
                } else {
                  continue; // Type non supporté
                }

                // Créer le dossier s'il n'existe pas
                if (!fs.existsSync(uploadDir)) {
                  fs.mkdirSync(uploadDir, { recursive: true });
                }

                // Vérifier l'extension
                if (!allowedExts.includes(ext)) {
                  return res.status(400).json({
                    message: `Format de fichier non autorisé pour ${fieldName}`
                  });
                }

                // Extraire le contenu du fichier
                const fileContent = content.replace(/\r\n$/, '');
                const fileBuffer = Buffer.from(fileContent, 'binary');

                // Vérifier la taille
                if (fileBuffer.length > maxSize) {
                  return res.status(400).json({
                    message: `Le fichier ${fieldName} est trop volumineux`
                  });
                }

                // Générer un nom de fichier unique
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const newFileName = `${fileType}-${uniqueSuffix}${ext}`;
                const newFilePath = path.join(uploadDir, newFileName);

                // Sauvegarder le fichier
                fs.writeFileSync(newFilePath, fileBuffer);

                // Ajouter les infos du fichier
                const fileInfo = {
                  fieldname: fieldName,
                  originalname: filename,
                  filename: newFileName,
                  path: newFilePath,
                  size: fileBuffer.length,
                  mimetype: `${fileType}/${ext.substring(1)}`
                };

                if (fieldName === 'image') {
                  req.file = fileInfo;
                } else {
                  req.files.push(fileInfo);
                }
              }
            } else {
              // C'est un champ texte normal
              const fieldValue = content.replace(/\r\n$/, '').trim();
              req.body[fieldName] = fieldValue;
            }
          }

          next();
        } catch (error) {
          console.error('Erreur parsing multiple files:', error);
          return res.status(500).json({
            message: 'Erreur lors du traitement des fichiers',
            error: error.message
          });
        }
      });

      req.on('error', (error) => {
        return res.status(500).json({
          message: 'Erreur lors de la réception des données',
          error: error.message
        });
      });
    };
  }
};
