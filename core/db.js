import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export const db = {
  async countToday() {
    const today = new Date().toISOString().split("T")[0];

    const { count } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today);

    return count || 0;
  },

  async exists(hash) {
    const { data } = await supabase
      .from("posts")
      .select("id")
      .eq("hash", hash)
      .limit(1);

    return data && data.length > 0;
  },

  async insert(data) {
    return supabase.from("posts").insert([data]);
  }
};
