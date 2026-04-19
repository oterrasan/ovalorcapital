export default async function handler(req, res) {
  try {
    const TOKEN = "EAAubUN64VCABRDQuOtJItqlr6VtY2LYL81UliEeh6Rksk5U92FgKf83wRRgQLAmOQNqNbpS2v906dC1wdZAZAm86CWDDo4NjgsZCCWULe7v6VKj7WZBidZBkeNBVSsJqsClGJElUI4AxNYUVkijnF25ExqFaZAz37XNBhq3RAAfdiEcYuqH8bfnC6SD6Slg2Kxh4MWuqOErZBgcOZBlG";

    // Buscar via /me com fields expandidos
    const meRes = await fetch(`https://graph.facebook.com/v25.0/me?fields=id,name,instagram_business_account&access_token=${TOKEN}`);
    const me = await meRes.json();

    // Buscar paginas com token de usuario
    const pagesRes = await fetch(`https://graph.facebook.com/v25.0/me/accounts?fields=id,name,instagram_business_account,access_token&access_token=${TOKEN}`);
    const pages = await pagesRes.json();

    // Para cada pagina, tentar com page token tambem
    const results = [];
    for (const page of (pages.data || [])) {
      const pt = page.access_token;
      const igRes = await fetch(`https://graph.facebook.com/v25.0/${page.id}?fields=instagram_business_account,connected_instagram_account&access_token=${pt}`);
      const igData = await igRes.json();
      results.push({
        page: page.name,
        page_id: page.id,
        ig_business: igData.instagram_business_account,
        ig_connected: igData.connected_instagram_account
      });
    }

    return res.status(200).json({ me, pages: pages.data?.map(p=>p.name), details: results });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
