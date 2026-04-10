import React from 'react';
import './SnowboardLanding.css';

const SnowboardLanding: React.FC = () => {
  return (
    <div className="snowboard-landing">
      {/* Video Background */}
      <div className="hero-video">
        <video
          src={process.env.PUBLIC_URL + '/13155353_2160_3840_60fps.mp4'}
          autoPlay
          muted
          loop
          playsInline
          className="video-left"
        />
        <video
          src={process.env.PUBLIC_URL + '/110734-688648666_medium.mp4'}
          autoPlay
          muted
          loop
          playsInline
          className="video-right"
        />
      </div>

      {/* Hero Content */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">
            TAKE BOLD RISKS TO BREAK BARRIERS AND ACHIEVE SUCCESS.
          </h1>
          <div className="hero-btns">
            <a href="/snowboard" className="btn-primary">Snowboard</a>
            <a href="/surf" className="btn-secondary">Surf</a>
          </div>
        </div>
      </section>

      {/* Rest of the page – you can keep existing sections or add more later */}
    </div>
  );
};

export default SnowboardLanding;
