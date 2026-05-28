import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <p>&copy; 2024 Tic Tac Toe Extended. All rights reserved.</p>
      <Link to="/roadmap">Roadmap & Features</Link>
    </footer>
  );
};

export default Footer;