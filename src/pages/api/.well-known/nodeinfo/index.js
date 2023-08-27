export default async function nodeinfoindex(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=60");

  // Return nodeinfo
  res.statusCode = 200;
  res.end(`{  
    "links": {
        "rel": "http://nodeinfo.diaspora.software/ns/schema/2.0",
        "href": "https://rant.lol/.well-known/nodeinfo/2.0"
    }
  }`);
}