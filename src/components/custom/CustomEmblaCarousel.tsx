import React from 'react'
import type { EmblaOptionsType } from 'embla-carousel'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { Box, Typography, Link } from '@mui/material'
import {
  NextButton,
  PrevButton,
  PlayPauseButton,
  usePrevNextButtons,
  usePlayPauseButton
} from './CustomEmblaCarouselButtons'

type CollectionType = {
  title: string
  subtitle: string
  description: string
  image: string
  linkText: string
}

type PropType = {
  slides: CollectionType[]
  options?: EmblaOptionsType
}

const EmblaCarousel = (props: PropType) => {
  const { slides, options } = props
  const autoplay = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false })
  )
  const [emblaRef, emblaApi] = useEmblaCarousel(options, [autoplay.current])

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick
  } = usePrevNextButtons(emblaApi)

  const { isPlaying, toggleAutoplay } = usePlayPauseButton(emblaApi, autoplay.current)

  return (
    <div className="embla">
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {slides.map((slide, idx) => (
            <div className="embla__slide" key={idx}>
              <Box
                sx={{
                  position: 'relative',
                  height: 500,
                  borderRadius: 2,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  '&:hover': {
                    '& .overlay': {
                      opacity: 0.8,
                    },
                  },
                }}
              >
                <Box
                  component="img"
                  src={slide.image}
                  alt={slide.title}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <Box
                  className="overlay"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    bgcolor: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    p: 4,
                    transition: 'opacity 0.3s ease',
                  }}
                >
                  <Typography
                    variant="overline"
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      letterSpacing: 2,
                      mb: 1,
                    }}
                  >
                    {slide.subtitle}
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '1.5rem', md: '2.5rem' },
                      textAlign: 'center',
                      mb: 2,
                    }}
                  >
                    {slide.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      textAlign: 'center',
                      mb: 3,
                      maxWidth: 500,
                    }}
                  >
                    {slide.description}
                  </Typography>
                  <Link
                    href="#"
                    sx={{
                      color: 'white',
                      textDecoration: 'none',
                      fontWeight: 600,
                      borderBottom: '2px solid white',
                      '&:hover': {
                        opacity: 0.8,
                      },
                    }}
                  >
                    {slide.linkText} →
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
          <PlayPauseButton isPlaying={isPlaying} onClick={toggleAutoplay} />
          <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
        </div>
      </div>
    </div>
  )
}

export default EmblaCarousel