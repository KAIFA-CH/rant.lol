import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

const respondActivityJSON = (res, json) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/activity+json");
    res.end(JSON.stringify(json));
};

export default async function Post(req, res) {
    const origin = req.headers.host;
    // console.log("headers", req.headers); //debug only
    const { id } = req.query;
    const supabase = createPagesBrowserClient();
    const post = await supabase.from('feed').select('content, created_at, user_id').eq('id', `${id}`).maybeSingle();
    const getuser = await supabase.from('accounts').select('id, username').eq('id', `${post.data.user_id}`).maybeSingle();
    const note = generateNote(origin, post.data);
    respondActivityJSON(res, note, getuser.data.username);
}

const generateNote = (origin, post, user) => {
    return {
      "@context": ["https://www.w3.org/ns/activitystreams"],
      id: `https://${origin}/`,
      type: "Note",
      published: new Date(post.created_at).toUTCString(),
      attributedTo: `https://${origin}/api/activitypub/actor?user=acct:${user}@rant.lol`,
      // actor: `${origin}/api/activitypub/actor`,
      content: post.content,
      url: `https://${origin}/`,
      to: ["https://www.w3.org/ns/activitystreams#Public"],
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