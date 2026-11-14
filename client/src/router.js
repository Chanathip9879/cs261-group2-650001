// client/src/router.js
// Hash router ขนาดเล็ก (ไม่ต้องติดตั้ง dependency เพิ่ม) ใช้ URL แบบ #/shop/shop-green-01
// ทำงานได้ทั้งตอน dev (vite) และตอน build ที่ server ส่ง index.html ให้ทุก path

import { useEffect, useState } from 'react';

function readPath() {
  const raw = window.location.hash.replace(/^#/, '');
  return raw.startsWith('/') ? raw : '/';
}

export function navigate(to) {
  if (readPath() === to) return;
  window.location.hash = to;
}

export function goBack(fallback = '/') {
  if (window.history.length > 1) window.history.back();
  else navigate(fallback);
}

export function useHashPath() {
  const [path, setPath] = useState(readPath);
  useEffect(() => {
    const onChange = () => {
      setPath(readPath());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return path;
}

// matchRoute('/shop/abc', '/shop/:id') -> { id: 'abc' } | null
export function matchRoute(path, pattern) {
  const p = path.split('?')[0].split('/').filter(Boolean);
  const r = pattern.split('/').filter(Boolean);
  if (p.length !== r.length) return null;
  const params = {};
  for (let i = 0; i < r.length; i++) {
    if (r[i].startsWith(':')) params[r[i].slice(1)] = decodeURIComponent(p[i]);
    else if (r[i] !== p[i]) return null;
  }
  return params;
}

export const routes = {
  home: '/',
  bookmarks: '/bookmarks',
  shop: (id) => `/shop/${encodeURIComponent(id)}`,
  review: (id) => `/shop/${encodeURIComponent(id)}/review`,
  login: '/login',
  merchantLogin: '/merchant/login',
  merchant: '/merchant',
  merchantHours: '/merchant/hours',
};
