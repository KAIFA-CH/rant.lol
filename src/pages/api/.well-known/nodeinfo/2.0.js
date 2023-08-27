import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

export default async function nodeinfodata(req, res) {
    const supabase = createPagesBrowserClient();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=60");
    const { data, count: usercount } = await supabase.from('accounts').select('id', { count: 'exact', head: true });
    const { data2, count: postcount } = await supabase.from('feed').select('id', { count: 'exact', head: true });
  
    // Return nodeinfo data
    res.statusCode = 200;
    res.end(`{  
        "version": "2.0",
        "software": {
          "name": "rantdotlol",
          "version": "1.0"
        },
        "protocols": [
          "activitypub"
        ],
        "services": {
          "outbound": [
      
          ],
          "inbound": [
      
          ]
        },
        "usage": {
          "users": {
            "total": ${usercount},
            "activeMonth": 0,
            "activeHalfyear": 0
          },
          "localPosts": ${postcount},
          "localComments": 0
        },
        "openRegistrations": true,
        "metaData": {
            "nodeName": "rant.lol",
            "nodeDescription": "rant.lol is a platform where people can rant/vent about everything in their life anonymously without AP function or as a user with AP function.",
            "maintainer": {
                "name": "Marie",
                "email": "marie@kaifa.ch"
            },
            "langs": [],
            "themeColor": "#b22c3c"
        }
    }`);
}