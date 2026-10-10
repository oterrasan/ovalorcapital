import handler from "../../api/institutional.js";
import { wrapVercelHandler } from "./_vercel-compat.mjs";

export default wrapVercelHandler(handler);
