export default async function handler(req, res) {
  try {
    const SHORT_TOKEN = req.query.t;
    const APP_ID = "3266996380128288";
    const APP_SECRET = process.env.META_APP_SECRET || "";

    if (!SHORT_TOKEN) return res.status(400).json({ error: "token obrigatorio" });

    // 1. Pegar paginas e IG User ID
    const pagesRes = await fetch(`https://graph.facebook.com/v25.0/me/accounts?access_token=${SHORT_TOKEN}`);
    const pages = await pagesRes.json();

    // 2. Para cada pagina, buscar o instagram_business_account
    const results = [];
    for (const page of (pages.data || [])) {
      const igRes = await fetch(`https://graph.facebook.com/v25.0/${page.id}?fields=instagram_business_account&access_token=${SHORT_TOKEN}`);
      const igData = await igRes.json();
      results.push({
        page_id: page.id,
        page_name: page.name,
        ig_user_id: igData.instagram_business_account?.id || null,
        page_token: page.access_token
      });
    }

    // 3. Converter para long-lived token
    let longToken = null;
    if (APP_SECRET) {
      const ltRes = await fetch(`https://graph.facebook.com/v25.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${SHORT_TOKEN}`);
      const ltData = await ltRes.json();
      longToken = ltData.access_token;
    }

    return res.status(200).json({ pages: results, long_lived_token: longToken });
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
