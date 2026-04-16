import axios from "axios";

const IG_USER_ID = process.env.IG_USER_ID;
const TOKEN = process.env.IG_ACCESS_TOKEN;
const BASE = "https://graph.facebook.com/v25.0";

export async function publish(imageUrl, caption) {
  const create = await axios.post(`${BASE}/${IG_USER_ID}/media`, {
    image_url: imageUrl,
    caption,
    access_token: TOKEN
  });

  const pub = await axios.post(`${BASE}/${IG_USER_ID}/media_publish`, {
    creation_id: create.data.id,
    access_token: TOKEN
  });

  return pub.data;
}

export async function postComment(mediaId, text) {
  const res = await axios.post(`${BASE}/${mediaId}/comments`, {
    message: text,
    access_token: TOKEN
  });
  return res.data;
}

export async function sendCollabInvite(mediaId, usernames) {
  // A Graph API não suporta convites de colaboração direto via API ainda.
  // Registramos os usernames para referência futura.
  console.log(`Colabs a convidar para ${mediaId}:`, usernames.join(", "));
  return { pending: usernames };
}
