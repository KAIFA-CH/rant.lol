import { generateNote } from "./outbox";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
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
  const supabase = createPagesBrowserClient();
  const post = await supabase.from('feed').select('id ,content, created_at, user_id').eq('id', `${id}`).maybeSingle();
  const getuser = await supabase.from('accounts').select('id, username').eq('id', `${post.data.user_id}`).maybeSingle();
  if (!getuser.data) {
    res.statusCode = 404;
    res.end(`{"error": "unknown resource"}`);
    return;
  }
  const createMessage = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `https://${origin}/api/activitypub/post/${post.id}?create=true`,
    type: "Create",
    actor: `https://${origin}/api/activitypub/actor?user=acct:${getuser.data.username}@rant.lol`,
    to: ["https://www.w3.org/ns/activitystreams#Public"],
    object: generateNote(origin, post.data, getuser.data.username),
  };
  console.log("message", createMessage);
  const response = await sendSignedRequest(
    `https://${origin}/api/activitypub/actor?user=acct:${getuser.data.username}@rant.lol#main-key`,
    new URL("https://mstdn.social/inbox"),
    createMessage
  );
  const text = await response.text();
  console.log("Following result", response.status, response.statusText, text);
  res.json({ ...response, ...createMessage });
}