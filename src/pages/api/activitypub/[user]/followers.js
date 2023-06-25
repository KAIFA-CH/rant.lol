import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

const respondActivityJSON = (res, json) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/activity+json");
    res.end(JSON.stringify(json));
};

const supabase = createPagesBrowserClient();
let getuser;

export default async function followers(req, res) {
  const origin = req.headers.host;
  if (!req.query.user) {
    res.statusCode = 404;
    res.end(`{"error": "unknown resource"}`);
    return;
  }
  getuser = await supabase.from('accounts').select('id, username').ilike('username', `${req.query.user}`).maybeSingle();

  // Check if user exists
  if (!getuser.data) {
    res.statusCode = 404;
    res.end(`{"error": "unknown resource"}`);
    return;
  }

  // Get all followers and then return an activity response.
  const followers = await getAllFollowers();
  const response = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `https://${origin}/api/activitypub/${getuser.data.username}/followers`,
    type: "OrderedCollection",
    totalItems: !followers.followers ? 0 : followers.followers.length,
    orderedItems: followers.followers,
  };
  respondActivityJSON(res, response);
}

export async function saveFollower(follower, user) {
  const followers = await supabase.from('accounts').select('followers').ilike('username', `${user.data.username}`).maybeSingle();
  let orderedItems = !followers.data.followers ? [] : followers.data.followers;

  if (orderedItems && orderedItems.includes(follower)) {
    console.log('already following');
    return;
  }

  orderedItems.push(follower);

  const { data, error } = await supabase.from('accounts').update({ followers: orderedItems }).eq('username', user.data.username);
}

export async function removeFollower(follower, user) {
  const followers = await supabase.from('accounts').select('followers').ilike('username', `${user.data.username}`).maybeSingle();
  let orderedItems = !followers.data ? [] : followers.data.followers;

  if (followers.data) {
    const index = orderedItems.indexOf(follower);
    if (index !== -1) {
      orderedItems.splice(index, 1);
      const { data, error } = await supabase.from('accounts').update({ followers: orderedItems }).eq('username', user.data.username);
      console.log(`follower ${follower} removed successfully`);
      return;
    }
  }
  
  console.log(`follower ${follower} not found`);
}

export async function getAllFollowers() {
  const followers = await supabase.from('accounts').select('followers').ilike('username', `${getuser.data.username}`).maybeSingle();
  if (followers.data != null) {
    return followers.data;
  }
  return [];
}