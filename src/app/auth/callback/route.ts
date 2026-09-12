import { NextRequest, NextResponse } from "next/server";

/**
 * Firebase Auth Callback Handler
 *
 * Firebase handles email verification internally via its own action URL.
 * When the user clicks the verification link, Firebase verifies the email
 * on their servers and redirects to the `continueUrl` specified in
 * sendEmailVerification() — which is set to /dashboard directly.
 *
 * This route now serves as a safe fallback for any old Supabase-style
 * auth links that may still be in circulation, redirecting them gracefully.
 */
export async function GET(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url);

  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    const msg = errorDescription || error;
    return NextResponse.redirect(
      `${origin}/login?auth_error=${encodeURIComponent(msg)}`
    );
  }

  // Default: redirect to Landing Page (/)
  return NextResponse.redirect(`${origin}/`);
}
