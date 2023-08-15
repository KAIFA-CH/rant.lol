import Picker, { Emoji } from 'emoji-picker-react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { SmileyIcon } from '@primer/octicons-react';
import { useState, useEffect } from 'react';
import emojiRegex from 'emoji-regex';
import regexifyString from 'regexify-string';
import Image from 'next/image';

export function Feed({ data }) {
    const supabase = useSupabaseClient();
    const user = useUser();
    const [selectedEPostId, setSelectedEPostId] = useState(null);
    const [feedData, setFeedData] = useState([]);
    
    const handleEmojiClick = async (id, emoji) => {

        // Get the emoji name from the data and then set the emoji variable to the unicode of the emoji for easy processing
        let emojiname = emoji.names[0];
        emoji = emoji.unified;
    
        if (!user) {
          alert('You must be logged in to react to posts.');
          return;
        }

        setSelectedEPostId(null);
    
        // Check if the user has already reacted to this post
        const { data: post } = await supabase.from('feed').select('reactions').eq('id', id).single();
        if (post.reactions && post.reactions[emoji] && (post.reactions[emoji].inititalReactor == user.id || post.reactions[emoji].reactors.includes(user.id))) {
          if (post.reactions[emoji].inititalReactor == user.id && post.reactions[emoji].reactors.length == 0) {
            delete post.reactions[emoji];
            let newData = {...post.reactions};
    
            const { data, error } = await supabase
              .from('feed')
              .update({ reactions: newData })
              .eq('id', id);
            if (error) console.log('error', error);
            return;
          } else if (post.reactions[emoji].inititalReactor == user.id && post.reactions[emoji].reactors.length > 0) {
            post.reactions[emoji].inititalReactor = null;
            const { data, error } = await supabase
              .from('feed')
              .update({ reactions: post.reactions })
              .eq('id', id);
            if (error) console.log('error', error);
            return;
          } else if (post.reactions[emoji].reactors.length > 1 && post.reactions[emoji].reactors.includes(user.id)) {
            post.reactions[emoji].reactors = post.reactions[emoji].reactors.filter(x => x !== user.id);
            const { data, error } = await supabase
              .from('feed')
              .update({ reactions: post.reactions })
              .eq('id', id);
            if (error) console.log('error', error);
            return;
          } else if (post.reactions[emoji].reactors.length == 1 && post.reactions[emoji].reactors.includes(user.id) && !post.reactions[emoji].inititalReactor) {
            delete post.reactions[emoji];
            let newData = {...post.reactions};
    
            const { data, error } = await supabase
              .from('feed')
              .update({ reactions: newData })
              .eq('id', id);
            if (error) console.log('error', error);
            return;
          } else {
            alert('Error!');
            return;
          }
        }
    
        if (!post.reactions) {
          let newData = { [emoji]: { name: emojiname, reactors: [], inititalReactor: user.id }, ...post.reactions };
    
          // Add the reaction to the post
          const { data, error } = await supabase
            .from('feed')
            .update({ reactions: newData })
            .eq('id', id);
          if (error) console.log('error', error);
          else setFeedData((prevData) => prevData.map((item) =>
            item.id === id
              ? {
                  ...item,
                  reactions: { ...item.reactions, [emoji]: { name: emojiname, reactors: [], inititalReactor: user.id } },
                }
              : item
          ));
        } else if (post.reactions && !post.reactions[emoji]) {
          let newData = { [emoji]: { name: emojiname, reactors: [], inititalReactor: user.id }, ...post.reactions };
    
          // Add the reaction to the post
          const { data, error } = await supabase
            .from('feed')
            .update({ reactions: newData })
            .eq('id', id);
          if (error) console.log('error', error);
          else setFeedData((prevData) => prevData.map((item) =>
            item.id === id
              ? {
                  ...item,
                  reactions: { ...item.reactions, [emoji]: { name: emojiname, reactors: [], inititalReactor: user.id } },
                }
              : item
          ));
        } else {
          post.reactions[emoji].reactors.push(user.id);
          const { data, error } = await supabase
            .from('feed')
            .update({ reactions: post.reactions })
            .eq('id', id);
          if (error) console.log('error', error);
          else setFeedData((prevData) => prevData.map((item) =>
            item.id === id
              ? {
                  ...item,
                  reactions: { ...item.reactions, [emoji]: { name: emojiname, reactors: post.reactions[emoji].reactors, inititalReactor: post.reactions[emoji].inititalReactor } },
                }
              : item
          ));
        }
      };
    
      const toggleEmojiPicker = (postId) => {
        if (selectedEPostId === postId) {
          setSelectedEPostId(null);
        } else {
          setSelectedEPostId(postId);
        }
      };
    return data.map(post => (
        <div key={post.id} className="Box mb-3">
        <div className="Box-body">
            <p className="mb-1">
            <Image className="avatar avatar-small" alt={post.accounts ? post.accounts.username : 'nobody'} src={post.accounts ? `https://seccdn.libravatar.org/avatar/${post.accounts.avatar}?s=40&d=mm` : 'https://seccdn.libravatar.org/static/img/nobody.png?size=40'} width="20" height="20" style={{borderRadius: "20px"}} /> {post.accounts ? post.accounts.username : 'Anonymous'} - {new Date(post.created_at).toLocaleString()}
            </p>
            <p className="pt-1">{
            regexifyString({
              pattern: emojiRegex(),
              decorator: (match, index) => {
                let emoji = match.codePointAt(0).toString(16) + '-';

                for (let i = 2; i < match.length; i++) {
                  emoji = emoji + match.codePointAt(i).toString(16) + '-';
                };
                
                return <Emoji key={match} emojiStyle='fluentui' emojiVersion='13.0' getEmojiUrl={(uni, sty) => {return `https://cdn.jsdelivr.net/gh/mar0xy/fluentui-twemoji-emojis@main/unicode/3d/${uni}.png`}} unified={emoji.replace(/-*$/, '')} size={14} />
              },
              input: post.content,
            })
            }</p>
            <div className="pt-1">
            <details className="dropdown details-reset details-overlay d-inline-block">
            <summary className="btn-octicon circle color-bg-subtle ml-0 border" aria-disabled={user ? undefined : 'true'} title={!user ? 'Register to react' : undefined} type="button" onClick={() => toggleEmojiPicker(post.id)}><SmileyIcon fill='#8b949e' size={16} /></summary>
                {selectedEPostId === post.id && user && (
                <ul className="dropdown-menu dropdown-menu-e" style={{background: "#222"}}>
                <Picker skinTonesDisabled={true} defaultSkinTone='neutral' theme='dark' emojiStyle='fluentui' emojiVersion='13.0' getEmojiUrl={(uni, sty) => {return `https://cdn.jsdelivr.net/gh/mar0xy/fluentui-twemoji-emojis@main/unicode/3d/${uni}.png`}} onEmojiClick={(emojiData, event) => handleEmojiClick(post.id, emojiData)} lazyLoadEmojis={true}/>
                </ul>
                )}
            </details>
            {post.reactions && Object.keys(post.reactions).length > 0 ? (
                Object.keys(post.reactions).map((emoji) => (
                    <div className="btn-octicon no-underline border color-fg-muted d-inline-flex" style={{borderRadius: "10px"}} title={post.reactions[emoji].name} key={post.reactions[emoji].name}>
                    <Emoji emojiStyle='fluentui' emojiVersion='13.0' getEmojiUrl={(uni, sty) => {return `https://cdn.jsdelivr.net/gh/mar0xy/fluentui-twemoji-emojis@main/unicode/3d/${uni}.png`}} unified={emoji} size={16} />
                    &nbsp;{post.reactions[emoji].inititalReactor ? 1 + post.reactions[emoji].reactors.length : 0 + post.reactions[emoji].reactors.length}
                    </div>
                ))
                ) : (
                <span className="ml-2">No Reactions</span>
                )}
            </div>
        </div>
        </div>
       )
    )
}
