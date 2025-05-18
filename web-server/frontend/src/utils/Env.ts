export const getEnv = () => {
  const { VITE_API_URL, ...otherViteConfig } = import.meta.env
  var API_BASE_URL = 'http://172.16.100.12:8080'
  return {
    API_BASE_URL: `${API_BASE_URL}`,
    API_CREATE_USER: `${API_BASE_URL}/users`,
    API_CREATE_PROFESSOR: `${API_BASE_URL}/users/professors`,
    API_CREATE_SUBJECT: `${API_BASE_URL}/subjects`,
    API_VALIDATE_USER: `${API_BASE_URL}/users/validate`,
    API_BASES: `${API_BASE_URL}/bases`,
    API_ENROLL_USER_IN_SUBJECT: `${API_BASE_URL}/subjects/{subjectId}/add/users/{userEmail}`,
    API_REMOVE_USER_FROM_SUBJECT: `${API_BASE_URL}/subjects/{subjectId}/remove/users/{userEmail}`,
    API_CREATE_INSTANCE: `${API_BASE_URL}/instances/create`,
    API_CREATE_TEMPLATE: `${API_BASE_URL}/templates/define`,
    API_DELETE_SUBJECT: `${API_BASE_URL}/subjects/{id}`,
    API_DELETE_INSTANCE: `${API_BASE_URL}/instances/delete/{instanceId}`,
    API_GET_INSTANCE_STATUS: `${API_BASE_URL}/instances/status/{userId}`,
    API_GET_INSTANCE: `${API_BASE_URL}/instances/{instanceId}`,
    API_START_INSTANCE: `${API_BASE_URL}/instances/start/{instanceId}`,
    API_STOP_INSTANCE: `${API_BASE_URL}/instances/stop/{instanceId}`,
    API_GET_SUBJECT: `${API_BASE_URL}/subjects/{id}`,
    API_GET_TEMPLATES: `${API_BASE_URL}/templates/subjects/{subjectId}`,
    API_GET_WIREGUARD: `${API_BASE_URL}/instances/wireguard/{instanceId}`,
    API_DELETE_TEMPLATE: `${API_BASE_URL}/templates/delete/{templateId}/{subjectId}`,
    API_GET_SUBJECTS: `${API_BASE_URL}/subjects`,
    API_VERIFY_EMAIL: `${API_BASE_URL}/verify-email/{token}`,
    API_GET_SERVER_STATUS: `${API_BASE_URL}/servers/status`,
    __vite__: otherViteConfig,
  }
}
