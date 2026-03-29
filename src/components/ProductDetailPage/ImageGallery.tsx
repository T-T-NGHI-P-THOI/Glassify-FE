import React, { useEffect, useState, useRef } from 'react';
import { Videocam, ThreeSixty, KeyboardArrowUp, KeyboardArrowDown, ChevronLeft, ChevronRight } from '@mui/icons-material';
import './ImageGallery.css';

interface ImageGalleryProps {
  images: string[];
  productName: string;
  showTryOn?: boolean;
  onTryOn?: () => void;
  showPreview3D?: boolean;
  onPreview3D?: () => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  productName,
  showTryOn = false,
  onTryOn,
  showPreview3D = false,
  onPreview3D,
}) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const maxVisibleThumbnails = 5;
  // Keep scroll step aligned with CSS thumbnail height + gap.
  const thumbnailStep = 100;
  const totalThumbnails = images.length;
  const maxScrollPosition = Math.max(0, totalThumbnails - maxVisibleThumbnails);
  const showArrows = totalThumbnails > maxVisibleThumbnails;

  useEffect(() => {
    if (scrollPosition > maxScrollPosition) {
      setScrollPosition(maxScrollPosition);
    }
  }, [scrollPosition, maxScrollPosition]);

  const handleScrollUp = () => {
    if (scrollPosition > 0) {
      setScrollPosition(scrollPosition - 1);
    }
  };

  const handleScrollDown = () => {
    if (scrollPosition < maxScrollPosition) {
      setScrollPosition(scrollPosition + 1);
    }
  };

  const handlePrevImage = () => {
    setSelectedImage((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = () => {
    setSelectedImage((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setStartX(clientX);
    setCurrentX(clientX);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setCurrentX(clientX);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const diff = startX - currentX;
    const threshold = 50; // Minimum swipe distance

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        handleNextImage();
      } else {
        handlePrevImage();
      }
    }
    
    setStartX(0);
    setCurrentX(0);
  };

  return (
    <div className="image-gallery">
      <div className="thumbnail-wrapper">
        {showArrows && scrollPosition > 0 && (
          <button className="thumbnail-nav-btn up" onClick={handleScrollUp}>
            <KeyboardArrowUp />
          </button>
        )}
        <div className="thumbnail-container" ref={thumbnailContainerRef}>
          <div 
            className="thumbnail-list" 
            style={{ 
              transform: `translateY(-${scrollPosition * thumbnailStep}px)`,
              transition: 'transform 0.3s ease'
            }}
          >
            {images.map((image, index) => (
              <button
                key={index}
                className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                onClick={() => setSelectedImage(index)}
              >
                <img src={image} alt={`${productName} view ${index + 1}`} />
              </button>
            ))}
          </div>
        </div>
        {showArrows && scrollPosition < maxScrollPosition && (
          <button className="thumbnail-nav-btn down" onClick={handleScrollDown}>
            <KeyboardArrowDown />
          </button>
        )}
      </div>
      
      <div 
        className="main-image"
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        <button className="carousel-nav-btn prev" onClick={handlePrevImage}>
          <ChevronLeft />
        </button>
        <img 
          src={images[selectedImage]} 
          alt={productName}
          draggable={false}
          style={{
            transform: isDragging ? `translateX(${currentX - startX}px)` : 'translateX(0)',
            transition: isDragging ? 'none' : 'transform 0.3s ease'
          }}
        />
        <button className="carousel-nav-btn next" onClick={handleNextImage}>
          <ChevronRight />
        </button>
        <div className="image-indicators">
          {images.map((_, index) => (
            <button
              key={index}
              className={`indicator ${selectedImage === index ? 'active' : ''}`}
              onClick={() => setSelectedImage(index)}
            />
          ))}
        </div>
        {(showTryOn || showPreview3D) && (
          <div className="image-gallery-action-buttons">
            {showTryOn && (
              <button
                type="button"
                className="image-gallery-try-on-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onTryOn?.();
                }}
              >
                <Videocam /> Try On
              </button>
            )}
            {showPreview3D && (
              <button
                type="button"
                className="image-gallery-preview-3d-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview3D?.();
                }}
                aria-label="Open 3D preview"
              >
                <ThreeSixty /> View 3D
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGallery;