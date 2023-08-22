import { useState, useEffect, useRef } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Feed } from '@/components/feed';
import { UsernameDialog } from '@/components/usernamedialog';
import { Button } from '@primer/react';
import { PencilIcon } from '@primer/octicons-react';

export default function Home() {
  const [feedData, setFeedData] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [HasUsername, setHasUsername] = useState(true);
  const [limit, setLimit] = useState(8);
  const supabase = useSupabaseClient();
  const user = useUser();
  const bottomRef = useRef(null);

  async function listenToFeedUpdates() {
    try {

      const { data, error } = await supabase
        .channel('changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'feed'
          },
          async (payload) => {
            const newPost = payload.new;
            const { data: userinfo, error } = await supabase
              .from('accounts')
              .select(`
                username,
                avatar
              `)
              .eq('id', newPost.user_id)
              .maybeSingle();
            if(userinfo) Object.assign(payload.new, {accounts: {username: userinfo.username, avatar: userinfo.avatar}});
            setFeedData((prevData) => [...prevData, payload.new].sort((a,b)=>{
              return new Date(b.created_at) - new Date(a.created_at);
            }));
            console.log('New post:', newPost);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'feed'
          },
          async (payload) => {
            const updatedPost = payload.new;
            const { data: userinfo, error } = await supabase
              .from('accounts')
              .select(`
                username,
                avatar
              `)
              .eq('id', updatedPost.user_id)
              .maybeSingle();
            if(userinfo) Object.assign(payload.new, {accounts: {username: userinfo.username, avatar: userinfo.avatar}});
            setFeedData((prevData) => 
              prevData.map((item) => (item.id === payload.new.id ? payload.new : item)).sort((a,b)=>{
                return new Date(b.created_at) - new Date(a.created_at);
              })
            );
            console.log('Updated post:', updatedPost);
          }
        )
        .subscribe();
  
      if (error) {
        console.error('Error subscribing to feed updates:', error);
        return;
      }
  
      console.log('Subscribed to feed updates');
    } catch (error) {
      console.error('Error subscribing to feed updates:', error);
    }
  }

  useEffect(() => {
    // Fetch the initial data
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('feed')
        .select(`
          *,
          user_id,
          reactions,
          accounts (
            username,
            avatar
          )
        `)
        .order('created_at', { ascending: false });
      if (error) console.log('error', error);
      else {
        const processeddata = data.map((post) => ({
          ...post,
          reactions: post.reactions  || {},
        }));
        setFeedData(processeddata);
      }
    };

    fetchData();
    listenToFeedUpdates();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (
        bottomRef.current &&
        window.innerHeight + window.scrollY >= bottomRef.current.offsetTop
      ) {
        setLimit((prevLimit) => prevLimit + 8);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleNewPostChange = (event) => {
    setNewPostContent(event.target.value);
  };

  const handleNewPostSubmit = async (event) => {
    event.preventDefault();

    // Error out if no username is set (this is to prevent users from deleting the username dialog and then posting)
    if (user) {
      const {data: userinf} = await supabase.from('accounts').select('username').eq('id', user.id).single();
      if(!userinf.username) {
        setHasUsername(false);
        return;
      }
    }

    if(newPostContent.replace(/\s/g, '').length < 3 || newPostContent.replace(/\s/g, '').length > 255) {
      return;
    }

    // Add the new post to the database
    const { data: newpostdata, error } = await supabase
      .from('feed')
      .insert([{ content: newPostContent, user_id: user ? user.id : null }])
      .select()
      .single();
    if (error) console.log('error', error);

    if (user) {
      await fetch(`/api/activitypub/publish?id=${newpostdata.id}`);
    }

    setNewPostContent('');
  };

  const Pencil = () => {return <PencilIcon size={16}></PencilIcon>};
  
  return (
    <div className="container-md mt-5">
    {!HasUsername && <UsernameDialog />}
      <div className="text-center">
        <form onSubmit={handleNewPostSubmit}>
        <textarea
          value={newPostContent}
          onChange={handleNewPostChange}
          className="form-control mb-2"
          style={{ height: "100px", width: "500px", resize: "none" }}
          placeholder="What's on your mind?"
        />
        <Button variant="primary" leadingIcon={Pencil} size="large" type="submit" className="mb-3 mx-auto">Publish</Button>
        </form>
      </div>
    <Feed data={feedData.slice(0, limit)} />
    {feedData.length > limit && (
        <div ref={bottomRef} />
    )}
    </div>
  );
}
