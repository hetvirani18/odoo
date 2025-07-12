import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/layout/Navbar';
import HomePage from './pages/home/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import QuestionDetailPage from './pages/question/QuestionDetailPage';
import AskQuestionPage from './pages/question/AskQuestionPage';
import ProfilePage from './pages/profile/ProfilePage';
import NotFoundPage from './pages/common/NotFoundPage';
import PrivateRoute from './components/common/PrivateRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import { CustomToastProvider } from './components/common/CustomToast';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <CustomToastProvider>
        <Router>
          <AuthProvider>
            <NotificationProvider>
              <div className="app">
                <Navbar />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/questions/:id" element={<QuestionDetailPage />} />
                    <Route 
                      path="/ask" 
                      element={
                        <PrivateRoute>
                          <AskQuestionPage />
                        </PrivateRoute>
                      } 
                    />
                    <Route 
                      path="/profile" 
                      element={
                        <PrivateRoute>
                          <ProfilePage />
                        </PrivateRoute>
                      } 
                    />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </main>
              </div>
            </NotificationProvider>
          </AuthProvider>
        </Router>
      </CustomToastProvider>
    </ErrorBoundary>
  );
}

export default App;
