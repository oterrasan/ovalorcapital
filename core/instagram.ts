import axios from "axios";

export async function publish(image, caption) {
  const create = await axios.post(
    `https://graph.facebook.com/v19.0/${process.env.IG_USER_ID}/media`,
    {
      image_url: image,
      caption,
      access_token: process.env.IG_ACCESS_TOKEN
    }
  );

  const publish = await axios.post(
    `https://graph.facebook.com/v19.0/${process.env.IG_USER_ID}/media_publish`,
    {
      creation_id: create.data.id,
      access_token: process.env.IG_ACCESS_TOKEN
    }
  );

  return publish.data;
}
