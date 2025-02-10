import React from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

const photos = [
  '/src/assets/image.png',
  '/src/assets/image.png',
  '/src/assets/image.png',
  '/src/assets/image.png',
  '/src/assets/image.png',
  // Agrega más rutas de fotos aquí
]

const PhotoCarousel: React.FC = () => {
  return (
    <div className="mx-auto">
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
      >
        <CarouselContent className="-ml-4">
          {photos.map((photo, index) => (
            <CarouselItem
              key={index}
              className="md:basis-1/1 basis-full pl-4 lg:basis-1/3"
            >
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                className="h-auto w-full object-cover"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 transform" />
        <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 transform" />
      </Carousel>
    </div>
  )
}

export default PhotoCarousel
