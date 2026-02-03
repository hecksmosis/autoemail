import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import * as cheerio from "cheerio";

export const maxDuration = 60; // Allow Vercel Function to run for 60s

// Helper to parse "1.2k" or "1,234"
const parseCount = (str: string) => {
  if (!str) return 0;
  const clean = str.toLowerCase().replace(/,/g, "").replace(/\./g, "");

  if (clean.includes("k")) {
    return parseFloat(clean.replace("k", "")) * 1000;
  }

  const match = clean.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
};

async function scrapeMapsLink(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US",
      },
    });

    if (!response.ok) throw new Error(`Status ${response.status}`);

    const html = await response.text();
    const $ = cheerio.load(html);

    // --- STRATEGY 1: Extract from Window Initialization State (Most Reliable) ---
    // Google Maps embeds data in a JS variable: window.APP_INITIALIZATION_STATE=[[[...
    // We look for the pattern and extract the array string.

    // This regex looks for the specific start of the state variable
    const scriptContent = $(
      'script:contains("window.APP_INITIALIZATION_STATE")',
    ).html();

    if (scriptContent) {
      // The data is usually in the form: window.APP_INITIALIZATION_STATE=[[[...]]];
      // We try to grab the array part.
      const match = scriptContent.match(
        /window\.APP_INITIALIZATION_STATE\s*=\s*(\[.+?\]);/,
      );

      if (match && match[1]) {
        try {
          const data = JSON.parse(match[1]);

          // The structure is deeply nested and changes, but usually:
          // data[3][6] contains review count text like "1,234 reviews"
          // data[3][4] contains rating like "4.9"
          // We recursively search the JSON for the review count pattern to be safe against index changes
          const jsonString = JSON.stringify(data);

          // Find review count in JSON (e.g., "1,204 reviews")
          const reviewCountMatch = jsonString.match(/"(\d+[\d,.]*)\s+reviews"/);
          // Find rating in JSON (e.g., 4.8) - usually appears right before or after reviews
          const ratingMatch = jsonString.match(/,([0-5]\.\d),/); // looks for ,4.8, pattern

          if (reviewCountMatch) {
            const count = parseCount(reviewCountMatch[1]);
            const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;

            if (count > 0) {
              return { rating, count };
            }
          }
        } catch (e) {
          console.warn("Failed to parse APP_INITIALIZATION_STATE JSON");
        }
      }
    }

    // --- STRATEGY 2: Scrape Visible Text (Fallback) ---
    // If the JS extraction failed, we look for visible elements on the page.
    // Note: Cheerio only sees the initial HTML, not client-rendered DOM,
    // but Google usually SSRs the main stats for SEO.

    const bodyText = $("body").text();

    // Look for standard "4.9 stars" or "4.9" near "reviews"
    // Pattern: "4.8" ... "1,234 reviews"
    const generalPattern =
      /([0-5]\.\d)\s*(?:stars|★)?.*?(\d+[\d,.]*k?)\s*reviews/i;
    const textMatch = bodyText.match(generalPattern);

    if (textMatch) {
      return {
        rating: parseFloat(textMatch[1]),
        count: parseCount(textMatch[2]),
      };
    }

    // --- STRATEGY 3: Accessibility Labels (Aria Labels) ---
    // Often found in: <span aria-label="4.8 stars 1,234 Reviews">
    const ariaLabel = $('[aria-label*="stars"][aria-label*="reviews"]').attr(
      "aria-label",
    );
    if (ariaLabel) {
      const rating = ariaLabel.match(/([0-5]\.\d)/);
      const count = ariaLabel.match(/(\d+[\d,.]*k?)\s*reviews/i);

      if (rating && count) {
        return {
          rating: parseFloat(rating[1]),
          count: parseCount(count[1]),
        };
      }
    }

    return {
      rating: 0,
      count: 0,
      error: "Could not extract reviews from page source",
    };
  } catch (error: any) {
    return { rating: 0, count: 0, error: error.message };
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const results = {
    processed: 0,
    successes: 0,
    errors: 0,
    details: [] as any[],
  };

  try {
    const { data: tenants, error } = await supabase
      .from("tenants")
      .select("id, business_name, google_maps_link")
      .not("google_maps_link", "is", null)
      .neq("google_maps_link", "");

    if (error) throw error;

    console.log(
      `📸 Snapshot Cron (Direct Page): Processing ${tenants?.length || 0} tenants`,
    );

    for (const tenant of tenants || []) {
      results.processed++;

      // Delay to be polite
      await new Promise((r) => setTimeout(r, 2000));

      const {
        rating,
        count,
        error: scrapeError,
      } = await scrapeMapsLink(tenant.google_maps_link);

      if (scrapeError || (rating === 0 && count === 0)) {
        console.warn(
          `Scrape failed for ${tenant.business_name}: ${scrapeError}`,
        );
        results.errors++;
        results.details.push({ tenant: tenant.id, error: scrapeError });
        continue;
      }

      // Save to DB
      const { error: dbError } = await supabase.from("review_snapshots").upsert(
        {
          tenant_id: tenant.id,
          review_count: count,
          average_rating: rating,
          snapshot_date: new Date().toISOString().split("T")[0],
        },
        { onConflict: "tenant_id, snapshot_date" },
      );

      if (dbError) {
        results.errors++;
        results.details.push({ tenant: tenant.id, error: dbError.message });
      } else {
        results.successes++;
      }
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    console.error("Cron Fatal Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
