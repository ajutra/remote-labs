export const getEnv = () => {
  const { VITE_API_URL, ...otherViteConfig } = import.meta.env

  return {
    API_BASE_URL: `${VITE_API_URL}`,
    API_CREATE_USER: `${VITE_API_URL}/users`,
    API_CREATE_PROFESSOR: `${VITE_API_URL}/users/professors`,
    API_CREATE_SUBJECT: `${VITE_API_URL}/subjects`,
    API_VALIDATE_USER: `${VITE_API_URL}/users/validate`,
    API_BASES: `${VITE_API_URL}/bases`,
    API_ENROLL_USER_IN_SUBJECT: `${VITE_API_URL}/subjects/{subjectId}/add/users/{userEmail}`,
    API_CREATE_INSTANCE: `${VITE_API_URL}/instances/create`,
    API_CREATE_TEMPLATE: `${VITE_API_URL}/templates`,
    API_DELETE_SUBJECT: `${VITE_API_URL}/subjects/{id}`,
    API_DELETE_INSTANCE: `${VITE_API_URL}/instances/delete/{instanceId}`,
    __vite__: otherViteConfig,
  }
}
