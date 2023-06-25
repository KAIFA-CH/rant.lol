import { v4 as uuidv4 } from "uuid";
import { Sha256Signer } from "../../../components/activitypub/signpub";
import { createHash } from "crypto";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { saveFollower } from "./followers";

let getuser;

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

export default async function inbox(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 404;
    res.end("method not allowed");
    return;
  }
  const origin = req.headers.host;
  if (!req.query.user) {
    res.statusCode = 404;
    res.end(`{"error": "unknown resource"}`);
    return;
  }
  const user = /\:(.*)\@/g.exec(req.query.user)[1];
  const supabase = createPagesBrowserClient();
  getuser = await supabase.from('accounts').select('id, username').ilike('username', `${user}`).maybeSingle();
  if (!getuser.data) {
    res.statusCode = 404;
    res.end(`{"error": "unknown resource"}`);
    return;
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/activity+json");
  // todo: verify signature
  const requestBody = req.body;
  const message = JSON.parse(requestBody);
  // console.log("inbox msg", message);
  if (message.actor != null) {
    // console.log("actor info to save: ", message.actor);
    // todo: await saveActor(actorInformation);
    // Add the actor information to the message so that it's saved directly.
  }
  if (message.type == "Follow" && message.actor != null) {
    console.log("follower to accept & save");
    // Accept & save to my own db
    await sendAcceptMessage(message, origin);
    await saveFollower(message.actor);
  }
  if (message.type == "Like") {
    await saveLike(message);
  }
  if (message.type == "Announce") {
    console.log("announce to save");
  }
  if (message.type == "Create") {
    // Someone is sending us a message
    console.log("Incoming Message To Create");
  }
  if (message.type == "Undo") {
    // undo also has different types
    console.log("Undo Action Triggered");
    if (message.object.type === "Follow") {
        await sendAcceptMessage(message, origin);
    }
  }
  if (message.type == "Update") {
    // TODO: We need to update the messages
    console.log("Update message", message);
  }
  res.end("ok");
}

async function sendAcceptMessage(body, originDomain) {
  const message = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `${originDomain}}/api/activity/accept/${uuidv4()}`,
    type: "Accept",
    actor: `${originDomain}/api/activitypub/actor?user=acct:${getuser.data.username}@rant.lol`,
    object: body,
  };
  await sendSignedRequest(
    `${originDomain}/api/activitypub/actor?user=acct:${getuser.data.username}@rant.lol#main-key`,
    new URL(body.actor + "/inbox"),
    message
  );
}