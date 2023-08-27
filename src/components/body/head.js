import { Header } from "@primer/react";
import { useState, useEffect } from 'react';
import { ActionMenu, ActionList, IconButton, Flash } from '@primer/react';
import Image from 'next/image';
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { SignInIcon, SignOutIcon } from "@primer/octicons-react";
import { default as NextHead } from "next/head";

export function Head() {
    const supabase = useSupabaseClient();
    const user = useUser();
    const Router = useRouter();
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

    const UserAvatar = () => {return <Image src={!ProfilePicture ? "https://seccdn.libravatar.org/static/img/nobody.png" : ProfilePicture} style={{borderRadius: 3}} width={20} height={20} alt="pfp" />};
    const GuestAvatar = () => {return <Image src="https://seccdn.libravatar.org/static/img/nobody.png" style={{borderRadius: 3}} width={20} height={20} alt="Anonymous" />};

    return (<>
        <NextHead>
            <title>rant.lol</title>
            <meta name="title" content="rant.lol" />
            <meta name="description" content="Vent/Rant about your life and other stuff while also sharing it with the fediverse" />
            <meta name="theme-color" content="#b22c3c" />
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://rant.lol/" />
            <meta property="og:title" content="rant.lol" />
            <meta property="og:description" content="Vent/Rant about your life and other stuff while also sharing it with the fediverse" />
            <meta property="og:image" content="https://rant.lol/metaimg.png" />
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content="https://rant.lol/" />
            <meta property="twitter:title" content="rant.lol" />
            <meta property="twitter:description" content="Vent/Rant about your life and other stuff while also sharing it with the fediverse" />
            <meta property="twitter:image" content="https://rant.lol/metaimg.png" />
        </NextHead>
        <Header style={{backgroundColor: "#191d22 !important"}}>
            <Header.Item>
                <Header.Link href="#" style={{textDecorationLine: "none"}} sx={{fontSize: 2}}>
                    <Image src="https://cdn.jsdelivr.net/gh/mar0xy/fluentui-twemoji-emojis@main/unicode/3d/1f621.png" alt="Angry Emoji" width={32} height={32} style={{marginRight: 4}} />
                    <span>rant.lol</span>
                </Header.Link>
            </Header.Item>
            <Header.Item full></Header.Item>
            {user && (
                <Header.Item sx={{mr: 0}}>
                    <ActionMenu>
                        <ActionMenu.Anchor><IconButton variant="invisible" icon={UserAvatar} /></ActionMenu.Anchor>
                        <ActionMenu.Overlay width="auto">
                            <ActionList>
                                <ActionList.Item onSelect={() => supabase.auth.signOut()}>
                                    <ActionList.LeadingVisual>
                                        <SignOutIcon size={16} />
                                    </ActionList.LeadingVisual>
                                    Sign Out
                                </ActionList.Item>
                            </ActionList>
                        </ActionMenu.Overlay>
                    </ActionMenu>
                </Header.Item>
            ) || !user && (
                <Header.Item sx={{mr: 0}}>
                    <ActionMenu>
                        <ActionMenu.Anchor><IconButton variant="invisible" icon={GuestAvatar} /></ActionMenu.Anchor>
                        <ActionMenu.Overlay width="auto">
                            <ActionList>
                                <ActionList.Item onSelect={() => Router.push("/auth")}>
                                    <ActionList.LeadingVisual>
                                        <SignInIcon size={16} />
                                    </ActionList.LeadingVisual>
                                    Sign In/Sign Up
                                </ActionList.Item>
                            </ActionList>
                        </ActionMenu.Overlay>
                    </ActionMenu>
                </Header.Item>
            )}
        </Header>
        <Flash className="text-center container-sm mt-1" sx={{width: "50rem;"}} variant="danger">rant.lol is still in Alpha, Expect bugs and other issues to occur.</Flash>
        </>
    )
}