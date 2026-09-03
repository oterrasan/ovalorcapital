// Script temporário de diagnóstico visual — renderiza o card real do
// Instagram do Brasil ON usando a foto+título reais de um post publicado
// ("Remo e Flamengo revivem no Mangueirão..."), pra inspeção visual antes
// de qualquer wiring com o publish de verdade. Removido depois da checagem.
import { buildInstagramImageBuffer } from "./core/instagram_image.js";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";

const buf = await buildInstagramImageBuffer(
  "https://yntwvfcxjardzafdqanj.supabase.co/storage/v1/object/public/post-images/imagens/e7911a99435b.webp",
  { title: "Remo e Flamengo revivem no Mangueirão duelo de 2013 pela Copa do Brasil" }
);
writeFileSync(fileURLToPath(new URL("./public/assets/_test_ig_preview.jpg", import.meta.url)), buf);
console.log("bytes:", buf.length);
