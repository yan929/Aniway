import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import flowbiteReact from "flowbite-react/plugin/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables based on the current mode (development, production)
  const env = loadEnv(mode, process.cwd(), "");

  const backendApiTarget = env.VITE_BACKEND_API;

  // Optional: Add a check or fallback if the env var isn't set during development
  if (mode === "development" && !backendApiTarget) {
    console.warn(
      "⚠️ VITE_BACKEND_API is not set in your .env file. Proxy might default incorrectly."
    );
  }

  return {
    plugins: [react(), tailwindcss(), flowbiteReact()],
    server: {
      proxy: {
        // Proxy requests starting with /api
        "/api": {
          // Use the loaded environment variable as the target
          target: backendApiTarget || "http://localhost:5050", // Fallback just in case
          changeOrigin: true, // Recommended for most setups
          // Optional: If your backend API doesn't expect the '/api' prefix,
          // you might want to rewrite the path:
          // rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
