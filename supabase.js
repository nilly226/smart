import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://arewhuytjsgjpoqzmadq.supabase.co";
const supabaseKey = "sb_publishable_SKbQpnPoLSXF4uCmyr7EjA_DUfqjxAn";

export const supabase = createClient(
    supabaseUrl,
    supabaseKey,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);