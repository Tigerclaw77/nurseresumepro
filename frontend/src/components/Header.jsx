import React from "react";
import { Link } from "react-router-dom";
import "../styles/Header.css";

const Header = () => (
  <header className="site-header">
    <div className="nav-links">
      <Link to="/" className="no-underline">
        Nurse Resume Pro
      </Link>
    </div>
    <nav className="nav-links">
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
      <Link to="/contact">Contact</Link>
    </nav>
  </header>
);

export default Header;
