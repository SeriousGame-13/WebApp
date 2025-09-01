import React, { useState, lazy, Suspense } from "react";
import { Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import '../sphere-styles.css';

const AdminPage = lazy(() => import('../pages/AdminPage').then(module => ({ default: module.default.AdminPageMain })));
const MainLayout = lazy(() => import('../layouts/MainLayout').then(module => ({ default: module.default.HomePage })));
const NewApp = lazy(() => import('../layouts/newApp.jsx'));

import UserManagement from '../services/firebase/UserManagementSystem';
import ChallengeManagement from '../services/firebase/ChallengeManagement';

function Background() {
  return (
    <div className="background" aria-hidden>
      <div className="bg-gradient-1" />
      <div className="bg-gradient-2" />
      <div className="bg-overlay" />
    </div>
  );
}

function Brand() {
  return (
    <div className="brand-container">
      <div className="brand-icon">
        <div className="brand-ring-1" />
        <div className="brand-ring-2" />
      </div>
      <div className="brand-text">
        <p className="brand-subtitle">THE</p>
        <h1 className="screen-title">
          SPHERE
        </h1>
      </div>
    </div>
  );
}

function Field({ label, icon, type = "text", value, onChange, autoComplete, placeholder }) {
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  return (
    <label className="field-label">
      {label}
      <div className="field-container mt-1">
        <span className="field-icon">{icon}</span>
        <input
          type={isPass ? (show ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="field-input"
        />
        {isPass && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="password-toggle"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </label>
  );
}

function AppSelectionPopup({ onSelect, onCancel }) {
  return (
    <div className="login-toast" style={{ 
      position: 'fixed', 
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)',
      zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.9)',
      padding: '2rem',
      borderRadius: '1rem',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      minWidth: '300px'
    }}>
      <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Choose Application</h2>
      <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', opacity: 0.8, textAlign: 'center' }}>
        Select which version of the app you'd like to use:
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <button 
          className="login-submit"
          onClick={() => onSelect('main')}
          style={{ marginBottom: '0.5rem' }}
        >
          Main Application
        </button>
        <button 
          className="login-submit"
          onClick={() => onSelect('new')}
          style={{ color: '#f0abfc', background: 'rgba(255, 255, 255, 0.1)', marginBottom: '0.5rem' }}
        >
          New Application
        </button>
      </div>
      
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '1rem 0' }}></div>
      <div style={{ textAlign: 'right' }}>
        <button 
          onClick={onCancel}
          style={{ 
            background: 'transparent', 
            border: '1px solid rgba(255, 255, 255, 0.3)', 
            color: 'white', 
            padding: '0.5rem 1rem', 
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function LoginPage2() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");

  // App state management
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUserData] = useState(null);
  const [showAppSelectionPopup, setShowAppSelectionPopup] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  // Handle login functionality
  const handleLogin = async (email, password) => {
    setLoading(true);
    setErr("");
    setToast("");
    
    try {
      const userLogin = await UserManagement.loginUser(email, password);
      const userData = await UserManagement.getUser(userLogin.uid);
      
      setUserData(userData);
      setLoading(false);
      setIsLoggedIn(true);
      setToast(`Eingeloggt als ${email}`);
    } catch (error) {
      setLoading(false);
      setErr('Login failed: ' + error.message);
    }
  };

  // Handle signup functionality
  const handleSignup = async (name, email, password) => {
    setLoading(true);
    setErr("");
    setToast("");
    
    try {
      const userLogin = await UserManagement.signupUser(name, email, password);
      const userData = await UserManagement.getUser(userLogin.uid);
      
      // Add new User in all Public/Hidden Challenge
      try {
        await ChallengeManagement.addNewUserToChallenges(userLogin.uid);
      } catch (error) {
        console.error('Failed to add new user to challenges:', error);
      }
      
      setUserData(userData);
      setLoading(false);
      setIsLoggedIn(true);
      setToast(`Account erstellt für ${name}`);
    } catch (error) {
      setLoading(false);
      setErr('Registration failed: ' + error.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    
    if (!email || !pw || (mode === "register" && !name)) {
      setErr("Bitte alle Felder ausfüllen.");
      return;
    }

    if (mode === "login") {
      await handleLogin(email, pw);
    } else {
      await handleSignup(name, email, pw);
    }
  };

  // Admin check after log-in and app selection
  if (isLoggedIn && user && !showAppSelectionPopup && !selectedApp) {
    console.log('Login check - user:', user);
    console.log('Login check - user.isAdmin:', user.isAdmin);
    console.log('Login check - typeof user.isAdmin:', typeof user.isAdmin);

    if (user.isAdmin === true) {
      console.log('Redirecting to Admin page');
      return (
        <Suspense fallback={<div>Loading Admin...</div>}>
          <AdminPage user={user} />
        </Suspense>
      );
    } else {
      console.log('Showing app selection popup');
      setShowAppSelectionPopup(true);
    }
  }

  // Handle app selection
  if (isLoggedIn && user && selectedApp) {
    if (selectedApp === "main") {
      console.log('Redirecting to regular HomePage');
      return (
        <Suspense fallback={<div>Loading Main App...</div>}>
          <MainLayout />
        </Suspense>
      );
    } else if (selectedApp === "new") {
      console.log('Redirecting to new App');
      return (
        <Suspense fallback={<div>Loading New App...</div>}>
          <NewApp />
        </Suspense>
      );
    }
  }

  return (
    <div className="login-container">
      <Background />

      {toast && (
        <div className="login-toast">
          {toast}
        </div>
      )}

      {showAppSelectionPopup && (
        <AppSelectionPopup
          onSelect={(app) => {
            setSelectedApp(app);
            setShowAppSelectionPopup(false);
          }}
          onCancel={() => {
            // Default to main app if user cancels
            setSelectedApp("main");
            setShowAppSelectionPopup(false);
          }}
        />
      )}

      <div className="relative z-10 w-full" style={{ maxWidth: '28rem', margin: '0 1rem' }}>
        <Brand />

        <div className="login-card">
          {/* Toggle */}
          <div className="login-toggle">
            <button
              onClick={() => setMode("login")}
              className={mode === "login" ? "toggle-btn toggle-btn-active" : "toggle-btn toggle-btn-inactive"}
            >
              Login
            </button>
            <button
              onClick={() => setMode("register")}
              className={mode === "register" ? "toggle-btn toggle-btn-active" : "toggle-btn toggle-btn-inactive"}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <Field
                label="Name"
                icon={                <User className="w-4 h-4" />}
                value={name}
                onChange={setName}
                autoComplete="name"
                placeholder="Max Mustermann"
              />
            )}

            <Field
              label="E-Mail"
              icon={<Mail className="w-4 h-4" />}
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              placeholder="max@sphere.fit"
            />

            <Field
              label="Passwort"
              icon={<Lock className="w-4 h-4" />}
              type="password"
              value={pw}
              onChange={setPw}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="••••••••"
            />

            {err && (
              <div className="error-message">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="login-submit"
            >
              {loading ? (
                <span className="login-spinner" />
              ) : mode === "login" ? (
                <>
                  <LogIn className="w-5 h-5" /> Einloggen
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" /> Account erstellen
                </>
              )}
            </button>
          </form>

          <div className="login-meta">
            Mit dem Login stimmst du unseren Nutzungsbedingungen zu.
          </div>
        </div>

        <div className="login-footer">
          Made by Serious Games Gruppe 13
        </div>
      </div>
    </div>
  );
}