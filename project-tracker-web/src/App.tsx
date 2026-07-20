import './App.css'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProjectDashboard from './ProjectDashBoard/ProjectDashBoard';
import EmployeeManager from './components/normal/EmployeeManager';
import AuthModal from './components/normal/AuthModal';
import ProfileView from './components/normal/ProfileView';
import ProjectWizard from './ProjectWizard/ProjectWizard';
import { WizardProvider } from './context/WizardContext';

type ActiveView = 'dashboard' | 'create' | 'employees' | 'profile';

export default function App() {
  const [view, setView] = useState<ActiveView>('dashboard');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [initializing, setInitializing] = useState(true); // Interface blinking protection

  // session check on startup
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get('/api/auth/me', { withCredentials: true });
        setCurrentUser(res.data); 
      } catch (err) {
        setCurrentUser(null); 
      } finally {
        setInitializing(false);
      }
    };
    checkSession();
  }, []);

  if (initializing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-xs text-zinc-600 uppercase tracking-widest animate-pulse">
        Инициализация сессии...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-white selection:text-black">

      {/* navbar */}
      <nav className="border-b border-zinc-900 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div onClick={() => setView('dashboard')} className="flex items-center space-x-3 cursor-pointer group">
            <div className="h-8 w-8 rounded-lg border border-white bg-black flex items-center justify-center transition-all group-hover:bg-white">
              <span className="text-sm font-black text-white group-hover:text-black font-mono">P</span>
            </div>
            <span className="text-xs uppercase tracking-widest font-mono text-zinc-400 group-hover:text-white transition-colors">
              Project Manager
            </span>
          </div>

          <div className="flex items-center space-x-6 text-xs uppercase tracking-widest font-mono text-zinc-500">
            <button
              onClick={() => setView('dashboard')}
              className={`hover:text-white transition-colors ${view === 'dashboard' ? 'text-white border-b border-white pb-1' : ''}`}
            >
              Проекты
            </button>
            {currentUser?.role === 'Leader' && (
              <button
                onClick={() => setView('employees')}
                className={`hover:text-white transition-colors ${view === 'employees' ? 'text-white border-b border-white pb-1' : ''}`}
              >
                Сотрудники
              </button>
            )}

            <span className="text-zinc-800">|</span>

            {/* Displaying the name or login button */}
            {currentUser ? (
              <button
                onClick={() => setView('profile')}
                className={`hover:text-white transition-colors font-bold ${view === 'profile' ? 'text-white border-b border-white pb-1' : ''}`}
              >
                {currentUser.fullName}
              </button>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="py-10">
        {view === 'dashboard' ? (
          <ProjectDashboard
            currentUser={currentUser} 
            onStartWizard={() => setView('create')}
          />
        ) : view === 'employees' ? (
          <EmployeeManager />
        ) : view === 'create' ? ( 
          <WizardProvider>
            <ProjectWizard
              onSuccess={() => setView('dashboard')}
              onCancel={() => setView('dashboard')} 
            />
          </WizardProvider>
        ) : view === 'profile' && currentUser ? (
          <ProfileView
            user={currentUser}
            onUpdateSuccess={(updatedUser) => setCurrentUser(updatedUser)}
            onLogoutSuccess={() => {
              setCurrentUser(null);
              setView('dashboard');
            }}
          />
        ) : (
          <div className="text-center text-zinc-600 uppercase font-mono text-xs mt-20">Доступ ограничен</div>
        )}
      </main>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(user) => setCurrentUser(user)}
      />
    </div>
  );
}