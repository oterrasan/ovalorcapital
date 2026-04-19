export default async function handler(req, res) {
  try {
    const SHORT = "EAAubUN64VCABRFtsz3MVZC5jmDB0hzulNBgiUoTGtSPFjFIiXatsv5DmSsrdJEGy32YhjA4jjF3I1L0uBHMbzAyCyMjaQl1vas8TgOr6q2ODdJIjZAYbZBu95fcZCnZCLjZCe9z1V7GYCsGfBqxD8eYuBgShWZCiczZAKo53xZAm7vP7jmhIx4ELnYI0ninh8NSvE9joU2oR8F8iEcOkSxD2cdWtp2MXCREWkX9PhMEiEZBsmU5T2ZBcMtQYjSsbO5yAi5roRm6pc8EbY3PtYXKScHr7NTTZAtDsnb2ifWcZD";
    const APP_ID = "3266996380128288";
    const APP_SECRET = "6c594a465e2ad4ca75bab999fbfed524";

    // 1. Converter para long-lived
    const ltRes = await fetch(`https://graph.facebook.com/v25.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${SHORT}`);
    const ltData = await ltRes.json();
    if (!ltData.access_token) return res.status(400).json({ step: "long_lived_failed", error: ltData });
    const LONG = ltData.access_token;

    // 2. Buscar paginas com long token
    const pagesRes = await fetch(`https://graph.facebook.com/v25.0/me/accounts?fields=id,name,instagram_business_account,access_token&access_token=${LONG}`);
    const pages = await pagesRes.json();

    // 3. Para cada pagina buscar IG User ID
    const results = [];
    for (const page of (pages.data || [])) {
      const igRes = await fetch(`https://graph.facebook.com/v25.0/${page.id}?fields=instagram_business_account,connected_instagram_account&access_token=${page.access_token}`);
      const igData = await igRes.json();
      results.push({
        page: page.name,
        page_id: page.id,
        ig_user_id: igData.instagram_business_account?.id || igData.connected_instagram_account?.id || null
      });
    }

    return res.status(200).json({ long_token: LONG, pages: results });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
