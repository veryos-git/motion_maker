// license Jonas Immanuel Frey GPLubuntuuser@ubuntuuser-MS-7C52
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
