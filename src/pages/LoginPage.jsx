import React, { useState, lazy, Suspense } from "react";
import { Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import '../components/styles/sphere-styles.css';

//const AdminPage = lazy(() => import('./admin/AdminPage.jsx').then(module => ({ default: module.default.AdminPageMain })));
//const MainLayout = lazy(() => import('../layouts/MainLayout.jsx').then(module => ({ default: module.default.AppLayout })));

const AdminPage = lazy(() => import('./admin/AdminPage.jsx'));
const MainLayout = lazy(() => import('../layouts/MainLayout.jsx'));


import UserManagement from '../services/UserManagementSystem.jsx';
import ChallengeManagement from '../services/ChallengeManagement.jsx';

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

// (Removed AppSelectionPopup; always route to Main Application for non-admin users)

export default function LoginPage() {
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
  // Removed app selection state; defaulting to Main Application

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

  // After login: admin -> AdminPage, else -> Main Application
  if (isLoggedIn && user) {
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
    }

    console.log('Redirecting to Main Application');
    return (
      <Suspense fallback={<div>Loading Main App...</div>}>
        <MainLayout />
      </Suspense>
    );
  }

  return (
    <div className="login-container">
      <Background />

      {toast && (
        <div className="login-toast">
          {toast}
        </div>
      )}

  {/* App selection removed; users go straight to Main Application unless admin */}

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