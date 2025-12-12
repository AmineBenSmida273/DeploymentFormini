import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api` 
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token aux requêtes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs globales
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Anciennes routes (à garder pour compatibilité)
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/auth/login', credentials), // Route pour admin sans MFA

  // NOUVELLES ROUTES MFA
  registerWithMFA: (userData) => {
    // Si FormData (avec fichier), ne pas utiliser JSON
    if (userData instanceof FormData) {
      return api.post('/auth/register-mfa', userData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/auth/register-mfa', userData);
  },
  verifyMFA: (data) => api.post('/auth/verify-mfa', data),
  resendVerificationCode: (data) => api.post('/auth/resend-verification', data),
  loginWithMFA: (credentials) => api.post('/auth/login-mfa', credentials),
  facebookLogin: (accessToken) => api.post('/auth/facebook-login', { accessToken }),

  // PASSWORD RESET
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyResetCode: (data) => api.post('/auth/verify-reset-code', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),

  // Fonction utilitaire pour vérifier si l'utilisateur est connecté
  checkAuth: () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    return {
      isAuthenticated: !!token,
      user: user ? JSON.parse(user) : null
    };
  },

  // Déconnexion
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('pendingVerificationEmail');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  }
};

// Service utilisateur (pour plus tard)
export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  changePassword: (passwordData) => api.put('/users/change-password', passwordData),
  getMyReviews: () => api.get('/users/my-reviews'),
  updateReview: (reviewId, reviewData) => api.put(`/users/reviews/${reviewId}`, reviewData),
  getMyCertificates: () => api.get('/users/my-certificates'),

};

// Service cours (pour plus tard)
export const courseService = {
  getAllCourses: (params) => api.get('/courses', { params }),
  getCourse: (id) => api.get(`/courses/${id}`),
  getCategories: () => api.get('/courses/categories'),
  createCourse: (courseData) => api.post('/courses', courseData),
  updateCourse: (id, courseData) => api.put(`/courses/${id}`, courseData),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  getMyCourses: () => api.get('/courses/instructor/my-courses'),
  getPendingCourses: () => api.get('/courses/pending'),
  approveCourse: (id) => api.post(`/courses/${id}/approve`),
  rejectCourse: (id, raison) => api.post(`/courses/${id}/reject`, { raison }),

};

// Service dashboard
export const dashboardService = {
  getAdminStats: () => api.get('/users/dashboard/admin'),
  getStudentStats: () => api.get('/users/dashboard/student'),
  getInstructorStats: () => api.get('/users/dashboard/instructor'),
};

// Service notifications
export const notificationService = {
  getMyNotifications: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export const adminService = {
  getUserDetails: (userId) => api.get(`/users/admin/user/${userId}`),
  getAllUsers: () => api.get('/users/admin/all-users'),
  getPendingInstructors: () => api.get('/users/admin/pending-instructors'),
  approveInstructor: (instructorId) => api.post(`/users/admin/approve-instructor/${instructorId}`),
  rejectInstructor: (instructorId) => api.post(`/users/admin/reject-instructor/${instructorId}`),
  downloadCV: (instructorId) => api.get(`/users/admin/instructor/${instructorId}/cv`, { responseType: 'blob' }),
  toggleUserStatus: (userId, statut) => api.put(`/users/admin/user/${userId}/status`, { statut }),
  getReports: () => api.get('/users/admin/reports'),
};

// Service enrollment
export const enrollmentService = {
  markCourseCompleted: (courseId) => api.put(`/enrollments/course/${courseId}/complete`),
  updateCourseProgress: (courseId, lessonIndex, totalLessons) =>
    api.put(`/enrollments/course/${courseId}/progress`, { lessonIndex, totalLessons }),
};

// Service paiement
export const paymentService = {
  createFlouciPayment: (data) => api.post('/payment/flouci/create', data),
  verifyFlouciPayment: (data) => api.post('/payment/flouci/verify', data),
  processCardPayment: (data) => api.post('/payment/card', data),
  enrollFreeCourse: (courseId) => api.post('/payment/free-enroll', { courseId }),
};
export default api;