import handler from "../../api/sitemap.js";
import { wrapVercelHandler } from "./_vercel-compat.mjs";

export default wrapVercelHandler(handler);
