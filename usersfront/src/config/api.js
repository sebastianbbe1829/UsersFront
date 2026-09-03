const API_URL = import.meta.env.DEV
  ? `http://${window.location.hostname}:8000`
  : import.meta.env.VITE_API_URL

export default API_URL
