import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  try {
    // Garantir que AUTOMATION está ON
    const { error: err1 } = await supabase
      .from("config")
      .delete()
      .eq("key", "AUTOMATION");

    const { error: err2 } = await supabase
      .from("config")
      .insert([{ key: "AUTOMATION", value: "on" }]);

    if (err2) {
      return res.status(500).json({ error: err2.message });
    }

    return res.status(200).json({ 
      status: "ok", 
      message: "Automação ativada" 
    });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
