// Vercel serverless entry point.
// Vercel routes all requests here via rewrites in vercel.json.
// Uses Elysia's built-in Web fetch handler (Request → Response),
// supported by Vercel's Node.js 18+ runtime.
import { app } from "../src/app";

export const config = { maxDuration: 30 };

export default (req: Request): Promise<Response> => app.handle(req);
