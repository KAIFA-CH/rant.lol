import { useState } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';

export function UsernameDialog() {
    const supabase = useSupabaseClient();
    const user = useUser();
    const [username, setUsername] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    if(!user) return;

    const handleUsernameChange = (e) => {
        setUsername(e.target.value);
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { data: userinf } = await supabase.from('accounts').select('username').eq('id', user.id).single();
        
        if(userinf && userinf.username){
            setError('Username already set.');
            setLoading(false);
            document.getElementById('usernamedialog').remove();
            return;
        }
    
        if (username.length < 3 || username.length > 255) {
          setError('Username must be between 3 and 255 characters long.');
          return;
        }
    
        setLoading(true);
    
        // Check if the username is already used
        const { data, error: usernameError } = await supabase.from('accounts').select('id').eq('username', username).single();
    
        if (data) {
          setError('Username is already taken.');
          setLoading(false);
          return;
        }
    
        // Update the username in the user's profile
        const { error: updateError } = await supabase.from('accounts').update({ username: username }).eq('id', user.id);
    
        setLoading(false);
    
        if (updateError) {
          setError('An error occurred while updating the username.');
        } else {
          document.getElementById('usernamedialog').remove();
        }
    };

    return (
        <div className="Overlay-backdrop Overlay-backdrop--center" aria-labelledby="title-id" data-focus-trap="active" style={{zIndex: 10}} id="usernamedialog">
        <div class="Overlay Overlay--width-medium Overlay--height-extrasmall Overlay--motion-scaleFade" data-focus-trap="active">
        <header class="Overlay-header">
          <div class="Overlay-headerContentWrap">
          <div class="Overlay-titleWrap">
            <h2 style={{marginLeft: '21%'}}>Set Username</h2>
          </div>
          </div>
        </header>
        <div class="Overlay-body">
          <form onSubmit={handleSubmit}>
          <ul>
            <li className="Box-row">
            <input
              className="form-control input-lg ml-3"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={handleUsernameChange}
              aria-describedby="username-input-validation"
            />
            {error && <p className="flash mt-3 flash-error" id="username-input-validation">{error}</p>}
            </li>
            <footer class="Overlay-footer Overlay-footer--divided Overlay-footer--alignCenter">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              Save
            </button>
            </footer>
            </ul>
          </form>
          </div>
        </div>
        </div>
    );
}
