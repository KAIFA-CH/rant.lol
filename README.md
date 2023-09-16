# rant.lol codebase

## Folder Structure explained

`public` - all static files
`src -> components` - everything used in the background like feed, signing mechanism for ActivityPub, head and footer, etc
`src -> pages` - all api endpoints (webfinger, nodeinfo, activitypub and auth) as well as the home and sign up/sign in page
`src -> styles` - modified stylesheets from primer as well as additional stylesheets not included by default

## Getting Started (development)

First, configure .env.example with all values listed inside of it and rename it to .env,

Second, configure supabase project by running the content of the SQL file in this repo and making sure feed is enabled for realtime usage,

Third, run the development server:

```bash
npm i
npm run dev
# or
pnpm i
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Getting Started (production)

First, configure .env.example with all values listed inside of it and rename it to .env,

Second, configure supabase project by running the content of the SQL file in this repo and making sure feed is enabled for realtime usage,

Third, run the production server:

```bash
npm i
npm run build
npm run start
# or
pnpm i
pnpm build
pnpm start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploy on Vercel

The easiest way to deploy this app is via vercel by making a new vercel project and pasting the .env content into the environment variable section.
