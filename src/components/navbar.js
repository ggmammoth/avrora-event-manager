import { getSession, logout, onAuthChange } from '../services/auth-service.js';
import { getProfile } from '../services/profile-service.js';
import { isSupabaseConfigured } from '../services/supabase.js';

const links = [
  ['Home', '/index.html'], ['Events', '/events.html'], ['My Registrations', '/my-registrations.html', 'auth'],
  ['Profile', '/profile.html', 'auth'], ['Admin Panel', '/admin.html', 'admin'],
];

function currentPath() { return location.pathname === '/' ? '/index.html' : location.pathname; }

export async function renderNavbar() {
  const target = document.querySelector('[data-navbar]');
  if (!target) return null;
  let session = null; let profile = null;
  if (isSupabaseConfigured) {
    try { session = await getSession(); if (session) profile = await getProfile(session.user.id); } catch (error) { console.warn(error.message); }
  }
  const nav = document.createElement('nav'); nav.className = 'navbar navbar-expand-lg navbar-dark fixed-top';
  nav.innerHTML = `<div class="container"><a class="navbar-brand" href="/index.html"><span class="brand-mark">A</span> AvroraMU</a><button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button><div class="collapse navbar-collapse" id="mainNav"><ul class="navbar-nav ms-auto align-items-lg-center gap-lg-1" data-nav-links></ul></div></div>`;
  const list = nav.querySelector('[data-nav-links]');
  links.filter(([, , access]) => !access || (access === 'auth' && session) || (access === 'admin' && profile?.role === 'admin')).forEach(([label, href]) => {
    const item = document.createElement('li'); item.className = 'nav-item';
    const a = document.createElement('a'); a.className = `nav-link${currentPath() === href ? ' active' : ''}`; a.href = href; a.textContent = label;
    if (currentPath() === href) a.setAttribute('aria-current', 'page'); item.append(a); list.append(item);
  });
  const authItem = document.createElement('li'); authItem.className = 'nav-item ms-lg-2';
  if (session) {
    const wrapper = document.createElement('div'); wrapper.className = 'd-flex align-items-center gap-2';
    const greeting = document.createElement('span'); greeting.className = 'navbar-text small text-nowrap'; greeting.textContent = profile?.full_name || session.user.email;
    const button = document.createElement('button'); button.className = 'btn btn-sm btn-outline-light'; button.type = 'button'; button.textContent = 'Logout';
    button.addEventListener('click', async () => { try { await logout(); location.href = '/index.html'; } catch (error) { alert(error.message); } }); wrapper.append(greeting, button); authItem.append(wrapper);
  } else {
    const wrapper = document.createElement('div'); wrapper.className = 'd-flex gap-2';
    const registerLink = document.createElement('a'); registerLink.className = 'btn btn-sm btn-outline-light'; registerLink.href = '/register.html'; registerLink.textContent = 'Register';
    const loginLink = document.createElement('a'); loginLink.className = 'btn btn-sm btn-gold'; loginLink.href = '/login.html'; loginLink.textContent = 'Login'; wrapper.append(registerLink, loginLink); authItem.append(wrapper);
  }
  list.append(authItem); target.replaceChildren(nav);
  return { session, profile };
}

export function watchNavbarAuth() {
  if (!isSupabaseConfigured) return;
  onAuthChange(() => window.setTimeout(renderNavbar, 0));
}
