import { createClient } from "@supabase/supabase-js";

// Supabaseクライアントの作成
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// ブラウザでのみ作成されるクライアント
export const createBrowserClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key must be defined");
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

// サーバーサイドでのみ作成されるクライアント
export const createServerClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key must be defined");
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
};
