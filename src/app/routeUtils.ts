import type { AppView } from '@/types/school';

export function detectInitialAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const pathname = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  return (
    pathname === '/admin' ||
    pathname === '/admin/' ||
    window.location.hash === '#admin' ||
    params.get('admin') === 'true' ||
    params.get('view') === 'dinas' ||
    params.get('dinas') === 'true'
  );
}

export function detectInitialSearchRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const pathname = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  return (
    pathname === '/search' ||
    pathname === '/search/' ||
    params.get('view') === 'search' ||
    params.has('province') ||
    params.has('city') ||
    params.has('level') ||
    params.has('status') ||
    params.has('search')
  );
}

export function syncBrowserHistoryForView(view: AppView, schoolNpsn?: string): void {
  if (typeof window === 'undefined') return;
  const currentPath = window.location.pathname.toLowerCase();

  if (view === 'dinas-dashboard') {
    if (currentPath !== '/admin') {
      window.history.pushState(null, '', '/admin');
    }
  } else if (view === 'school-search') {
    if (currentPath !== '/search' && currentPath !== '/search/') {
      window.history.pushState(null, '', '/search');
    }
  } else if (view === 'school-profile') {
    const targetUrl = schoolNpsn ? `/?npsn=${schoolNpsn}` : '/';
    if (window.location.search !== `?npsn=${schoolNpsn}`) {
      window.history.pushState(null, '', targetUrl);
    }
  } else if (
    currentPath === '/admin' ||
    currentPath === '/admin/' ||
    currentPath === '/search' ||
    currentPath === '/search/' ||
    window.location.search !== ''
  ) {
    window.history.pushState(null, '', '/');
  }
}

