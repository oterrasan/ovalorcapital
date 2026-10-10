import handler from "../../api/landing.js";
import { wrapVercelHandler } from "./_vercel-compat.mjs";

export default wrapVercelHandler(handler);
