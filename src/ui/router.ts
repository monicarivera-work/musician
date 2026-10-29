import { useEffect, useState } from 'react';

export type Route = 'song' | 'scales' | 'sing' | 'progress';

const ROUTES: Route[] = ['song', 'scales', 'sing', 'progress'];

function read(): Route {
  const r = window.location.hash.replace(/^#\/?/, '').split('/')[0] as Route;
  return ROUTES.includes(r) ? r : 'song';
}

/** Hash routes work on GitHub Pages without server rewrites. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(read);
  useEffect(() => {
    const onHash = () => {
      setRoute(read());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}

export function go(route: Route): void {
  window.location.hash = `/${route}`;
}
