import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Auth } from '@maroxy/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export default function AuthPage() {
    const supabase = useSupabaseClient();

    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type !== "childList" || mutation.addedNodes.length === 0)
              return;
      
            for (const node of mutation.addedNodes) {
              if (
                node instanceof HTMLElement &&
                (node.classList.contains("supabase-account-ui_ui-message") ||
                  node.classList.contains("supabase-auth-ui_ui-message"))
              ) {
                const originErrorMessage = node.innerHTML.trim();
      
                let translatedErrorMessage = "<DEFAULT MESSAGE>";
                switch (originErrorMessage) {
                  case "To signup, please provide your email":
                    translatedErrorMessage = "To signup, please provide your email";
                    break;
                  case "Signup requires a valid password":
                    translatedErrorMessage = "Signup requires a valid password";
                    break;
                  case "User already registered":
                    translatedErrorMessage = "User already registered";
                    break;
                  case "Only an email address or phone number should be provided on signup.":
                    translatedErrorMessage = "Only an email address or phone number should be provided on signup.";
                    break;
                  case "Signups not allowed for this instance":
                    translatedErrorMessage = "Signups not allowed for this instance";
                    break;
                  case "Email signups are disabled":
                    translatedErrorMessage = "Email signups are disabled";
                    break;
                  case "Email link is invalid or has expired":
                    translatedErrorMessage = "Email link is invalid or has expired";
                    break;
                  case "Token has expired or is invalid":
                    translatedErrorMessage = "Token has expired or is invalid";
                    break;
                  case "The new email address provided is invalid":
                    translatedErrorMessage = "The new email address provided is invalid";
                    break;
                  case "Password should be at least 6 characters":
                    translatedErrorMessage = "Password should be at least 6 characters";
                    break;
                  case "Invalid login credentials":
                    translatedErrorMessage = "Invalid login credentials";
                    break;
                  case 'duplicate key value violates unique constraint "accounts_username_key"':
                    translatedErrorMessage = "Username taken";
                    break;
                }
      
                if (!document.querySelector("#auth-forgot-password")) {
                  node.innerHTML = translatedErrorMessage;
                }
              }
            }
          });
        });
      
        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }, []);

     return <Auth supabaseClient={supabase} providers={[]} magicLink={true} view='magic_link' appearance={{ theme: ThemeSupa }} />
}