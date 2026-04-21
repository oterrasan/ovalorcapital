import { readFileSync } from "fs";
import { join } from "path";

export default function handler(req, res) {
  try {
    const html = readFileSync(join(process.cwd(), "public/materia/index.html"), "utf-8");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.status(200).send(html);
  } catch(e) {
    res.status(500).send("Erro ao carregar página.");
  }
}
