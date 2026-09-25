export const onRequestGet: PagesFunction = async (context) => {
  try {
    const response = await fetch("https://api.raashitech.com/api/v1/seo/sitemap.xml", {
      headers: {
        "Accept": "application/xml"
      }
    });

    if (!response.ok) {
      return new Response("Failed to fetch sitemap", { status: 502 });
    }

    const xml = await response.text();

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch (err) {
    return new Response("Error fetching sitemap", { status: 500 });
  }
};
