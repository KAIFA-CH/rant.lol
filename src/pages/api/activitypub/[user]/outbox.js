import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

const respondActivityJSON = (res, json) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/activity+json");
    res.end(JSON.stringify(json));
};

export default async function outbox(req, res) {
  const origin = req.headers.host;
  if (!req.query.user) {
    res.statusCode = 404;
    res.end(`{"error": "unknown resource"}`);
    return;
  }
  const supabase = createPagesBrowserClient();
  const getuser = await supabase.from('accounts').select('id, username').ilike('username', `${req.query.user}`).maybeSingle();

  //check if user exists
  if (!getuser.data) {
    res.statusCode = 404;
    res.end(`{"error": "unknown resource"}`);
    return;
  }

  //Get all feed posts from user and sort them by latest to oldest
  let posts = await supabase.from('feed').select('id, content, created_at').eq('user_id', `${getuser.data.id}`);
  posts = posts.data.sort((a,b)=>{
    return new Date(b.created_at) - new Date(a.created_at);
  });

  // Construct outbox message and respond with it
  const outbox = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `https://${origin}/api/activitypub/${getuser.data.username}/outbox`,
    summary: "Vent/Rant about your life or other stuff.",
    type: "OrderedCollection",
    totalItems: posts.length,
    orderedItems: posts.map(post => generateNote(origin, post, getuser.data.username)),
  };
  respondActivityJSON(res, outbox);
}

export const generateNote = (origin, post, user) => {
  return {
    "@context": ["https://www.w3.org/ns/activitystreams"],
    id: `https://${origin}/#${post.id}`,
    type: "Note",
    published: new Date(post.created_at).toUTCString(),
    attributedTo: `https://${origin}/api/activitypub/${user}/actor`,
    // actor: `${origin}/api/activitypub/actor`,
    content: post.content,
    url: `https://${origin}/#${post.id}`,
    to: ["https://www.w3.org/ns/activitystreams#Public"],
    cc: [`https://${origin}/api/activitypub/${user}/followers`],
    published: post.created_at

    // "replies": {
    //   "id": `${origin}/api/activitypub/reply/${post.id}`,
    //   "type": "Collection",
    //   "first": {
    //     "type": "CollectionPage",
    //     "next": "todo" + "?page=1",
    //     "partOf": "todo",
    //     "items": [],
    //   },
    // },
  };
};