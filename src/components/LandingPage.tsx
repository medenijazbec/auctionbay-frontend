// src/components/LandingPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="landing-logo">AuctionBay</div>
        <nav className="landing-nav">
          <Link to="/login" className="nav-link">Log in</Link>
          <Link to="/register" className="nav-link secondary">Sign Up</Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="hero-content">
          <h1>E‑auctions Made Easy!</h1>
          <p>
            Create auction events, bid on items, and win great deals.
            Join AuctionBay today and start your bidding journey!
          </p>
          <Link to="/register" className="hero-cta">
            Start bidding
          </Link>
        </div>
        <div className="hero-image-container">
          <img src="/assets/landing_bg.jpg" alt="Auction Preview" className="hero-image" />
        </div>
      </section>

      <section className="auction-preview">
        <h2>Featured Auctions</h2>
        <div className="auction-grid">
          <div className="auction-card">
            <img src="/assets/card1.png" alt="Rubik Cube" />
            <p className="auction-title">Rubik Cube</p>
            <p className="auction-price">8 €</p>
          </div>
          <div className="auction-card">
            <img src="/assets/card2.png" alt="Macbook Pro 15 2015" />
            <p className="auction-title">Macbook Pro 15 2015</p>
            <p className="auction-price">200 €</p>
          </div>
          <div className="auction-card">
            <img src="/assets/card3.png" alt="iPad Pro 13inch" />
            <p className="auction-title">iPad Pro 13inch</p>
            <p className="auction-price">500 €</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
