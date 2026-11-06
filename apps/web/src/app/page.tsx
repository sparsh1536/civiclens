import Link from 'next/link';
import { Activity, ArrowRight, ArrowUpRight, Bookmark, Building2, ChartNoAxesCombined, ChevronDown, FileCheck2, FileText, Flag, Globe2, Landmark, LayoutDashboard, Library, ShieldCheck, Wallet } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/actions';

const modules = [
  { icon: FileCheck2, title: 'Promise tracker', description: 'Follow public commitments from manifesto to measurable outcome.', tag: 'CORE MODULE', href: '/promises', active: true },
  { icon: Landmark, title: 'Policy monitor', description: 'Understand policy intent, implementation and documented impact.', tag: 'IN DEVELOPMENT', href: '#', active: false },
  { icon: Wallet, title: 'Budget lens', description: 'Connect allocations, expenditure and public outcomes.', tag: 'IN DEVELOPMENT', href: '#', active: false },
  { icon: Building2, title: 'Parliament watch', description: 'Explore bills, questions, debates and voting records.', tag: 'PLANNED', href: '#', active: false },
];
const statusLabel: Record<string, string> = { not_assessed: 'Not assessed', not_started: 'Not started', in_progress: 'In progress', fulfilled: 'Fulfilled', partially_fulfilled: 'Partially fulfilled', not_fulfilled: 'Not fulfilled', disputed: 'Disputed' };

export default async function Home() {
  const supabase = await createClient();
  const [auth, promiseCount, assessmentCount, jurisdictionCount, evidenceCount, recent] = await Promise.all([
    supabase ? supabase.auth.getUser() : Promise.resolve({ data: { user: null } }),
    supabase ? supabase.from('promises').select('*', { count: 'exact', head: true }).eq('visibility', 'published') : Promise.resolve({ count: null }),
    supabase ? supabase.from('assessments').select('*', { count: 'exact', head: true }).eq('visibility', 'published') : Promise.resolve({ count: null }),
    supabase ? supabase.from('jurisdictions').select('*', { count: 'exact', head: true }) : Promise.resolve({ count: null }),
    supabase ? supabase.from('evidence').select('*', { count: 'exact', head: true }).eq('visibility', 'published') : Promise.resolve({ count: null }),
    supabase ? supabase.from('promises').select('id,title,category,status,manifestos(title,elections(jurisdictions(name)))').eq('visibility', 'published').order('created_at', { ascending: false }).limit(4) : Promise.resolve({ data: [] }),
  ]);
  const user = auth.data.user;
  const rows = recent.data ?? [];
  const metrics = [
    { label: 'PUBLISHED COMMITMENTS', value: promiseCount.count, note: 'Public register', icon: FileCheck2 },
    { label: 'PUBLISHED ASSESSMENTS', value: assessmentCount.count, note: 'Reviewed records', icon: Activity },
    { label: 'JURISDICTIONS', value: jurisdictionCount.count, note: 'National + state model', icon: Building2 },
    { label: 'PUBLISHED SOURCES', value: evidenceCount.count, note: 'Verifiable references', icon: Library },
  ];

  return <main className="app-shell">
    <aside className="sidebar">
      <Link href="/" className="brand"><span className="brand-mark"><Globe2 size={19} /></span><span>Civic<span>Lens</span><small>PUBLIC ACCOUNTABILITY</small></span></Link>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="nav-group" aria-label="Main navigation">
        <Link className="nav-link active" href="/"><LayoutDashboard size={17}/> Overview</Link>
        <Link className="nav-link" href="/promises"><Flag size={17}/> Promise tracker <span className="nav-count">{promiseCount.count ?? '—'}</span></Link>
        <span className="nav-link disabled-link"><FileText size={17}/> Policy monitor <small>SOON</small></span>
        <span className="nav-link disabled-link"><ChartNoAxesCombined size={17}/> Budget lens <small>SOON</small></span>
        <span className="nav-link disabled-link"><Landmark size={17}/> Parliament watch <small>SOON</small></span>
      </nav>
      <div className="workspace-label library-label">RESEARCH</div>
      <nav className="nav-group" aria-label="Research navigation"><span className="nav-link disabled-link"><Library size={17}/> Source library <small>SOON</small></span><Link className="nav-link" href="/saved"><Bookmark size={17}/> Saved research</Link>{user && <a className="nav-link" href="/editor"><FileCheck2 size={17}/> Editorial desk</a>}</nav>
      <div className="sidebar-bottom"><div className="integrity-card"><ShieldCheck size={17}/><div><strong>Evidence first</strong><p>Every assessment is traceable to its sources.</p></div></div><div className="profile-link"><span className="avatar">{user?.email?.[0]?.toUpperCase() ?? 'G'}</span><span><strong>{user ? 'Your account' : 'Guest researcher'}</strong><small>{user ? user.email : 'Sign in to save research'}</small></span>{user ? <form action={signOut}><button className="text-button" type="submit">Sign out</button></form> : <Link href="/sign-in" className="text-button">Sign in</Link>}</div></div>
    </aside>
    <section className="main-panel">
      <header className="topbar"><div className="breadcrumb"><span>Workspace</span><span className="slash">/</span><strong>Overview</strong></div><div className="top-actions"><span className="live-indicator"><i/> LIVE DATABASE</span>{user ? <span className="top-signin">{user.email}</span> : <Link href="/sign-in" className="top-signin">Sign in <ArrowUpRight size={14}/></Link>}</div></header>
      <div className="content" id="overview">
        <div className="eyebrow"><span/> INDEPENDENT GOVERNANCE INTELLIGENCE <span className="eyebrow-line"/></div>
        <div className="hero-row"><div><h1>See beyond<br/><em>the promises.</em></h1><p className="hero-copy">A clearer view of public commitments, government action and the evidence in between.</p></div><div className="hero-aside"><span className="aside-index">01 / THE CIVIC RECORD</span><p>Accountability should be built on verifiable evidence — not political noise.</p><Link href="/promises">Explore the record <ArrowRight size={14}/></Link></div></div>
        <div className="filter-bar"><div className="filter-label"><span className="filter-dot"/> RESEARCH SCOPE</div><span className="filter-chip">India <ChevronDown size={14}/></span><span className="filter-chip">All jurisdictions <ChevronDown size={14}/></span><span className="filter-chip">Published records <ChevronDown size={14}/></span><div className="filter-spacer"/><Link className="search-button" href="/promises"><Flag size={15}/> Browse commitments <kbd>↗</kbd></Link></div>
        <section className="section-block"><div className="section-heading"><div><span className="section-kicker">THE LANDSCAPE</span><h2>Accountability, at a glance.</h2></div><span className="section-note">LIVE · PUBLISHED RECORDS ONLY</span></div>
          <div className="metric-grid">{metrics.map((metric) => { const Icon = metric.icon; return <article className="metric-card" key={metric.label}><div className="metric-top"><span>{metric.label}</span><Icon size={17}/></div><div className="metric-value">{metric.value === null ? '—' : metric.value.toLocaleString('en-IN')}</div><div className="metric-foot"><span className="metric-neutral">Live database</span><span>{metric.note}</span></div><div className="metric-rule"><i style={{ width: metric.value ? '100%' : '0%' }}/></div></article>; })}</div>
        </section>
        <section className="section-block promise-section" id="promise-tracker"><div className="section-heading"><div><span className="section-kicker">01 — PROMISE TRACKER</span><h2>From commitment to evidence.</h2><p className="section-description">The latest commitments published in the CivicLens register.</p></div><Link className="text-link" href="/promises">View all commitments <ArrowRight size={15}/></Link></div>
          {rows.length ? <div className="table-wrap"><div className="table-head"><span>COMMITMENT</span><span>JURISDICTION</span><span>ASSESSMENT</span><span>RECORD</span></div>{rows.map((item: any, index: number) => { const manifesto = Array.isArray(item.manifestos) ? item.manifestos[0] : item.manifestos; const election = Array.isArray(manifesto?.elections) ? manifesto?.elections[0] : manifesto?.elections; const jurisdiction = Array.isArray(election?.jurisdictions) ? election?.jurisdictions[0] : election?.jurisdictions; return <Link className="promise-row promise-row-link" href={`/promises/${item.id}`} key={item.id}><div className="promise-title"><span className="row-number">{String(index + 1).padStart(2, '0')}</span><div><strong>{item.title}</strong><small>{item.category} · {manifesto?.title ?? 'Manifesto record'}</small></div></div><div className="jurisdiction">{jurisdiction?.name ?? 'India'}</div><div><span className={`status-pill ${item.status === 'fulfilled' ? 'progress' : item.status === 'not_assessed' ? 'pending' : 'review'}`}><i/>{statusLabel[item.status] ?? item.status}</span></div><div className="coverage"><span className="record-open">Open record <ArrowUpRight size={13}/></span></div></Link>; })}</div> : <div className="empty-dashboard"><FileCheck2 size={21}/><div><strong>No published commitments yet.</strong><p>Your database is connected. Add reviewed, published records to populate the public register.</p></div><Link href="/promises">Open PromiseTracker <ArrowUpRight size={14}/></Link></div>}
          <p className="sample-note"><ShieldCheck size={14}/> Only published records appear here. No sample figures or inferred performance scores.</p>
        </section>
        <section className="section-block modules-section"><div className="section-heading"><div><span className="section-kicker">THE RESEARCH SUITE</span><h2>One record. Multiple lenses.</h2></div><span className="section-note">PRODUCT ROADMAP</span></div><div className="module-grid">{modules.map((module, index) => { const Icon = module.icon; const content = <><div className="module-top"><span className="module-icon"><Icon size={18}/></span><span className="module-index">0{index + 1}</span></div><span className="module-tag">{module.tag}</span><h3>{module.title}</h3><p>{module.description}</p><span className="module-arrow"><ArrowUpRight size={16}/></span></>; return module.active ? <Link className="module-card" href={module.href} key={module.title}>{content}</Link> : <article className="module-card" key={module.title}>{content}</article>; })}</div></section>
        <footer className="footer"><div className="footer-brand"><span className="brand-mark small"><Globe2 size={14}/></span> CivicLens <span>·</span> See beyond the promises.</div><div>Independent by design. Evidence before opinion.</div><div className="footer-links"><a href="#methodology">Methodology</a><a href="#sources">Sources</a><a href="mailto:hello@civiclens.in">Contact</a></div></footer>
      </div>
    </section>
  </main>;
}
