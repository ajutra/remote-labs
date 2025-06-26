// This file previously used axios for API requests, but axios is no longer used in the project.
// If you need to add API utilities, you can implement them here using fetch or another library.
// import axios, { AxiosRequestConfig } from "axios";

// export const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // Add request interceptor to include auth token
// api.interceptors.request.use((config: AxiosRequestConfig) => {
//   const token = localStorage.getItem("token");
//   if (token && config.headers) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });