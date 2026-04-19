export default async function handler(req, res) {
  try {
    const ACCESS_TOKEN = "EAAubUN64VCABRIRVJW1H1PtO3Cdqj15jJussZBAiKbT1MJvdyW1cAO8JxgLBGwViQ7iYCIgRdnPtj5ZBCSH6qW5n1ZBfLJ4wjL737fg5w1g9lZAdyP9S7jRARKeyUo5J0wcopPlNf4BDEZAANdCytcZBZAmwMU3N2cBDBULmyE4Y4dFjgE6tHYZC00lPigZADIIiJP39KS3OyARoWkTqwS1lU2nX9UoR2MZCyQ8PpAIGEXLg6CxMbFvOFs0x0CzW0Hk5Ka65h2A9PTAGzrsCWSZAg0SiLagaZAqbxNdMFgZDZD";
    const IG_USER_ID = "17841401979593316";

    // Testar token atual
    const testRes = await fetch(`https://graph.facebook.com/v25.0/me?access_token=${ACCESS_TOKEN}`);
    const testData = await testRes.json();

    // Tentar renovar o token
    const refreshRes = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${ACCESS_TOKEN}`);
    const refreshData = await refreshRes.json();

    return res.status(200).json({
      token_test: testData,
      token_refresh: refreshData,
      ig_user_id: IG_USER_ID
    });
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
