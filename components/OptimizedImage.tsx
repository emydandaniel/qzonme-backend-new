// ImageComponent for optimized image loading
import React, { useState, useEffect } from 'react';

interface ImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

export const OptimizedImage: React.FC<ImageProps> = ({
  src,
  alt,
  className,
  width,
  height
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Generate srcset for responsive images
  const generateSrcSet = (url: string) => {
    const breakpoints = [400, 800, 1200];
    return breakpoints
      .map(size => {
        const optimizedUrl = url.replace('/upload/', `/upload/w_${size},c_limit/`);
        return `${optimizedUrl} ${size}w`;
      })
      .join(', ');
  };

  return (
    <div className={`image-container ${loading ? 'loading' : ''}`}>
      {loading && (
        <div className="image-placeholder" style={{ width, height }}>
          Loading...
        </div>
      )}
      {error && (
        <div className="image-error" style={{ width, height }}>
          Failed to load image
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`optimized-image ${className || ''} ${loading ? 'hidden' : ''}`}
        width={width}
        height={height}
        loading="lazy"
        srcSet={generateSrcSet(src)}
        sizes="(max-width: 400px) 400px, (max-width: 800px) 800px, 1200px"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
      <noscript>
        <img
          src={src}
          alt={alt}
          className={className}
          width={width}
          height={height}
        />
      </noscript>
    </div>
  );
};