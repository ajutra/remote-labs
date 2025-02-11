export const getEnv = () => {
  const { VITE_API_URL, ...otherViteConfig } = import.meta.env

  return {
    API_BASE_URL: `${VITE_API_URL}`,
    API_CREATE_USER: `${VITE_API_URL}/users`,
    API_CREATE_PROFESSOR: `${VITE_API_URL}/users/professors`,
    API_CREATE_SUBJECT: `${VITE_API_URL}/subjects`,
    API_VALIDATE_USER: `${VITE_API_URL}/users/validate`,
    __vite__: otherViteConfig,
  }
}
