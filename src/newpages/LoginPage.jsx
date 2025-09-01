import React, { useState } from "react";
import { Mail, Lock, User as UserIcon, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import './sphere-styles.css';

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

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setToast("");
    if (!email || !pw || (mode === "register" && !name)) {
      setErr("Bitte alle Felder ausfüllen.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setToast(mode === "login" ? `Eingeloggt als ${email}` : `Account erstellt für ${name}`);
    }, 900);
  };

  return (
    <div className="login-container">
      <Background />

      {toast && (
        <div className="login-toast">
          {toast}
        </div>
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
                icon={<UserIcon className="w-4 h-4" />}
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