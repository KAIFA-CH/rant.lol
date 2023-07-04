import { Header } from "@primer/react";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

export function Head() {
    const supabase = useSupabaseClient();
    const user = useUser();
    const [ProfilePicture, setProfilePicture] = useState(null);

    useEffect(() => {
        async function fetchProfilePicture() {
            if (user) {
                const { data, error } = await supabase
                    .from('accounts')
                    .select('avatar')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error('Error fetching profile picture:', error.message);
                } else {
                    setProfilePicture(`https://seccdn.libravatar.org/avatar/${data.avatar}?s=40&d=mm`);
                }
            }
        }

        fetchProfilePicture();
    }, [supabase, user]);

    return (
        <Header style={{backgroundColor: "#191d22 !important"}}>
            <Header.Item>
                <Header.Link href="#" style={{textDecorationLine: "none"}} sx={{fontSize: 2}}>
                    <Image src="https://cdn.jsdelivr.net/gh/mar0xy/fluentui-twemoji-emojis@main/unicode/3d/1f621.png" width={32} height={32} style={{marginRight: 4}} />
                    <span>rant.lol</span>
                </Header.Link>
            </Header.Item>
            <Header.Item full>Home</Header.Item>
            {user && (
            <Header.Item sx={{mr: 0}}>
                <Image src={!ProfilePicture ? "https://seccdn.libravatar.org/static/img/nobody.png" : ProfilePicture} style={{borderRadius: 3}} width={20} height={20} alt="@octocat" />
            </Header.Item>
            )}
            {!user && (
            <Header.Item sx={{mr: 0}}>
                <Image src="https://seccdn.libravatar.org/static/img/nobody.png" style={{borderRadius: 3}} width={20} height={20} alt="@octocat" />
            </Header.Item>
            )} 
        </Header>
    )
}