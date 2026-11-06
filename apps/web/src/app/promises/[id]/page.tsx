import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, ExternalLink, FileText, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { BookmarkButton } from '@/components/bookmark-button';

const statusLabel: Record<string, string> = {
  not_assessed: 'Not assessed', in_progress: 'In progress', fulfilled: 'Fulfilled',
  partially_fulfilled: 'Partially fulfilled', not_fulfilled: 'Not fulfilled', disputed: 'Disputed',
  insufficient_evidence: 'Insufficient evidence',
};

export default async function PromiseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) return <main className="records-page"><section className="records-content"><h1>Database not connected</h1><p>Configure the Supabase environment to view this record.</p></section></main>;

  const [{ data: promise }, { data: { user } }] = await Promise.all([
    supabase.from('promises').select('id,title,description,category,target_group,target_date,status,created_at,manifestos(title,document_url,political_parties(name),elections(election_date,jurisdictions(name)))').eq('id', id).eq('visibility', 'published').maybeSingle(),
    supabase.auth.getUser(),
  ]);
  if (!promise) notFound();

  const [{ data: evidenceLinks }, { data: assessments }, { data: bookmark }] = await Promise.all([
    supabase.from('promise_evidence').select('relationship,notes,evidence(id,title,publisher,source_type,source_url,archived_url,published_at,summary)').eq('promise_id', id),
    supabase.from('assessments').select('id,status,rationale,confidence,methodology_version,assessed_at,assessment_evidence(explanation,supports_assessment,evidence(title,source_url,publisher))').eq('promise_id', id).eq('visibility', 'published').order('assessed_at', { ascending: false }).limit(1),
    user ? supabase.from('user_bookmarks').select('id').eq('user_id', user.id).eq('promise_id', id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const manifesto = Array.isArray(promise.manifestos) ? promise.manifestos[0] : promise.manifestos;
  const party = Array.isArray(manifesto?.political_parties) ? manifesto?.political_parties[0] : manifesto?.political_parties;
  const election = Array.isArray(manifesto?.elections) ? manifesto?.elections[0] : manifesto?.elections;
  const jurisdiction = Array.isArray(election?.jurisdictions) ? election?.jurisdictions[0] : election?.jurisdictions;
  const assessment = assessments?.[0];

  return <main className="records-page"><header className="records-top"><Link href="/promises" className="back-link"><ArrowLeft size={15}/> Promise tracker</Link><span className="records-label">COMMITMENT RECORD</span></header><article className="detail-content">
    <div className="records-eyebrow"><span/> {jurisdiction?.name ?? 'India'} · {promise.category}</div>
    <div className="detail-heading"><div><span className={`status-pill ${promise.status === 'fulfilled' ? 'progress' : 'pending'}`}><i/>{statusLabel[promise.status] ?? promise.status}</span><h1>{promise.title}</h1><p>{promise.description}</p></div><BookmarkButton promiseId={promise.id} initiallySaved={Boolean(bookmark)} signedIn={Boolean(user)}/></div>
    <div className="detail-grid"><section className="detail-main"><div className="detail-section"><span className="section-kicker">THE COMMITMENT</span><h2>Original context</h2><dl className="detail-facts"><div><dt>Manifesto</dt><dd>{manifesto?.title ?? 'Not specified'}</dd></div><div><dt>Political party</dt><dd>{party?.name ?? 'Not specified'}</dd></div><div><dt>Jurisdiction</dt><dd>{jurisdiction?.name ?? 'India'}</dd></div><div><dt>Target date</dt><dd>{promise.target_date ?? 'No target date recorded'}</dd></div><div><dt>Target group</dt><dd>{promise.target_group ?? 'Not specified'}</dd></div></dl>{manifesto?.document_url && <a className="source-link" href={manifesto.document_url} target="_blank" rel="noreferrer">Open original manifesto <ExternalLink size={13}/></a>}</div>
      <div className="detail-section"><span className="section-kicker">ASSESSMENT</span><h2>What the evidence says.</h2>{assessment ? <><span className="assessment-status">{statusLabel[assessment.status] ?? assessment.status}</span><p className="assessment-rationale">{assessment.rationale}</p><div className="assessment-meta">Methodology {assessment.methodology_version} · Reviewed {new Date(assessment.assessed_at).toLocaleDateString('en-IN')}</div></> : <div className="empty-inline"><ShieldCheck size={17}/><p>No published assessment is available for this commitment yet. CivicLens will not infer progress without a documented review.</p></div>}</div>
      <div className="detail-section"><span className="section-kicker">SOURCE TRAIL</span><h2>Evidence and references.</h2>{evidenceLinks?.length ? <div className="evidence-list">{evidenceLinks.map((link: any, index: number) => { const evidence = Array.isArray(link.evidence) ? link.evidence[0] : link.evidence; if (!evidence) return null; return <div className="evidence-card" key={`${evidence.id}-${index}`}><span className="evidence-type">{evidence.source_type.replaceAll('_',' ')}</span><h3>{evidence.title}</h3><p>{evidence.publisher}{evidence.published_at ? ` · ${evidence.published_at}` : ''}</p>{evidence.summary && <p className="evidence-summary">{evidence.summary}</p>}<a className="source-link" href={evidence.source_url} target="_blank" rel="noreferrer">Open source <ArrowUpRight size={13}/></a>{evidence.archived_url && <a className="archive-link" href={evidence.archived_url} target="_blank" rel="noreferrer">Archived copy</a>}</div>;})}</div> : <div className="empty-inline"><FileText size={17}/><p>No evidence records have been published for this commitment yet.</p></div>}</div>
    </section><aside className="detail-aside"><span className="section-kicker">RESEARCH NOTE</span><h3>Evidence before opinion.</h3><p>Published assessments should explain their reasoning and link to verifiable sources. Absence of evidence is not proof of failure — and a stated target is not proof of delivery.</p><div className="aside-divider"/><span className="aside-index">RECORD IDENTIFIER</span><code>{promise.id}</code><Link href="/promises" className="aside-return">All commitments <ArrowUpRight size={13}/></Link></aside></div>
  </article></main>;
}
