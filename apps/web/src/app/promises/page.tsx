import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, FileCheck2, Search, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { WorkspaceShell } from '@/components/workspace-shell';

const statusLabel: Record<string, string> = {
  not_assessed: 'Not assessed', not_started: 'Not started', in_progress: 'In progress',
  fulfilled: 'Fulfilled', partially_fulfilled: 'Partially fulfilled', not_fulfilled: 'Not fulfilled', disputed: 'Disputed',
};

export default async function PromisesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const params = await searchParams;
  const q = (params.q ?? '').trim();
  const status = params.status ?? '';
  const supabase = await createClient();
  let promises: any[] = [];
  let errorMessage = '';

  if (supabase) {
    let query = supabase.from('promises')
      .select('id,title,description,category,target_date,status,manifestos(title,political_parties(name),elections(jurisdictions(name)))')
      .eq('visibility', 'published').order('created_at', { ascending: false }).limit(100);
    if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`);
    if (status) query = query.eq('status', status as never);
    const result = await query;
    promises = result.data ?? [];
    errorMessage = result.error?.message ?? '';
  }

  return <WorkspaceShell active="promises"><main className="records-page">
    <header className="records-top"><Link href="/" className="back-link"><ArrowLeft size={15}/> CivicLens</Link><span className="records-label">PUBLIC COMMITMENT REGISTER</span></header>
    <section className="records-content">
      <div className="records-eyebrow"><span/> PROMISE TRACKER · INDIA</div>
      <div className="records-title-row"><div><h1>Commitments,<br/><em>on the record.</em></h1><p>Browse published public commitments and inspect the source material behind each assessment.</p></div><div className="records-count"><strong>{promises.length}</strong><span>VISIBLE RECORDS</span></div></div>
      <form className="records-filters" action="/promises"><label className="records-search"><Search size={16}/><input name="q" defaultValue={q} placeholder="Search commitments, topics or keywords"/></label><select name="status" defaultValue={status} aria-label="Filter by assessment status"><option value="">All statuses</option>{Object.entries(statusLabel).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><button type="submit">Apply filters</button></form>
      {errorMessage ? <div className="empty-state"><strong>We couldn’t load the public register.</strong><p>{errorMessage}</p></div> : promises.length ? <div className="record-list">{promises.map((item) => {
        const manifesto = Array.isArray(item.manifestos) ? item.manifestos[0] : item.manifestos;
        const party = Array.isArray(manifesto?.political_parties) ? manifesto?.political_parties[0] : manifesto?.political_parties;
        const election = Array.isArray(manifesto?.elections) ? manifesto?.elections[0] : manifesto?.elections;
        const jurisdiction = Array.isArray(election?.jurisdictions) ? election?.jurisdictions[0] : election?.jurisdictions;
        return <Link href={`/promises/${item.id}`} className="record-card" key={item.id}><div className="record-card-main"><span className="record-category">{item.category}</span><h2>{item.title}</h2><p>{item.description}</p><div className="record-meta"><span>{jurisdiction?.name ?? 'India'}</span><span>{party?.name ?? 'Party not specified'}</span><span>{manifesto?.title ?? 'Manifesto record'}</span></div></div><div className="record-card-side"><span className={`status-pill ${item.status === 'fulfilled' ? 'progress' : item.status === 'not_assessed' ? 'pending' : 'review'}`}><i/>{statusLabel[item.status] ?? item.status}</span><ArrowUpRight size={17}/></div></Link>;
      })}</div> : <div className="empty-state"><span className="empty-icon"><FileCheck2 size={21}/></span><h2>No published commitments yet.</h2><p>{q || status ? 'Try changing your search or status filter.' : 'The public register is ready for verified records. No draft or unpublished commitments are shown here.'}</p><Link href="/" className="text-link">Back to overview <ArrowUpRight size={14}/></Link></div>}
      <p className="records-integrity"><ShieldCheck size={14}/> Only records explicitly marked as published are displayed. Assessments are not inferred from incomplete data.</p>
    </section>
  </main></WorkspaceShell>;
}
