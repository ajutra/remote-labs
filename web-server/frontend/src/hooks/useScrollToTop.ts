import { useState, useEffect } from 'react'

const useScrollToTop = (minScrollDistance = 300) => {
  const [showScroll, setShowScroll] = useState(false)

  const checkScrollTop = () => {
    if (!showScroll && window.pageYOffset > minScrollDistance) {
      setShowScroll(true)
    } else if (showScroll && window.pageYOffset <= minScrollDistance) {
      setShowScroll(false)
    }
  }

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    window.addEventListener('scroll', checkScrollTop)
    return () => {
      window.removeEventListener('scroll', checkScrollTop)
    }
  }, [showScroll, minScrollDistance])

  return { showScroll, scrollTop }
}

export default useScrollToTop
