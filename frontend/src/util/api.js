import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API || "http://localhost:5050",
});

export default apiClient;
