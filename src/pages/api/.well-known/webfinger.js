import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

export default async function webfinger(req, res) {
  const supabase = createPagesBrowserClient();
  res.setHeader("Content-Type", "application/jrd+json");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=60");
  const resource = req.query.resource;

  if (!resource) {
    res.statusCode = 404;
    res.end(`{"error": "unknown resource"}`);
    return;
  }

  // Filter out username and get data
  const user = /\:(.*)\@/g.exec(resource)[1];
  const getuser = await supabase.from('accounts').select('id, username').ilike('username', `${user}`).maybeSingle();
  
  // Check if user exists
  if (!getuser.data) {
    res.statusCode = 404;
    res.end(`{"error": "unknown resource"}`);
    return;
  }

  // Return Webfinger data
  res.statusCode = 200;
  res.end(`{  
    "subject": "acct:${getuser.data.username}@rant.lol",
    "aliases": [],
    "links": [
      {
        "rel": "self",
        "type": "application/activity+json",
        "href": "https://rant.lol/api/activitypub/${getuser.data.username}/actor"
      }
    ]
  }`);
}