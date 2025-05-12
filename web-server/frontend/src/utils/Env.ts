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
    API_CREATE_TEMPLATE: `${VITE_API_URL}/templates/define`,
    API_DELETE_SUBJECT: `${VITE_API_URL}/subjects/{id}`,
    API_DELETE_INSTANCE: `${VITE_API_URL}/instances/delete/{instanceId}`,
    API_GET_INSTANCE_STATUS: `${VITE_API_URL}/instances/status/{userId}`,
    API_GET_INSTANCE: `${VITE_API_URL}/instances/{instanceId}`,
    API_START_INSTANCE: `${VITE_API_URL}/instances/start/{instanceId}`,
    API_STOP_INSTANCE: `${VITE_API_URL}/instances/stop/{instanceId}`,
    API_GET_SUBJECT: `${VITE_API_URL}/subjects/{id}`,
    __vite__: otherViteConfig,
  }
}
