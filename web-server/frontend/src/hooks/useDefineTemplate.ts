import { useState } from 'react'

export const useDefineTemplate = () => {
  const [loading, setLoading] = useState(false)

  const defineTemplate = async () => {
    setLoading(true)
    try {
      // La lógica de API se implementará después
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } finally {
      setLoading(false)
    }
  }

  return { defineTemplate, loading }
}
