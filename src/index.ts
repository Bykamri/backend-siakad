import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";

import { authRoutes } from "./routes/auth.routes";
import { dosenRoutes } from "./routes/dosen.routes";
import { mahasiswaRoutes } from "./routes/mahasiswa.routes";
import { matakuliahRoutes } from "./routes/matakuliah.routes";
import { krsRoutes, krsViewRoutes } from "./routes/krs.routes";

const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "API dbakademik",
          version: "1.0.0",
          description:
            "REST API untuk sistem akademik (matakuliah, dosen, mahasiswa, KRS) dengan role admin/dosen/mahasiswa",
        },
      },
    })
  )
  .get("/", () => ({
    success: true,
    message: "dbakademik API aktif",
    docs: "/docs",
  }))
  .use(authRoutes)
  .use(dosenRoutes)
  .use(mahasiswaRoutes)
  .use(matakuliahRoutes)
  .use(krsRoutes)
  .use(krsViewRoutes)
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 422;
      return { success: false, message: error.message };
    }
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { success: false, message: "Endpoint tidak ditemukan" };
    }
    set.status = set.status === 200 ? 500 : set.status;
    return { success: false, message: (error as Error).message ?? "Terjadi kesalahan server" };
  })
  .listen(process.env.PORT ?? 3000);

console.log(
  `🦊 dbakademik API jalan di http://${app.server?.hostname}:${app.server?.port}`
);
console.log(`📚 Swagger docs: http://${app.server?.hostname}:${app.server?.port}/docs`);

export type App = typeof app;
