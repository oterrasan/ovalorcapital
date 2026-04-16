export default async function handler(req, res) {
  return res.status(200).json({
    supabase_url: process.env.SUPABASE_URL ? "SET" : "MISSING",
    supabase_key: process.env.SUPABASE_KEY ? "SET" : "MISSING",
    openai_key: process.env.OPENAI_API_KEY ? "SET" : "MISSING",
    ig_user_id: process.env.IG_USER_ID ? "SET" : "MISSING",
    ig_token: process.env.IG_ACCESS_TOKEN ? "SET" : "MISSING",
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV
  });
}
