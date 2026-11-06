import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Bookmark } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function SavedPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/sign-in');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in?next=%2Fsaved');
  const { data, error } = await supabase.from('user_bookmarks')
    .select('created_at,promises(id,title,description,category,status,manifestos(title))')
    .eq('user_id', user.id).order('created_at', { ascending: false });

  return <main className="records-page"><header className="records-top"><Link href="/" className="back-link"><ArrowLeft size={15}/> CivicLens</Link><span className="records-label">PERSONAL RESEARCH LIBRARY</span></header><section className="records-content"><div className="records-eyebrow"><span/> SAVED RESEARCH</div><div className="records-title-row"><div><h1>Your research,<br/><em>kept close.</em></h1><p>Commitments you have bookmarked for future reading and follow-up.</p></div><div className="records-count"><strong>{data?.length ?? 0}</strong><span>SAVED RECORDS</span></div></div>{error ? <div className="empty-state"><h2>Could not load saved research.</h2><p>{error.message}</p></div> : data?.length ? <div className="record-list">{data.map((row: any) => { const promise = Array.isArray(row.promises) ? row.promises[0] : row.promises; if (!promise) return null; const manifesto = Array.isArray(promise.manifestos) ? promise.manifestos[0] : promise.manifestos; return <Link href={`/promises/${promise.id}`} className="record-card" key={promise.id}><div className="record-card-main"><span className="record-category">{promise.category}</span><h2>{promise.title}</h2><p>{promise.description}</p><div className="record-meta"><span>{manifesto?.title ?? 'Manifesto record'}</span><span>Saved {new Date(row.created_at).toLocaleDateString('en-IN')}</span></div></div><div className="record-card-side"><Bookmark size={16} fill="currentColor"/><ArrowUpRight size={17}/></div></Link>; })}</div> : <div className="empty-state"><span className="empty-icon"><Bookmark size={20}/></span><h2>Your library is empty.</h2><p>Open any published commitment and select “Save commitment” to add it here.</p><Link href="/promises" className="text-link">Browse commitments <ArrowUpRight size={14}/></Link></div>}</section></main>;
}
