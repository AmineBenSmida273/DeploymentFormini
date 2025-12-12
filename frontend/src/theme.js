// Thème Formini - Couleurs orange, blanc, noir
export const theme = {
  // Couleurs principales
  colors: {
    primary: '#f97316',        // Orange principal
    primaryDark: '#ea580c',    // Orange foncé
    primaryLight: '#fb923c',   // Orange clair
    primaryVeryLight: '#ffdab2ff', // Orange très clair
    
    // Noir et gris
    dark: '#1f2937',           // Noir principal
    darkSecondary: '#374151',  // Gris foncé
    darkTertiary: '#3b4c61ff', // Gris bleu foncé (footer)
    
    // Blanc et gris clair
    white: '#ffffff',
    lightGray: '#f8fafc',      // Fond clair
    gray: '#6b7280',          // Texte gris
    grayLight: '#9ca3af',     // Texte gris clair
    grayBorder: '#e5e7eb',    // Bordures grises
    grayBorderLight: '#dfe3f0', // Bordures grises claires
    
    // Dégradés
    gradientOrange: 'linear-gradient(135deg, #ffdab2ff, #fb923c)',
    gradientOrangeDark: 'linear-gradient(135deg, #da6512ff, #ffb376ff)',
    gradientHero: 'linear-gradient(135deg, #ffdab2ff, #fb923c)',
    gradientPage: 'linear-gradient(120deg, #ef7212bb, #ffffffff, #ef7212bb)',
  },
  
  // Typographie
  typography: {
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
    h1: {
      fontSize: '3.5rem',
      fontWeight: 'bold',
      color: '#1f2937',
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      color: '#1f2937',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#1f2937',
    },
    body: {
      fontSize: '1rem',
      color: '#6b7280',
    },
  },
  
  // Espacements
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '20px',
    lg: '30px',
    xl: '50px',
    xxl: '80px',
  },
  
  // Bordures
  borderRadius: {
    sm: '8px',
    md: '10px',
    lg: '15px',
    xl: '20px',
    xxl: '25px',
  },
  
  // Ombres
  shadows: {
    sm: '0 4px 6px rgba(0, 0, 0, 0.1)',
    md: '0 10px 25px rgba(249, 115, 22, 0.15)',
    lg: '0 20px 40px rgba(0,0,0,0.1)',
    xl: '20px 20px 20px 20px rgba(0,0,0,0.1)',
  },
  
  // Transitions
  transitions: {
    default: 'all 0.3s ease',
    fast: 'all 0.2s ease',
  },
};
