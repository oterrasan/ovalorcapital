import handler from "../../api/live.js";
import { wrapVercelHandler } from "./_vercel-compat.mjs";

export default wrapVercelHandler(handler);
