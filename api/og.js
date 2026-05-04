import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  const slug = req.query.slug || "";
  const { data: posts } = await supabase
    .from("posts")
    .select("titulo, resumo, imagem")
    .or(`url.ilike.%${slug}%,titulo.ilike.%${slug.replace(/-/g," ")}%`)
    .eq("status", "publicado")
    .limit(1);

  const post = posts && posts[0];
  const titulo = post ? post.titulo : "O Valor Capital";
  const descricao = post ? (post.resumo || post.titulo).slice(0,160) : "Portal de noticias sobre politica, economia, negocios e financas.";
  const imagem = post ? (post.imagem || "https://www.ovalorcapital.com.br/assets/og-default.jpg") : "https://www.ovalorcapital.com.br/assets/og-default.jpg";
  const url = "https://www.ovalorcapital.com.br/materia/" + slug;
  const t = titulo.replace(/</g,"&lt;").replace(/"/g,"&quot;");
  const d2 = descricao.replace(/</g,"&lt;").replace(/"/g,"&quot;");

  const html = "<!DOCTYPE html><html lang=\"pt-BR\"><head>"
    + "<meta charset=\"utf-8\">"
    + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
    + "<title>" + t + " | O Valor Capital</title>"
    + "<meta name=\"description\" content=\"" + d2 + "\">"
    + "<meta property=\"og:type\" content=\"article\">"
    + "<meta property=\"og:site_name\" content=\"O Valor Capital\">"
    + "<meta property=\"og:url\" content=\"" + url + "\">"
    + "<meta property=\"og:title\" content=\"" + t + "\">"
    + "<meta property=\"og:description\" content=\"" + d2 + "\">"
    + "<meta property=\"og:image\" content=\"" + imagem + "\">"
    + "<meta property=\"og:image:width\" content=\"1200\">"
    + "<meta property=\"og:image:height\" content=\"630\">"
    + "<meta property=\"og:locale\" content=\"pt_BR\">"
    + "<meta name=\"twitter:card\" content=\"summary_large_image\">"
    + "<meta name=\"twitter:site\" content=\"@ovalorcapital\">"
    + "<meta name=\"twitter:title\" content=\"" + t + "\">"
    + "<meta name=\"twitter:description\" content=\"" + d2 + "\">"
    + "<meta name=\"twitter:image\" content=\"" + imagem + "\">"
    + "<link rel=\"canonical\" href=\"" + url + "\">"
    + "<meta http-equiv=\"refresh\" content=\"0;url=" + url + "\">"
    + "</head><body><h1>" + t + "</h1><p>" + d2 + "</p>"
    + "<p><a href=\"" + url + "\">Leia a materia completa</a></p></body></html>";

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  return res.status(200).send(html);
}
