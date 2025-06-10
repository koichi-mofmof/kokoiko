import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "redirect_url" is in param, use it as the redirect URL
  const redirectUrl = searchParams.get("redirect_url") || "/lists";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirectUrl}`);
    }
  }

  // return the user to an error page with instructions
  console.error("Error in OAuth callback or no code found");
  const errorRedirect = new URL("/login", request.url);
  errorRedirect.searchParams.set("google_error", "true");
  return NextResponse.redirect(errorRedirect);
}
