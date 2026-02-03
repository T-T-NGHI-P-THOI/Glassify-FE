import React from 'react'
import type { EmblaOptionsType } from 'embla-carousel'
import useEmblaCarousel from 'embla-carousel-react'
import { Box, Typography, Rating, Stack } from '@mui/material'
import { Link } from 'react-router-dom'
import {
  NextButton,
  PrevButton,
  usePrevNextButtons
} from './CustomEmblaCarouselButtons'

type ProductType = {
  id: string
  title: string
  price: string
  rating: number
  reviews: string
  shape: string
  image: string
  slug: string
  sku: string
}

type PropType = {
  slides: ProductType[]
  options?: EmblaOptionsType
}

const CustomProductCarousel = (props: PropType) => {
  const { slides, options } = props
  const [emblaRef, emblaApi] = useEmblaCarousel(options)

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick
  } = usePrevNextButtons(emblaApi)

  return (
    <div className="embla embla--product">
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {slides.map((product) => (
            <div className="embla__slide embla__slide--product" key={product.id}>
              <Link 
                to={`/product/${product.slug}/${product.sku}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Box
                  sx={{
                    bgcolor: 'white',
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                <Box
                  component="img"
                  src={product.image}
                  alt={product.title}
                  sx={{
                    width: '100%',
                    height: 200,
                    objectFit: 'cover',
                  }}
                />
                <Box sx={{ p: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#6b7280',
                      fontSize: '0.75rem',
                      mb: 0.5,
                    }}
                  >
                    {product.shape}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      fontSize: '1rem',
                      mb: 1,
                    }}
                  >
                    {product.title}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                    <Rating value={product.rating} precision={0.5} size="small" readOnly />
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      {product.reviews}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: '#3b82f6',
                    }}
                  >
                    {product.price}
                  </Typography>
                </Box>
              </Box>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="embla__controls">
        <div className="embla__buttons">
          <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
          <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
        </div>
      </div>
    </div>
  )
}

export default CustomProductCarousel
