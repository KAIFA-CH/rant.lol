import { generateNote } from "./[user]/outbox";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { Sha256Signer } from "../../../components/activitypub/signpub";
import { createHash } from "crypto";

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

export default async function publish(req, res) {
  const origin = req.headers.host;
  const id = req.query.id;
  if (!id) {
    res.json({ error: "missing id" });
  }

  const supabase = createPagesServerClient({req, res});
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return res.status(401).json({
      error: 'not_authenticated',
      description: 'The user does not have an active session or is not authenticated',
    })
  }

  // Get post info via id and then proceed to also grab poster info
  const post = await supabase.from('feed').select('id, content, created_at, user_id').eq('id', `${id}`).maybeSingle();
  const getuser = await supabase.from('accounts').select('id, username, followers').eq('id', `${post.data.user_id}`).maybeSingle();

  // Check if user exists since anonymous is a possible poster so it should return an error.
  if (!getuser.data) {
    res.statusCode = 404;
    res.end(`{"error": "unknown resource"}`);
    return;
  }

  if (post.data.user_id !== session.user.id) {
    return res.status(401).json({
      error: 'not_authorized',
      description: 'The user_id of the logged-in user does not correspond to the post\'s user_id in the request',
    })
  }

  // Construct Create Message with the note as object
  const createMessage = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `https://${origin}/api/activitypub/post/${post.data.id}?create=true`,
    type: "Create",
    actor: `https://${origin}/api/activitypub/${getuser.data.username}/actor`,
    to: ["https://www.w3.org/ns/activitystreams#Public"],
    cc: [`https://${origin}/api/activitypub/${getuser.data.username}/followers`],
    object: generateNote(origin, post.data, getuser.data.username),
  };

  // Post to each follower that a new message was created and sent it out.
  if (getuser.data.followers && getuser.data.followers.length > 0) {
    getuser.data.followers.forEach(async (follower) => {
      const response = await sendSignedRequest(
        `https://${origin}/api/activitypub/${getuser.data.username}/actor#main-key`,
        new URL(`${follower}/inbox`),
        createMessage
      );
      const text = await response.text();
      console.log("Following result", response.status, response.statusText, text);
    })
  } else {
    const response = await sendSignedRequest(
      `https://${origin}/api/activitypub/${getuser.data.username}/actor#main-key`,
      new URL(`https://mastodon.social/inbox`),
      new URL('https://mastodon-relay.thedoodleproject.net/inbox'),
      createMessage
    );
    const text = await response.text();
    console.log("Following result", response.status, response.statusText, text);
  }
  res.json({"status": "ok"});
}