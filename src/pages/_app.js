import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { useState } from 'react'
import '../styles/ghbrand.css';
import '@primer/css/index.scss';
import '@primer/css/utilities/index.scss';
import { ThemeProvider } from '@primer/react';
import { Head } from '@/components/body/head';
import { Foot } from '@/components/body/footer/foot';

export default function App({ Component, pageProps }) {
  // Create a new supabase browser client on every first render.
  const [supabaseClient] = useState(() => createPagesBrowserClient());

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession}
    >
    <ThemeProvider colorMode="night">
    <Head />
    <Component {...pageProps} />
    <Foot />
    </ThemeProvider>
    </SessionContextProvider>
  )
}
