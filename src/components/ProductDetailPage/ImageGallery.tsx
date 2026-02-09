import React, { useState, useRef } from 'react';
import { Videocam, ThreeSixty, KeyboardArrowUp, KeyboardArrowDown, ChevronLeft, ChevronRight } from '@mui/icons-material';
import './ImageGallery.css';

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, productName }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const maxVisibleThumbnails = 5;
  const showArrows = images.length > maxVisibleThumbnails;

  const handleScrollUp = () => {
    if (scrollPosition > 0) {
      setScrollPosition(scrollPosition - 1);
    }
  };

  const handleScrollDown = () => {
    if (scrollPosition < images.length - maxVisibleThumbnails) {
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
              transform: `translateY(-${scrollPosition * 90}px)`,
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
            <button className="thumbnail-360">
              <ThreeSixty className="icon-360" />
            </button>
          </div>
        </div>
        {showArrows && scrollPosition < images.length - maxVisibleThumbnails && (
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
        <button className="try-on-btn">
          <Videocam /> Try On
        </button>
      </div>
    </div>
  );
};

export default ImageGallery;