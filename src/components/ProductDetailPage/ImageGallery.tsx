import React, { useState } from 'react';
import { Videocam, ThreeSixty } from '@mui/icons-material';
import './ImageGallery.css';

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, productName }) => {
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <div className="image-gallery">
      <div className="main-image">
        <img src={images[selectedImage]} alt={productName} />
        <button className="try-on-btn">
          <Videocam /> Try On
        </button>
      </div>
      <div className="thumbnail-list">
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
  );
};

export default ImageGallery;
