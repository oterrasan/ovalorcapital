export default async function handler(req, res) {
  const TOKEN = "EAAubUN64VCABRKHaCJ1rH1wxZAB5yCY5LaA7NAk2lOGtCDBjuHeZBNfGY1tUPWcZCZBbQ8YA3x7OzbwBNIQkDILkmbXCSj61hNKHS74o9jZAWtx0OUvjJqK1gUMcKPeHsMU9zls1NaCCAjZBKM3FRCTQyavwtaK0qUaTaqTgPuzGzPhEWbFspK9VwDBaxrKdofiVL1YEqrqN2n24DdFGTr1ZAKvWMXxp4m4SKPn0cpH9k2wWTu8dyXfuOKqmSGXB52ftvnoBzsAHjlHlCZAXdMXSRB8iHvw0tuScDQZDZD";
  const PAGE_ID = "632203696642033";

  const r1 = await fetch(`https://graph.facebook.com/v25.0/${PAGE_ID}?fields=instagram_business_account,connected_instagram_account&access_token=${TOKEN}`);
  const d1 = await r1.json();

  const r2 = await fetch(`https://graph.facebook.com/v25.0/me?fields=id,name,instagram_business_account&access_token=${TOKEN}`);
  const d2 = await r2.json();

  return res.status(200).json({ page_fields: d1, me: d2 });
}
