import { getStore } from "@netlify/blobs";
import { handle } from "../lib/sounds.mjs";

export default req => handle(req, getStore({ name: "sounds", consistency: "strong" }));

export const config = { path: ["/api/auth", "/api/sounds", "/api/sounds/*"] };
