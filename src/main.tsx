import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import './index.css';

// The public home page lives at "/". The prayer wall app runs at /app, and also
// handles embed links, church links, and links back from Supabase emails.
const { pathname, search, hash } = window.location;
const params = new URLSearchParams(search);
const isApp =
  pathname.startsWith('/app') ||
  pathname.startsWith('/embed/') ||
  params.has('church') ||
  params.get('reset') === '1' ||
  /access_token|type=recovery|error_description/.test(hash) ||
  params.has('code');

createRoot(document.getElementById('root')!).render(isApp ? <App /> : <LandingPage />);
