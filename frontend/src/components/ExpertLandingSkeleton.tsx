import React from 'react';
import './ExpertLandingSkeleton.css';

const ExpertLandingSkeleton: React.FC = () => {
  return (
    <div className="skeleton-container">
      {/* Header Skeleton */}
      <div className="skeleton-header">
        <div className="skeleton-header-text">
          <div className="skeleton-line skeleton-title"></div>
          <div className="skeleton-line skeleton-subtitle"></div>
        </div>
      </div>

      {/* Back Button Skeleton */}
      <div className="skeleton-back-button"></div>

      {/* Main Content Skeleton */}
      <div className="skeleton-main-content">
        {/* Title Section Skeleton */}
        <div className="skeleton-title-section">
          <div className="skeleton-line skeleton-main-title"></div>
          <div className="skeleton-line skeleton-title-line"></div>
        </div>

        {/* Features Skeleton */}
        <div className="skeleton-features">
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <div key={index} className="skeleton-feature-block">
              <div className="skeleton-feature-content">
                <div className="skeleton-line skeleton-feature-title"></div>
                <div className="skeleton-line skeleton-feature-text"></div>
                <div className="skeleton-line skeleton-feature-text-short"></div>
              </div>
              <div className="skeleton-feature-image"></div>
            </div>
          ))}
        </div>

        {/* CTA Section Skeleton */}
        <div className="skeleton-cta-section">
          <div className="skeleton-line skeleton-cta-title"></div>
          <div className="skeleton-line skeleton-cta-title-short"></div>
          <div className="skeleton-button"></div>
        </div>
      </div>

      {/* FAQ Section Skeleton */}
      <div className="skeleton-faq-section">
        <div className="skeleton-line skeleton-faq-title"></div>
        <div className="skeleton-faq-items">
          <div className="skeleton-faq-item"></div>
          <div className="skeleton-faq-item"></div>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="skeleton-footer"></div>
    </div>
  );
};

export default ExpertLandingSkeleton;
