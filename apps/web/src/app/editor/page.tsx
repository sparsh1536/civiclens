import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, FilePlus2, FileText, ShieldCheck, ClipboardList } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function EditorPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  if (!supabase) redirect('/sign-in?next=%2Feditor');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in?next=%2Feditor');
  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  const role = roles?.find((item: { role: string }) => ['admin','editor','researcher'].includes(item.role))?.role;

  if (!role) return <main className="editor-page"><header className="records-top"><Link href="/" className="back-link"><ArrowLeft size={15}/> CivicLens</Link><span className="records-label">EDITORIAL WORKSPACE</span></header><section className="editor-content"><div className="records-eyebrow"><span/> ACCESS CONTROL</div><h1>Editorial access<br/><em>not assigned.</em></h1><p className="editor-lede">Your account is signed in, but it has no researcher/editor role. Public browsing and bookmarks remain available; draft creation is restricted to approved editors.</p><div className="editor-notice"><ShieldCheck size={19}/><div><strong>Role-based publishing controls are active.</strong><p>The first administrator must be provisioned out-of-band after account creation. No public signup can grant itself editorial privileges.</p></div></div><div className="editor-steps"><span>01</span><div><strong>Account identity</strong><p>{user.email}</p></div></div><div className="editor-steps"><span>02</span><div><strong>Required role</strong><p>editor or admin</p></div></div><Link href="/" className="text-link">Return to public dashboard <ArrowUpRight size={14}/></Link></section></main>;

  const [{ count: draftCount }, { data: drafts }, { count: publishedCount }] = await Promise.all([
    supabase.from('promises').select('*', { count: 'exact', head: true }).eq('visibility', 'draft'),
    supabase.from('promises').select('id,title,category,created_at,manifestos(title)').eq('visibility', 'draft').order('created_at', { ascending: false }).limit(20),
    supabase.from('promises').select('*', { count: 'exact', head: true }).eq('visibility', 'published'),
  ]);
  return <main className="editor-page"><header className="records-top"><Link href="/" className="back-link"><ArrowLeft size={15}/> CivicLens</Link><span className="records-label">EDITORIAL WORKSPACE · {role.toUpperCase()}</span></header><section className="editor-content"><div className="records-eyebrow"><span/> RESEARCH & REVIEW</div><div className="editor-title-row"><div><h1>The editorial<br/><em>desk.</em></h1><p className="editor-lede">Capture commitments with their manifesto context and primary source trail. Drafts stay private until reviewed and published.</p></div><div className="editor-actions">{role !== 'researcher' && <Link href="/editor/review" className="editor-secondary">Review queue <ArrowUpRight size={14}/></Link>}{role === 'admin' && <Link href="/editor/publication" className="editor-secondary">Publication gate <ArrowUpRight size={14}/></Link>}{role !== 'researcher' && <Link href="/editor/new" className="editor-primary"><FilePlus2 size={16}/> New commitment</Link>}</div></div>
    {params.created && <div className="editor-success"><ShieldCheck size={17}/> Draft created. Record ID: <code>{params.created}</code></div>}
    {params.error === 'access' && <div className="editor-error">Your account does not have editorial permissions.</div>}
    <div className="editor-stats"><article><span>DRAFT COMMITMENTS</span><strong>{draftCount ?? 0}</strong></article><article><span>PUBLISHED COMMITMENTS</span><strong>{publishedCount ?? 0}</strong></article><article><span>YOUR ROLE</span><strong>{role}</strong></article></div>
    <div className="editor-section-heading"><div><span className="section-kicker">WORK QUEUE</span><h2>Draft commitments</h2></div><span>{drafts?.length ?? 0} shown</span></div>
    {drafts?.length ? <div className="editor-draft-list">{drafts.map((item: any) => { const manifesto = Array.isArray(item.manifestos) ? item.manifestos[0] : item.manifestos; return <Link href={`/editor/promises/${item.id}`} className="editor-draft" key={item.id}><span className="draft-icon"><FileText size={17}/></span><div><span className="record-category">{item.category}</span><h3>{item.title}</h3><p>{manifesto?.title ?? 'Manifesto'} · Saved {new Date(item.created_at).toLocaleDateString('en-IN')}</p></div><span className="draft-state">DRAFT</span><ArrowUpRight size={15}/></Link>; })}</div> : <div className="empty-state"><span className="empty-icon"><ClipboardList size={20}/></span><h2>No drafts in the queue.</h2><p>Start by recording a manifesto commitment and attach its first source.</p>{role !== 'researcher' && <Link href="/editor/new" className="text-link">Create a draft <ArrowUpRight size={14}/></Link>}</div>}
    <div className="editor-footnote"><ShieldCheck size={15}/> Published assessments remain source-linked and versioned. This workspace does not generate political verdicts or progress scores.</div>
  </section></main>;
}
