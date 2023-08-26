import { Auth } from '@maroxy/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';

export default function AuthPage() {
    const supabase = useSupabaseClient();
    const user = useUser();
    const router = useRouter();

    if (!user) {
        return (
            <div className="container-md mt-5 mb-5 text-center">
                <div className="Box color-shadow-small">
                    <div className="Box-row color-fg-muted">
                        <Auth supabaseClient={supabase} redirectTo="/" theme="dark" providers={[]} magicLink={false} appearance={{ theme: ThemeSupa }} />
                    </div>
                </div>
            </div>
        )
    } else {
        router.push('/');
    }
}