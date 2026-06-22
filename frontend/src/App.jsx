import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <div className="navbar-brand">
            <span className="brand-icon">🌫️</span>
            <span className="brand-name">AirSense</span>
            <span className="brand-tag">AI Urban Air Quality Intelligence</span>
          </div>
          <div className="navbar-links">
            <NavLink to="/" end>Dashboard</NavLink>
            <NavLink to="/enforcement">Enforcement</NavLink>
            <NavLink to="/cities">Multi-City</NavLink>
            <NavLink to="/advisory">Advisory</NavLink>
          </div>
          <div className="navbar-badge">
            <span className="demo-badge">📊 Demo Mode</span>
            <span className="city-badge">🇮🇳 Delhi</span>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/enforcement" element={<Dashboard tab="enforcement" />} />
            <Route path="/cities" element={<Dashboard tab="cities" />} />
            <Route path="/advisory" element={<Dashboard tab="advisory" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
