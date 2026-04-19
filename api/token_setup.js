export default async function handler(req, res) {
  const TOKEN = "EAAubUN64VCABRO7KTPUdneFSNaQuxkC1v4OdIDAyqFnGJNO7sZCdubyz81TaBpyIqWUx8W0nerZA11YLG6W3fo6bLFD16Ed7NC0Wkz7TDYoJBSYO2QiZBarjXJfosqTflAJJzXtLvq0baiI9kXzdszRK2I1wITIZB6yuySaA6faZAQ60dJRT8EhxHdUTIH2eXInPDCd8GK76L";
  const OVC_PAGE_ID = "1099986309860815";

  // Buscar com token de usuario na pagina OVC
  const r1 = await fetch(`https://graph.facebook.com/v25.0/${OVC_PAGE_ID}?fields=instagram_business_account,connected_instagram_account,name&access_token=${TOKEN}`);
  const d1 = await r1.json();

  // Buscar todas as paginas do usuario
  const r2 = await fetch(`https://graph.facebook.com/v25.0/me/accounts?fields=id,name,instagram_business_account,connected_instagram_account,access_token&limit=20&access_token=${TOKEN}`);
  const d2 = await r2.json();

  return res.status(200).json({ ovc_direct: d1, all_pages: d2 });
}
