import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

export default function CreateCourse() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const styles = getStyles(theme);

    const [formData, setFormData] = useState({
        titre: '',
        description: '',
        categorie: 'Développement Web',
        niveau: 'débutant',
        prix: 0,
        programme: '',
        image: '',
        chapitres: [{ titre: '', description: '', duree: '', type: 'text', contenu: '', fichier: null }]
    });

    const [chapterPreviews, setChapterPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Gestion des changements de champs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Effacer l'erreur du champ modifié
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    // Gestion des chapitres
    const handleChapterChange = (index, field, value) => {
        const newChapitres = [...formData.chapitres];
        newChapitres[index][field] = value;
        setFormData({ ...formData, chapitres: newChapitres });
    };

    // Gestion de l'upload de fichiers pour les chapitres
    const handleChapterFileChange = (index, e) => {
        const file = e.target.files[0];
        if (!file) return;

        const newChapitres = [...formData.chapitres];
        const chapterType = newChapitres[index].type;

        // Validation selon le type
        // Validation selon le type
        if (chapterType === 'pdf') {
            if (file.type !== 'application/pdf') {
                alert('Seuls les fichiers PDF sont acceptés');
                return;
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB
                alert('Le PDF ne doit pas dépasser 10MB');
                return;
            }
        }

        newChapitres[index].fichier = file;
        setFormData({ ...formData, chapitres: newChapitres });


    };

    const addChapter = () => {
        setFormData({
            ...formData,
            chapitres: [...formData.chapitres, { titre: '', description: '', duree: '', type: 'text', contenu: '', fichier: null }]
        });
    };

    const removeChapter = (index) => {
        if (formData.chapitres.length > 1) {
            const newChapitres = formData.chapitres.filter((_, i) => i !== index);
            const newPreviews = chapterPreviews.filter((_, i) => i !== index);
            setFormData({ ...formData, chapitres: newChapitres });
            setChapterPreviews(newPreviews);
        }
    };

    // Validation du formulaire
    const validateForm = () => {
        const newErrors = {};

        if (!formData.titre.trim()) {
            newErrors.titre = 'Le titre est obligatoire';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'La description est obligatoire';
        } else if (formData.description.length < 10) {
            newErrors.description = 'La description doit contenir au moins 10 caractères';
        }

        if (!formData.categorie) {
            newErrors.categorie = 'La catégorie est obligatoire';
        }

        if (!formData.niveau) {
            newErrors.niveau = 'Le niveau est obligatoire';
        }

        if (formData.prix < 0) {
            newErrors.prix = 'Le prix ne peut pas être négatif';
        }

        if (!formData.image.trim()) {
            newErrors.image = 'L\'image du cours est obligatoire';
        } else {
            try {
                new URL(formData.image);
            } catch (_) {
                newErrors.image = 'Veuillez entrer une URL valide';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Soumission du formulaire
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Préparer les données pour l'envoi
            const courseData = new FormData();
            courseData.append('titre', formData.titre);
            courseData.append('description', formData.description);
            courseData.append('categorie', formData.categorie);
            courseData.append('niveau', formData.niveau);
            courseData.append('prix', formData.prix);
            courseData.append('programme', formData.programme);

            // Ajouter l'image du cours
            if (formData.image) {
                courseData.append('image', formData.image);
            }

            // Préparer les chapitres
            const validChapitres = formData.chapitres.filter(ch => ch.titre.trim());
            const chapitresData = validChapitres.map((ch, index) => {
                // Pour les chapitres avec fichier physique (PDF uniquement maintenant)
                if (ch.type === 'pdf') {
                    return {
                        titre: ch.titre,
                        description: ch.description,
                        duree: ch.duree,
                        type: ch.type,
                        fichierIndex: ch.fichier ? index : null
                    };
                } else {
                    // Pour text et video, on envoie le contenu (texte ou URL)
                    return {
                        titre: ch.titre,
                        description: ch.description,
                        duree: ch.duree,
                        type: ch.type,
                        contenu: ch.contenu
                    };
                }
            });

            // Ajouter les données des chapitres
            if (chapitresData.length > 0) {
                courseData.append('chapitres', JSON.stringify(chapitresData));
            }

            // Ajouter les fichiers des chapitres
            validChapitres.forEach((ch, index) => {
                if (ch.fichier) {
                    courseData.append(`chapterFile_${index}`, ch.fichier);
                }
            });

            await courseService.createCourse(courseData);

            alert('✅ Cours créé avec succès !');
            navigate('/dashboard');
        } catch (error) {
            console.error('Erreur création cours:', error);
            alert('❌ Erreur lors de la création du cours: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <div>
                        <h1 style={styles.title}>📚 Créer un Nouveau Cours</h1>
                        <p style={styles.subtitle}>Remplissez les informations ci-dessous pour créer votre cours</p>
                    </div>
                    <div style={styles.headerActions}>
                        <ThemeToggle />
                        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
                            ← Retour au Dashboard
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main style={styles.main}>
                <form onSubmit={handleSubmit} style={styles.form}>
                    {/* Section Informations de base */}
                    <section style={styles.section}>
                        <h2 style={styles.sectionTitle}>📝 Informations de Base</h2>

                        <div style={styles.formGrid}>
                            {/* Titre */}
                            <div style={styles.formGroup}>
                                <label style={styles.label}>
                                    Titre du cours <span style={styles.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    name="titre"
                                    value={formData.titre}
                                    onChange={handleChange}
                                    placeholder="Ex: Introduction à React.js"
                                    style={errors.titre ? styles.inputError : styles.input}
                                />
                                {errors.titre && <span style={styles.errorText}>{errors.titre}</span>}
                            </div>

                            {/* Catégorie */}
                            <div style={styles.formGroup}>
                                <label style={styles.label}>
                                    Catégorie <span style={styles.required}>*</span>
                                </label>
                                <select
                                    name="categorie"
                                    value={formData.categorie}
                                    onChange={handleChange}
                                    style={styles.input}
                                >
                                    <option value="Développement Web">Développement Web</option>
                                    <option value="Design">Design</option>
                                    <option value="Business">Business</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Data Science">Data Science</option>
                                    <option value="Mobile">Développement Mobile</option>
                                    <option value="DevOps">DevOps</option>
                                    <option value="Cybersécurité">Cybersécurité</option>
                                </select>
                            </div>

                            {/* Niveau */}
                            <div style={styles.formGroup}>
                                <label style={styles.label}>
                                    Niveau <span style={styles.required}>*</span>
                                </label>
                                <select
                                    name="niveau"
                                    value={formData.niveau}
                                    onChange={handleChange}
                                    style={styles.input}
                                >
                                    <option value="débutant">Débutant</option>
                                    <option value="intermédiaire">Intermédiaire</option>
                                    <option value="avancé">Avancé</option>
                                </select>
                            </div>

                            {/* Prix */}
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Prix (TND)</label>
                                <input
                                    type="number"
                                    name="prix"
                                    value={formData.prix}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    style={errors.prix ? styles.inputError : styles.input}
                                />
                                {errors.prix && <span style={styles.errorText}>{errors.prix}</span>}
                                <small style={styles.hint}>Laissez 0 pour un cours gratuit</small>
                            </div>
                        </div>

                        {/* Description */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>
                                Description <span style={styles.required}>*</span>
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                placeholder="Décrivez votre cours en détail (minimum 10 caractères)..."
                                style={errors.description ? styles.textareaError : styles.textarea}
                            />
                            {errors.description && <span style={styles.errorText}>{errors.description}</span>}
                            <small style={styles.hint}>{formData.description.length} caractères</small>
                        </div>

                        {/* Programme */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Programme du cours</label>
                            <textarea
                                name="programme"
                                value={formData.programme}
                                onChange={handleChange}
                                rows="4"
                                placeholder="Décrivez le programme et les objectifs d'apprentissage..."
                                style={styles.textarea}
                            />
                            <small style={styles.hint}>Optionnel - Décrivez ce que les étudiants apprendront</small>
                        </div>
                    </section>

                    {/* Section Image */}
                    <section style={styles.section}>
                        <h2 style={styles.sectionTitle}>🖼️ Image du Cours</h2>

                        <div style={styles.imageUploadContainer}>
                            <div style={styles.imagePreviewBox}>
                                {formData.image ? (
                                    <img src={formData.image} alt="Aperçu" style={styles.imagePreview}
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/300x200?text=Image+Non+Valide' }}
                                    />
                                ) : (
                                    <div style={styles.imagePlaceholder}>
                                        <span style={styles.imagePlaceholderIcon}>📷</span>
                                        <p style={styles.imagePlaceholderText}>Aucune image sélectionnée</p>
                                    </div>
                                )}
                            </div>

                            <div style={styles.imageUploadActions}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Lien de l'image <span style={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="image"
                                        value={formData.image || ''} // Ensure it's not null for controlled input
                                        onChange={handleChange}
                                        placeholder="https://exemple.com/image.jpg"
                                        style={errors.image ? styles.inputError : styles.input}
                                    />
                                    {errors.image && <span style={styles.errorText}>{errors.image}</span>}
                                    <small style={styles.hint}>Entrez l'URL directe de l'image (JPG, PNG, GIF)</small>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section Chapitres */}
                    <section style={styles.section}>
                        <div style={styles.sectionHeader}>
                            <h2 style={styles.sectionTitle}>📑 Chapitres du Cours</h2>
                            <button type="button" onClick={addChapter} style={styles.addChapterBtn}>
                                ➕ Ajouter un chapitre
                            </button>
                        </div>

                        <div style={styles.chaptersContainer}>
                            {formData.chapitres.map((chapitre, index) => (
                                <div key={index} style={styles.chapterCard}>
                                    <div style={styles.chapterHeader}>
                                        <h3 style={styles.chapterTitle}>Chapitre {index + 1}</h3>
                                        {formData.chapitres.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeChapter(index)}
                                                style={styles.removeChapterBtn}
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>

                                    <div style={styles.chapterFormGrid}>
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Titre du chapitre</label>
                                            <input
                                                type="text"
                                                value={chapitre.titre}
                                                onChange={(e) => handleChapterChange(index, 'titre', e.target.value)}
                                                placeholder="Ex: Introduction aux composants React"
                                                style={styles.input}
                                            />
                                        </div>

                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Durée (minutes)</label>
                                            <input
                                                type="number"
                                                value={chapitre.duree}
                                                onChange={(e) => handleChapterChange(index, 'duree', e.target.value)}
                                                placeholder="Ex: 45"
                                                min="0"
                                                style={styles.input}
                                            />
                                        </div>
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Description du chapitre</label>
                                        <textarea
                                            value={chapitre.description}
                                            onChange={(e) => handleChapterChange(index, 'description', e.target.value)}
                                            rows="2"
                                            placeholder="Décrivez le contenu de ce chapitre..."
                                            style={styles.textarea}
                                        />
                                    </div>

                                    {/* Sélecteur de type de contenu */}
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Type de contenu</label>
                                        <div style={styles.typeSelector}>
                                            <label style={styles.typeOption}>
                                                <input
                                                    type="radio"
                                                    name={`type-${index}`}
                                                    value="text"
                                                    checked={chapitre.type === 'text'}
                                                    onChange={(e) => handleChapterChange(index, 'type', e.target.value)}
                                                    style={styles.radio}
                                                />
                                                <span style={styles.typeLabel}>📝 Texte</span>
                                            </label>
                                            <label style={styles.typeOption}>
                                                <input
                                                    type="radio"
                                                    name={`type-${index}`}
                                                    value="video"
                                                    checked={chapitre.type === 'video'}
                                                    onChange={(e) => handleChapterChange(index, 'type', e.target.value)}
                                                    style={styles.radio}
                                                />
                                                <span style={styles.typeLabel}>📹 Vidéo</span>
                                            </label>
                                            <label style={styles.typeOption}>
                                                <input
                                                    type="radio"
                                                    name={`type-${index}`}
                                                    value="pdf"
                                                    checked={chapitre.type === 'pdf'}
                                                    onChange={(e) => handleChapterChange(index, 'type', e.target.value)}
                                                    style={styles.radio}
                                                />
                                                <span style={styles.typeLabel}>📄 PDF</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Contenu conditionnel selon le type */}
                                    {chapitre.type === 'text' && (
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Contenu du chapitre</label>
                                            <textarea
                                                value={chapitre.contenu}
                                                onChange={(e) => handleChapterChange(index, 'contenu', e.target.value)}
                                                rows="6"
                                                placeholder="Écrivez le contenu de ce chapitre..."
                                                style={styles.textarea}
                                            />
                                        </div>
                                    )}

                                    {chapitre.type === 'video' && (
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Lien YouTube de la vidéo</label>
                                            <input
                                                type="text"
                                                value={chapitre.contenu || ''}
                                                onChange={(e) => handleChapterChange(index, 'contenu', e.target.value)}
                                                placeholder="Ex: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                                style={styles.input}
                                            />
                                            <small style={styles.hint}>Entrez l'URL complète de la vidéo YouTube</small>
                                        </div>
                                    )}

                                    {chapitre.type === 'pdf' && (
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Fichier PDF (Max 10MB)</label>
                                            <label style={styles.uploadBtn}>
                                                📄 {chapitre.fichier ? 'Changer le PDF' : 'Choisir un PDF'}
                                                <input
                                                    type="file"
                                                    accept="application/pdf"
                                                    onChange={(e) => handleChapterFileChange(index, e)}
                                                    style={styles.fileInput}
                                                />
                                            </label>
                                            {chapitre.fichier && (
                                                <div style={styles.fileInfo}>
                                                    <span style={styles.fileName}>✅ {chapitre.fichier.name}</span>
                                                    <span style={styles.fileSize}>({(chapitre.fichier.size / (1024 * 1024)).toFixed(2)} MB)</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Boutons d'action */}
                    <div style={styles.formActions}>
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            style={styles.cancelBtn}
                            disabled={loading}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            style={styles.submitBtn}
                            disabled={loading}
                        >
                            {loading ? '⏳ Création en cours...' : '✅ Créer le cours'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}

const getStyles = (theme) => ({
    container: {
        minHeight: '100vh',
        background: theme.background,
    },
    header: {
        background: theme.paper,
        padding: '20px 40px',
        boxShadow: theme.shadow,
        borderBottom: `1px solid ${theme.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
    },
    headerContent: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        flexWrap: 'wrap',
        gap: '20px',
    },
    title: {
        margin: 0,
        fontSize: '28px',
        color: theme.text,
        fontWeight: '700',
    },
    subtitle: {
        margin: '5px 0 0 0',
        fontSize: '14px',
        color: theme.textSecondary,
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
    },
    backBtn: {
        padding: '10px 20px',
        background: '#6b7280',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'all 0.3s',
    },
    main: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '30px',
    },
    section: {
        background: theme.paper,
        borderRadius: '16px',
        padding: '30px',
        boxShadow: theme.shadow,
        border: `1px solid ${theme.border}`,
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '15px',
    },
    sectionTitle: {
        fontSize: '22px',
        color: theme.text,
        margin: '0 0 20px 0',
        fontWeight: '600',
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '20px',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: theme.text,
    },
    required: {
        color: '#ef4444',
    },
    input: {
        padding: '12px 16px',
        border: `2px solid ${theme.border}`,
        borderRadius: '8px',
        fontSize: '14px',
        background: theme.background,
        color: theme.text,
        transition: 'all 0.3s',
        outline: 'none',
    },
    inputError: {
        padding: '12px 16px',
        border: '2px solid #ef4444',
        borderRadius: '8px',
        fontSize: '14px',
        background: theme.background,
        color: theme.text,
    },
    textarea: {
        padding: '12px 16px',
        border: `2px solid ${theme.border}`,
        borderRadius: '8px',
        fontSize: '14px',
        background: theme.background,
        color: theme.text,
        fontFamily: 'inherit',
        resize: 'vertical',
        outline: 'none',
    },
    textareaError: {
        padding: '12px 16px',
        border: '2px solid #ef4444',
        borderRadius: '8px',
        fontSize: '14px',
        background: theme.background,
        color: theme.text,
        fontFamily: 'inherit',
        resize: 'vertical',
    },
    hint: {
        fontSize: '12px',
        color: theme.textSecondary,
        fontStyle: 'italic',
    },
    errorText: {
        fontSize: '12px',
        color: '#ef4444',
        fontWeight: '500',
    },
    imageUploadContainer: {
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '30px',
        alignItems: 'start',
    },
    imagePreviewBox: {
        width: '300px',
        height: '200px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: `2px dashed ${theme.border}`,
        background: theme.background,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
    },
    imagePlaceholderIcon: {
        fontSize: '48px',
    },
    imagePlaceholderText: {
        fontSize: '14px',
        color: theme.textSecondary,
    },
    imageUploadActions: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    uploadBtn: {
        padding: '12px 24px',
        background: '#f97316',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        textAlign: 'center',
        transition: 'all 0.3s',
        display: 'inline-block',
    },
    fileInput: {
        display: 'none',
    },
    removeImageBtn: {
        padding: '10px 20px',
        background: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
    },
    addChapterBtn: {
        padding: '10px 20px',
        background: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'all 0.3s',
    },
    chaptersContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    chapterCard: {
        background: theme.background,
        borderRadius: '12px',
        padding: '20px',
        border: `1px solid ${theme.border}`,
    },
    chapterHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
    },
    chapterTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: theme.text,
        margin: 0,
    },
    removeChapterBtn: {
        padding: '6px 12px',
        background: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
    },
    chapterFormGrid: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '15px',
        marginBottom: '15px',
    },
    typeSelector: {
        display: 'flex',
        gap: '15px',
        flexWrap: 'wrap',
    },
    typeOption: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        border: `2px solid ${theme.border}`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.3s',
        background: theme.background,
    },
    typeLabel: {
        fontSize: '14px',
        fontWeight: '500',
        color: theme.text,
    },
    radio: {
        cursor: 'pointer',
    },
    fileInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        padding: '12px',
        background: theme.background,
        borderRadius: '8px',
        border: `1px solid ${theme.border}`,
        marginTop: '10px',
    },
    fileName: {
        fontSize: '14px',
        fontWeight: '600',
        color: theme.text,
    },
    fileSize: {
        fontSize: '12px',
        color: theme.textSecondary,
    },
    videoPreview: {
        width: '100%',
        maxWidth: '500px',
        borderRadius: '8px',
        marginTop: '15px',
        border: `1px solid ${theme.border}`,
    },
    formActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '15px',
        padding: '20px 0',
    },
    cancelBtn: {
        padding: '14px 32px',
        background: '#6b7280',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        transition: 'all 0.3s',
    },
    submitBtn: {
        padding: '14px 32px',
        background: '#f97316',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        transition: 'all 0.3s',
    },
});
