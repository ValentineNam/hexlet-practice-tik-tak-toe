import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ user }) => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <header className="header">
      <nav className="nav">
        <Link to="/">Lobby</Link>
        <Link to="/history">History</Link>
        <Link to="/profile">Profile</Link>
        {user && <button onClick={handleLogout} className="logout-btn">Logout</button>}
      </nav>
    </header>
  );
};

export default Header;