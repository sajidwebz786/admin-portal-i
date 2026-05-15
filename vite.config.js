import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const allowedHosts = [
  'admin-portal-i.onrender.com',
  ...(process.env.VITE_ALLOWED_HOSTS
    ? process.env.VITE_ALLOWED_HOSTS.split(',').map((host) => host.trim()).filter(Boolean)
    : [])
];

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts
  },
  preview: {
    allowedHosts
  }
});
