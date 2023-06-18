import { useState, useEffect } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Feed } from '@/components/feed';
import { UsernameDialog } from '@/components/usernamedialog';

export default function Home() {
  const [feedData, setFeedData] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [HasUsername, setHasUsername] = useState(true);
  const supabase = useSupabaseClient();
  const user = useUser();

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

    if(newPostContent.length < 3 || newPostContent.length > 255) {
      return;
    }

    // Add the new post to the database
    const { data, error } = await supabase
      .from('feed')
      .insert([{ content: newPostContent, user_id: user ? user.id : null }])
      .single();
    if (error) console.log('error', error);

    setNewPostContent('');
  };

  return (
  <div className="container-xl mt-5">
  {!HasUsername && <UsernameDialog />}
  <div className="d-flex justify-content-center">
  <form onSubmit={handleNewPostSubmit} className="flex-items-center">
  <textarea
           value={newPostContent}
           onChange={handleNewPostChange}
           className="form-control mb-3 mr-2"
           placeholder="What's on your mind?"
         />
  <button type="submit" className="btn btn-primary mb-3">
  Post
  </button>
  </form>
  </div>
  <Feed data={feedData} />
</div>
);
}
