import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export default function AuthPage() {
    const supabase = useSupabaseClient();

    return <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />
}