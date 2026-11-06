import Link from 'next/link';
import { Bookmark, ChartNoAxesCombined, FileCheck2, FileText, Flag, Globe2, Landmark, LayoutDashboard, Library, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/actions';

type WorkspaceSection = 'overview' | 'promises' | 'saved' | 'editor';

export async function WorkspaceShell({ children, active = 'overview' }: { children: React.ReactNode; active?: WorkspaceSection }) {
  const supabase = await createClient();
  const [{ data: { user } }, { count }] = await Promise.all([
    supabase ? supabase.auth.getUser() : Promise.resolve({ data: { user: null } }),
    supabase ? supabase.from('promises').select('*', { count: 'exact', head: true }).eq('visibility', 'published') : Promise.resolve({ count: null }),
  ]);
  return <div className="app-shell">
    <aside className="sidebar">
      <Link href="/" className="brand"><span className="brand-mark"><Globe2 size={19}/></span><span>Civic<span>Lens</span><small>PUBLIC ACCOUNTABILITY</small></span></Link>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="nav-group" aria-label="Main navigation">
        <Link className={`nav-link ${active === 'overview' ? 'active' : ''}`} href="/"><LayoutDashboard size={17}/> Overview</Link>
        <Link className={`nav-link ${active === 'promises' ? 'active' : ''}`} href="/promises"><Flag size={17}/> Promise tracker <span className="nav-count">{count ?? '—'}</span></Link>
        <span className="nav-link disabled-link"><FileText size={17}/> Policy monitor <small>SOON</small></span>
        <span className="nav-link disabled-link"><ChartNoAxesCombined size={17}/> Budget lens <small>SOON</small></span>
        <span className="nav-link disabled-link"><Landmark size={17}/> Parliament watch <small>SOON</small></span>
      </nav>
      <div className="workspace-label library-label">RESEARCH</div>
      <nav className="nav-group" aria-label="Research navigation">
        <span className="nav-link disabled-link"><Library size={17}/> Source library <small>SOON</small></span>
        <Link className={`nav-link ${active === 'saved' ? 'active' : ''}`} href="/saved"><Bookmark size={17}/> Saved research</Link>
        {user && <Link className={`nav-link ${active === 'editor' ? 'active' : ''}`} href="/editor"><FileCheck2 size={17}/> Editorial desk</Link>}
      </nav>
      <div className="sidebar-bottom">
        <div className="integrity-card"><ShieldCheck size={17}/><div><strong>Evidence first</strong><p>Every assessment is traceable to its sources.</p></div></div>
        <div className="profile-link"><span className="avatar">{user?.email?.[0]?.toUpperCase() ?? 'G'}</span><span><strong>{user ? 'Your account' : 'Guest researcher'}</strong><small>{user ? user.email : 'Sign in to save research'}</small></span>{user ? <form action={signOut}><button className="text-button" type="submit">Sign out</button></form> : <Link href="/sign-in" className="text-button">Sign in</Link>}</div>
      </div>
    </aside>
    <section className="main-panel">
      <header className="topbar"><div className="breadcrumb"><Link href="/" className="workspace-crumb">Workspace</Link><span className="slash">/</span><strong>{active === 'promises' ? 'Promise tracker' : active === 'saved' ? 'Saved research' : active === 'editor' ? 'Editorial desk' : 'Overview'}</strong></div><div className="top-actions"><span className="live-indicator"><i/> LIVE DATABASE</span>{user ? <span className="top-signin">{user.email}</span> : <Link href="/sign-in" className="top-signin">Sign in</Link>}</div></header>
      {children}
    </section>
  </div>;
}
