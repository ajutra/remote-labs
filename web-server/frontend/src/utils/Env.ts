export const getEnv = () => {
    const { VITE_API_URL, ...otherViteConfig } = import.meta
      .env
  
    return {
      API_BASE_URL: `${VITE_API_URL}/api`,
      API_CREATE_USER: `${VITE_API_URL}/users`,
      __vite__: otherViteConfig,
    }
  }