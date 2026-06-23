import { app } from "./app";
import { ensureUploadDirs } from "./utils/upload";

ensureUploadDirs();
app.listen(process.env.PORT ?? 3000);

console.log(
  `🦊 dbakademik API jalan di http://${app.server?.hostname}:${app.server?.port}`
);
console.log(`📚 Swagger docs: http://${app.server?.hostname}:${app.server?.port}/docs`);

