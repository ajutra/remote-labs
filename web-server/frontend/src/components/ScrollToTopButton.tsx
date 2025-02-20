import React from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUp } from 'lucide-react'
import useScrollToTop from '@/hooks/useScrollToTop'

const ScrollToTopButton: React.FC = () => {
  const { showScroll, scrollTop } = useScrollToTop(300)

  return (
    <Button
      variant="default"
      className={`fixed bottom-8 right-8 h-12 w-12 rounded-full transition-transform duration-300 ${
        showScroll ? 'scale-100' : 'scale-0'
      }`}
      onClick={scrollTop}
    >
      <ArrowUp strokeWidth={4} color="white" />
    </Button>
  )
}

export default ScrollToTopButton
