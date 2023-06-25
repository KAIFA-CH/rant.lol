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

  const getuser = await supabase.from('accounts').select('id, username, avatar, created_at').ilike('username', `${req.query.user}`).maybeSingle();
  // Check if user exists
  if (!getuser.data) {
    res.statusCode = 404;
    res.end(`{"error": "unknown resource"}`);
    return;
  }

  // Respond with all required information

  respondActivityJSON(res, {
    "@context": [
      "https://www.w3.org/ns/activitystreams",
      "https://w3id.org/security/v1",
    ],
    id: `https://rant.lol/api/activitypub/${getuser.data.username}/actor`,
    type: "Person",
    name: getuser.data.username,
    preferredUsername: getuser.data.username,
    summary: "Vent/Rant about your life or other stuff.",
    inbox: `https://rant.lol/api/activitypub/${getuser.data.username}/inbox`,
    outbox: `https://rant.lol/api/activitypub/${getuser.data.username}/outbox`,
    followers: `https://rant.lol/api/activitypub/${getuser.data.username}/followers`,
    manuallyApprovesFollowers: false,
    discoverable: true,
    published: getuser.data.created_at,
    // followers: `https://rant.lol/api/activitypub/followers`,
    // following: `${origin}/api/activitypub/following`,
    icon: {
      type: "Image",
      mediaType: "image/png",
      url: `https://seccdn.libravatar.org/avatar/${getuser.data.avatar}?s=512&d=mm`,
    },
    publicKey: {
      "@context": "https://w3id.org/security/v1",
      "@type": "Key",
      id: `https://rant.lol/api/activitypub/${getuser.data.username}/actor#main-key`,
      owner: `https://rant.lol/api/activitypub/${getuser.data.username}/actor`,
      publicKeyPem: process.env.ACTIVITYPUB_PUBLIC_KEY
    }
  });
}