import React from 'react'
import type { EmblaOptionsType } from 'embla-carousel'
import useEmblaCarousel from 'embla-carousel-react'
import { Box, Typography, Link } from '@mui/material'
import {
  NextButton,
  PrevButton,
  usePrevNextButtons
} from './CustomEmblaCarouselButtons'

type FeatureType = {
  id: number
  image: string
  title: string
  description: string
  linkText: string
}

type PropType = {
  slides: FeatureType[]
  options?: EmblaOptionsType
}

const CustomFeatureCarousel = (props: PropType) => {
  const { slides, options } = props
  const [emblaRef, emblaApi] = useEmblaCarousel(options)

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick
  } = usePrevNextButtons(emblaApi)

  return (
    <div className="embla embla--feature">
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {slides.map((feature) => (
            <div className="embla__slide embla__slide--feature" key={feature.id}>
              <Box
                sx={{
                  bgcolor: 'white',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                  },
                }}
              >
                <Box
                  component="img"
                  src={feature.image}
                  alt={feature.title}
                  sx={{
                    width: '100%',
                    height: 250,
                    objectFit: 'cover',
                  }}
                />
                <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      mb: 2,
                      fontSize: '1.25rem',
                      textTransform: 'uppercase',
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#6b7280',
                      mb: 3,
                      flexGrow: 1,
                      lineHeight: 1.6,
                    }}
                  >
                    {feature.description}
                  </Typography>
                  <Link
                    href="#"
                    sx={{
                      color: '#3b82f6',
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {feature.linkText} →
                  </Link>
                </Box>
              </Box>
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

export default CustomFeatureCarousel
