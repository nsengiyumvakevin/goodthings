import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("transaction-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function request(path, options = {}) {
  try {
    const response = await api.request({
      url: path,
      method: options.method || "GET",
      data: options.body === undefined ? undefined : JSON.parse(options.body),
      headers: options.headers,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Something went wrong. Please try again.",
      { cause: error },
    );
  }
}

export default request;
