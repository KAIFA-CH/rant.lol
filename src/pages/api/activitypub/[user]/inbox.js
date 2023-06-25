import { v4 as uuidv4 } from "uuid";
import { Sha256Signer } from "../../../../components/activitypub/signpub";
import { createHash } from "crypto";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { saveFollower, removeFollower } from "./followers";

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

  const supabase = createPagesBrowserClient();
  getuser = await supabase.from('accounts').select('id, username').ilike('username', `${req.query.user}`).maybeSingle();
  // Check if user exists
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

  // If type is follow add the user as a follower and accept the message to notify that it was done.
  if (message.type == "Follow" && message.actor != null) {
    console.log("follower accepted & saved");
    await saveFollower(message.actor, getuser);
    await sendAcceptMessage(message, origin);
  }

  // if type is like, announce or create do nothing
  if (message.type == "Like") {
    console.log("no");
  }
  if (message.type == "Announce") {
    console.log("announce to save");
  }
  if (message.type == "Create") {
    // Someone is sending us a message
    console.log("Incoming Message To Create");
  }

  // if type is undo check what the object type is to see what has to be done.
  if (message.type == "Undo") {
    console.log("Undo Action Triggered");

    // if type is follow proceed to remove follower.
    if (message.object.type === "Follow") {
      await removeFollower(message.actor, getuser);
    }
  }

  // Ignore Update for now as there is no reason to use it.
  if (message.type == "Update") {
    console.log("Update message", message);
  }
  res.end("ok");
}

async function sendAcceptMessage(body, originDomain) {
  const message = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `https://${originDomain}/${uuidv4()}`,
    type: "Accept",
    actor: `https://${originDomain}/api/activitypub/${getuser.data.username}/actor`,
    object: body,
  };
  await sendSignedRequest(
    `https://${originDomain}/api/activitypub/${getuser.data.username}/actor#main-key`,
    new URL(body.actor + "/inbox"),
    message
  );
}