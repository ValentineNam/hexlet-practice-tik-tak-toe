import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import Game from './components/Game';
import History from './components/History';
import Profile from './components/Profile';
import Roadmap from './components/Roadmap';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  const [user, setUser] = useState(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });

  return (
    <BrowserRouter>
      <div className="app-layout">
        {user && <Header user={user} />}
        <main className="main-content">
          <Routes>
            <Route path="/" element={user ? <Home user={user} /> : <Navigate replace to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/games/:id" element={user ? <Game user={user} /> : <Navigate replace to="/login" />} />
            <Route path="/history" element={user ? <History /> : <Navigate replace to="/login" />} />
            <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate replace to="/login" />} />
            <Route path="/roadmap" element={user ? <Roadmap /> : <Navigate replace to="/login" />} />
          </Routes>
        </main>
        {user && <Footer />}
      </div>
    </BrowserRouter>
  );
}

export default App;