import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { Sha256Signer } from "../../../../components/activitypub/signpub";
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

export default async function update(req, res) {
  const origin = req.headers.host;
  const user = req.query.user;

  if (!user) {
    res.json({ error: "missing username" });
  }

  const supabase = createPagesBrowserClient();
  const getuser = await supabase.from('accounts').select('id, username, followers').ilike('username', `${user}`).maybeSingle();

  // Check if user exists
  if (!getuser.data) {
    res.statusCode = 404;
    res.end(`{"error": "unknown resource"}`);
    return;
  }
  
  // Get actor object
  const response = await fetch(`https://${origin}/api/activitypub/${getuser.data.username}/actor`);
  const resdata = await response.json();

  // Create update message
  const createMessage = {
    "@context": "https://www.w3.org/ns/activitystreams",
    type: "Update",
    object: resdata,
  };

  // Post update message to all followers
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
      new URL('https://social.lol/inbox'),
      createMessage
    );
    const text = await response.text();
    console.log("Following result", response.status, response.statusText, text);
  }
  res.json({"status": "ok"});
}