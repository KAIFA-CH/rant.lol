import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

export const getFediAcctFromActor = (username, actor) => {
  const actorURL = new URL(actor);
  const domain = actorURL.hostname;
  return `@${username}@${domain}`;
};

const respondActivityJSON = (res, json) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/activity+json");
    res.end(JSON.stringify(json));
};

export async function fetchActorInformation(actorUrl) {
  console.log("Fetching actor from: ", actorUrl);
  try {
    const response = await fetch(actorUrl, {
      headers: {
        "Content-Type": "application/activity+json",
        Accept: "application/activity+json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Unable to fetch action information", actorUrl);
  }
  return null;
}

export const fetchAvatar = async actor => {
  const actorInfo = await fetchActorInformation(actor);
  if (actorInfo?.icon?.url) {
    return actorInfo.icon.url;
  } else {
    return "https://mastodon.social/avatars/original/missing.png";
  }
};

export default async function actor(req, res) {
  const supabase = createPagesBrowserClient();
  if (!req.query.user) {
    res.statusCode = 404;
    res.end(`{"error": "unknown resource"}`);
    return;
  }
  const user = /\:(.*)\@/g.exec(req.query.user)[1];
  const getuser = await supabase.from('accounts').select('id, username').ilike('username', `${user}`).maybeSingle();
  
  if (!getuser.data) {
    res.statusCode = 404;
    res.end(`{"error": "unknown resource"}`);
    return;
  }

  respondActivityJSON(res, {
    "@context": [
      "https://www.w3.org/ns/activitystreams",
      "https://w3id.org/security/v1",
    ],
    id: `https://rant.lol/api/activitypub/actor?user=acct:${getuser.data.username}@rant.lol`,
    type: "Person",
    name: "rant.lol",
    preferredUsername: getuser.data.username,
    summary: "Vent/Rant about your life or other stuff.",
    inbox: `https://rant.lol/api/activitypub/inbox?user=acct:${getuser.data.username}@rant.lol`,
    outbox: `https://rant.lol/api/activitypub/outbox?user=acct:${getuser.data.username}@rant.lol`,
    // followers: `https://rant.lol/api/activitypub/followers`,
    // following: `${origin}/api/activitypub/following`,
    icon: {
      type: "Image",
      mediaType: "image/png",
      url: `https://rant.lol/icon.png`,
    },
    publicKey: {
      id: `https://rant.lol/api/activitypub/actor?user=acct:${getuser.data.username}@rant.lol#main-key`,
      owner: `https://rant.lol/api/activitypub/actor?user=acct:${getuser.data.username}@rant.lol`,
      publicKeyPem: process.env.ACTIVITYPUB_PUBLIC_KEY
    }
  });
}