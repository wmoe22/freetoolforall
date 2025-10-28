import { urlStorage } from "@/lib/url-storage";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ shortCode: string }> }
): Promise<NextResponse> {
  try {
    const { shortCode } = await context.params;

    if (!shortCode) {
      return NextResponse.json({ error: "Missing shortCode" }, { status: 400 });
    }

    const targetUrl = urlStorage.get(shortCode);

    if (!targetUrl) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 });
    }

    // Redirect to the stored URL
    return NextResponse.redirect(targetUrl);
  } catch (error) {
    console.error("Redirect error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
