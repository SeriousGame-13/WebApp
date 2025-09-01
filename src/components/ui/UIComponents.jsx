import React, { useState, useEffect } from "react";
import { Trophy, Users, Home as HomeIcon, User, CalendarDays, Flame, Star, Moon, Settings, Search, Plus, Check, X, Dumbbell, Bike, HeartPulse, Activity, Info, Medal } from "lucide-react";

const GRADIENTS = [
  "avatar-gradient-0",
  "avatar-gradient-1", 
  "avatar-gradient-2",
  "avatar-gradient-3",
  "avatar-gradient-4",
  "avatar-gradient-5",
];

function initials(name = "?") {
  const parts = name.split(new RegExp("\\s+")).filter(Boolean);
  const letters = parts.slice(0, 2).map(p => p[0]?.toUpperCase() || "?");
  return letters.join("");
}

export function Avatar({ name, size = 48, seed }) {
  const idx = Math.abs((seed ?? name ?? "0").split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % GRADIENTS.length;
  const style = { width: size, height: size };
  return (
    <div className={`avatar ${GRADIENTS[idx]}`} style={style}>
      <span className="avatar-text">{initials(name)}</span>
    </div>
  );
}

export function Modal({ open, onClose, children, title, size = "md" }) {
  if (!open) return null;
  const maxW = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-xl" : "max-w-lg";
  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className={`modal-content ${maxW}`}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button onClick={onClose} className="modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Card({ children, onClick }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp onClick={onClick} className={onClick ? "card-button" : "card"}>
      {children}
    </Comp>
  );
}

function Background() {
  return (
    <div className="background" aria-hidden>
      <div className="bg-gradient-1" />
      <div className="bg-gradient-2" />
      <div className="bg-overlay" />
    </div>
  );
}

export function Screen({ children, title, subtitle, titleNode }) {
  return (
    <div className="screen">
      <Background />
      <header className="screen-header">
        {titleNode ? (
          titleNode
        ) : (
          <>
            {title && <h1 className="screen-title">{title}</h1>}
            {subtitle && <p className="screen-subtitle">{subtitle}</p>}
          </>
        )}
      </header>
      <main className="screen-main">{children}</main>
    </div>
  );
}

export function Stat({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-xl font-semibold text-slate-100">{value}</span>
    </div>
  );
}

export function Pill({ children, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`pill ${active ? 'pill-active' : 'pill-inactive'}`}
    >
      {children}
    </button>
  );
}

export function Legend() {
  const item = (lvl, cls) => (
    <div className="flex items-center gap-2">
      <span className={`inline-block w-4 h-4 rounded ${cls}`} />
      <span className="text-xs text-slate-300">Level {lvl}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-4">
      {item(1, badgeLevelColor(1))}
      {item(2, badgeLevelColor(2))}
      {item(3, badgeLevelColor(3))}
    </div>
  );
}