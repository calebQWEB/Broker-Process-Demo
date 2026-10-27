import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// In local dev, serve /api/* through the same handler Vercel runs in production,
// so `npm run dev` works without the Vercel CLI.
function localApi() {
    return {
        name: "local-api",
        configureServer(server) {
            server.middlewares.use("/api", async (req, res, next) => {
                try {
                    const { default: handler } =
                        await server.ssrLoadModule("/api/router.js");
                    await handler(req, res);
                } catch (err) {
                    next(err);
                }
            });
        },
    };
}

export default defineConfig(({ mode }) => {
    // Expose .env values (SUPABASE_URL, SUPABASE_SECRET_KEY) to the dev API handler
    Object.assign(process.env, loadEnv(mode, process.cwd(), ""));

    return {
        plugins: [react(), tailwindcss(), localApi()],
    };
});
