/**
 * FIX #8: Carousel Animation Without Visibility Check
 * Uses IntersectionObserver to pause animations when off-screen.
 * Previously: Slides animated even when drawer was closed
 */

import React, { useState, useEffect, useRef } from 'react';

interface CarouselProps {
  slides: string[];
  interval?: number;
}

export const OptimizedCarousel: React.FC<CarouselProps> = ({ slides, interval = 4500 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer to detect visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Only animate when visible
  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, interval);

    return () => clearInterval(timer);
  }, [isVisible, slides.length, interval]);

  return (
    <div ref={containerRef} className="carousel-container">
      {slides.map((slide, idx) => (
        <div
          key={idx}
          style={{
            opacity: idx === currentIndex ? 0.6 : 0,
            transition: 'opacity 1.5s ease-in-out',
            position: 'absolute',
            inset: 0
          }}
        >
          <img src={slide} alt="slide" className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  );
};
