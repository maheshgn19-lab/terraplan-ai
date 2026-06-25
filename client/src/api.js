// Central API base URL
// In development: uses localhost:5000
// In production (Vercel): uses the deployed backend URL from VITE_API_URL env var
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default API_BASE;
