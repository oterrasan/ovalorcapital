export default async function handler(req, res) {
  const TOKEN = "EAAubUN64VCABRKHaCJ1rH1wxZAB5yCY5LaA7NAk2lOGtCDBjuHeZBNfGY1tUPWcZCZBbQ8YA3x7OzbwBNIQkDILkmbXCSj61hNKHS74o9jZAWtx0OUvjJqK1gUMcKPeHsMU9zls1NaCCAjZBKM3FRCTQyavwtaK0qUaTaqTgPuzGzPhEWbFspK9VwDBaxrKdofiVL1YEqrqN2n24DdFGTr1ZAKvWMXxp4m4SKPn0cpH9k2wWTu8dyXfuOKqmSGXB52ftvnoBzsAHjlHlCZAXdMXSRB8iHvw0tuScDQZDZD";
  const OVC_PAGE_ID = "1099986309860815";

  // Buscar IG direto da pagina O Valor Capital usando token de usuario
  const r = await fetch(`https://graph.facebook.com/v25.0/${OVC_PAGE_ID}?fields=instagram_business_account,connected_instagram_account,name&access_token=${TOKEN}`);
  const d = await r.json();

  // Se nao veio, tentar buscar via me/accounts para pegar page access token da OVC
  const r2 = await fetch(`https://graph.facebook.com/v25.0/me/accounts?fields=id,name,instagram_business_account,connected_instagram_account,access_token&access_token=${TOKEN}`);
  const d2 = await r2.json();

  return res.status(200).json({ ovc_page: d, all_pages: d2.data });
}
