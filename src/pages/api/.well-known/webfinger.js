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

  const user = /\:(.*)\@/g.exec(resource)[1];
  const getuser = await supabase.from('accounts').select('id, username').ilike('username', `${user}`).maybeSingle();
  
  if (!getuser.data) {
    res.statusCode = 404;
    res.end(`{"error": "unknown resource"}`);
    return;
  }

  res.statusCode = 200;
  res.end(`{  
    "subject": "acct:${getuser.data.username}@rant.lol",
    "aliases": [],
    "links": [
      {
        "rel": "http://webfinger.net/rel/profile-page",
        "type": "text/html",
        "href": "https://rant.lol/about"
      },
      {
        "rel": "self",
        "type": "application/activity+json",
        "href": "https://rant.lol/api/activitypub/actor?user=acct:${getuser.data.username}@rant.lol"
      }
    ]
  }`);
}