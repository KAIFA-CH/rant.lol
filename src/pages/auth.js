import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Auth } from '@maroxy/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export default function AuthPage() {
    const supabase = useSupabaseClient();

     return <Auth supabaseClient={supabase} providers={[]} magicLink={false} appearance={{ theme: ThemeSupa }} />
}