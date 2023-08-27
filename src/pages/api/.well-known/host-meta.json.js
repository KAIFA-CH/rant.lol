export default async function hostmetajson(req, res) {
    res.setHeader("Content-Type", "application/jrd+json");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=60");
  
    // Return nodeinfo
    res.statusCode = 200;
    res.end(`{
        "links": [
          {
            "rel": "lrdd",
            "type": "application/jrd+json",
            "template": "https://rant.lol/.well-known/webfinger?resource={uri}"
          }
        ]
      }`);
  }