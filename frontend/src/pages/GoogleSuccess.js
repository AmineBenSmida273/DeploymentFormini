import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function GoogleSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    
    // Récupérer les données utilisateur depuis l'URL
    let userData = null;
    try {
      const userParam = params.get("user");
      if (userParam) {
        userData = JSON.parse(decodeURIComponent(userParam));
      }
    } catch (e) {
      console.error("Erreur lors du décodage des données utilisateur:", e);
      navigate("/login");
      return;
    }

    if (token) {
      // Stocker le token
      localStorage.setItem("token", token);
      
      // Stocker les données utilisateur si disponibles
      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
      }
      
      // Rediriger vers le tableau de bord étudiant par défaut
      // (le middleware d'authentification gérera les redirections si nécessaire)
      navigate("/student/dashboard");
    } else {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      color: '#333'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        borderRadius: '12px',
        backgroundColor: 'white',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <h2>Connexion réussie !</h2>
        <p>Redirection en cours...</p>
        <div style={{
          marginTop: '1rem',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div className="spinner" style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #f97316',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
}
