export default async function hostmetajson(req, res) {
    res.setHeader("Content-Type", "application/xrd+xml");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=60");
  
    // Return nodeinfo
    res.statusCode = 200;
    res.end(`<?xml version="1.0" encoding="UTF-8"?><XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0"><Link rel="lrdd" type="application/xrd+xml" template="https://rant.lol/.well-known/webfinger?resource={uri}"/></XRD>`);
  }