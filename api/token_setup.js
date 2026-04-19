export default async function handler(req, res) {
  try {
    const SHORT = "EAAubUN64VCABRAmULh63w7tuhT5M3X45oN0mDvJYElZBr8uZArVT6zQ0YmAZAMScQSvJh0KZAMBMolk3JgaRJJ6F2xEzmFpZB79ATmKfZAj2aP9I1mzzW8GGaZA8xRHHkxP9qQZCBw1AJjNodmZCtmgqpF3KEv8E0bDV4s2Ci8okIZA8XqAajohlQySN6mXNDDOvjTeKMGRfTuFkbp0armlhCp20XbW6iacU5hUawMh2DZAnLcYbSgalURnC4o7Oqmr8kzD6fIgh0Wffg2nJLQKbHhRXUI1Sgktu9tZC7AZDZD";
    const APP_ID = "3266996380128288";
    const APP_SECRET = "6c594a465e2ad4ca75bab999fbfed524";

    // 1. Converter para long-lived (60 dias)
    const ltRes = await fetch(`https://graph.facebook.com/v25.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${SHORT}`);
    const ltData = await ltRes.json();
    if (!ltData.access_token) return res.status(400).json({ step: "long_lived", error: ltData });
    const LONG = ltData.access_token;

    // 2. Buscar paginas
    const pagesRes = await fetch(`https://graph.facebook.com/v25.0/me/accounts?access_token=${LONG}`);
    const pages = await pagesRes.json();

    // 3. Para cada pagina buscar IG User ID
    const igAccounts = [];
    for (const page of (pages.data || [])) {
      const igRes = await fetch(`https://graph.facebook.com/v25.0/${page.id}?fields=instagram_business_account&access_token=${LONG}`);
      const igData = await igRes.json();
      if (igData.instagram_business_account?.id) {
        igAccounts.push({
          page_name: page.name,
          page_id: page.id,
          ig_user_id: igData.instagram_business_account.id,
          page_token: page.access_token
        });
      }
    }

    return res.status(200).json({ long_token: LONG, ig_accounts: igAccounts });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
