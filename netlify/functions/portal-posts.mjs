import handler from "../../api/portal-posts.js";
import { wrapVercelHandler } from "./_vercel-compat.mjs";

export default wrapVercelHandler(handler);
