import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

async function sendSignedRequest(publicKeyId, endpoint, object) {
  const privateKey = process.env.ACTIVITYPUB_PRIVATE_KEY;
  const signer = new Sha256Signer({
    publicKeyId,
    privateKey,
    headerNames: ["host", "date", "digest"],
  });

  const requestHeaders = {
    host: endpoint.hostname,
    date: new Date().toUTCString(),
    digest: `SHA-256=${createHash("sha256")
      .update(JSON.stringify(object))
      .digest("base64")}`,
  };

  const signature = signer.sign({
    url: endpoint,
    method: "POST",
    headers: requestHeaders,
  });

  const response = await fetch(endpoint, {
    method: "POST",
    body: JSON.stringify(object),
    headers: {
      "content-type": "application/activity+json",
      accept: "application/activity+json",
      ...requestHeaders,
      signature: signature,
    },
  });
  return response;
}

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
  const user = /\:(.*)\@/g.exec(req.query.user)[1];
  const supabase = createPagesBrowserClient();
  const getuser = await supabase.from('accounts').select('id, username').ilike('username', `${user}`).maybeSingle();
  if (!getuser.data) {
    res.statusCode = 404;
    res.end(`{"error": "unknown resource"}`);
    return;
  }
  let posts = await supabase.from('feed').select('content, created_at').eq('user_id', `${getuser.data.id}`);
  posts = posts.data.sort((a,b)=>{
    return new Date(b.created_at) - new Date(a.created_at);
  });
  const outbox = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `https://${origin}/api/activitypub/outbox?user=acct:${getuser.data.username}@rant.lol`,
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