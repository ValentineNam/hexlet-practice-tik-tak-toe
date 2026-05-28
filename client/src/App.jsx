import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import Game from './components/Game';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Home user={user} /> : <Navigate replace to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/games/:id" element={user ? <Game user={user} /> : <Navigate replace to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;