import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, FileText, ShieldCheck } from 'lucide-react';
import { createAssessmentDraft, submitAssessmentForReview } from '@/app/actions';
import { createClient } from '@/lib/supabase/server';

const verdicts = [
  ['in_progress','In progress'],['fulfilled','Fulfilled'],['partially_fulfilled','Partially fulfilled'],
  ['not_fulfilled','Not fulfilled'],['disputed','Disputed'],['insufficient_evidence','Insufficient evidence'],
];
const reviewLabel: Record<string,string> = { draft:'Draft', in_review:'Awaiting independent review', changes_requested:'Changes requested', published:'Published' };

export default async function EditorialPromisePage({ params, searchParams }: { params: Promise<{id:string}>; searchParams: Promise<{error?:string;created?:string;submitted?:string}> }) {
  const { id } = await params; const query = await searchParams;
  const supabase = await createClient();
  if (!supabase) redirect('/sign-in');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in?next='+encodeURIComponent(`/editor/promises/${id}`));
  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id',user.id);
  if (!roles?.some((r:{role:string})=>['researcher','editor','admin'].includes(r.role))) redirect('/editor?error=access');
  const [{data:promise},{data:links},{data:assessments}] = await Promise.all([
    supabase.from('promises').select('id,title,description,category,visibility,manifestos(title,political_parties(name),elections(jurisdictions(name)))').eq('id',id).eq('visibility','draft').maybeSingle(),
    supabase.from('promise_evidence').select('evidence(id,title,publisher,source_type,source_url,visibility,submitted_by)').eq('promise_id',id),
    supabase.from('assessments').select('id,status,rationale,confidence,methodology_version,review_state,review_notes,created_by,created_at,supersedes_id,assessment_evidence(evidence_id)').eq('promise_id',id).order('created_at',{ascending:false}),
  ]);
  if (!promise) notFound();
  const sources = (links ?? []).map((x:any)=>Array.isArray(x.evidence)?x.evidence[0]:x.evidence).filter(Boolean);
  const mine = (assessments ?? []).filter((a:any)=>a.created_by===user.id);
  const revision = mine.find((a:any)=>a.review_state==='changes_requested' && !mine.some((b:any)=>b.supersedes_id===a.id));
  const manifesto = Array.isArray(promise.manifestos)?promise.manifestos[0]:promise.manifestos;
  const party = Array.isArray(manifesto?.political_parties)?manifesto?.political_parties[0]:manifesto?.political_parties;
  const election = Array.isArray(manifesto?.elections)?manifesto?.elections[0]:manifesto?.elections;
  const jurisdiction = Array.isArray(election?.jurisdictions)?election?.jurisdictions[0]:election?.jurisdictions;
  const canDraft = roles?.some((r:{role:string})=>['researcher','editor','admin'].includes(r.role));
  return <main className="editor-page"><header className="records-top"><Link href="/editor" className="back-link"><ArrowLeft size={15}/> Editorial desk</Link><span className="records-label">COMMITMENT FILE</span></header><section className="editor-content">
    <div className="records-eyebrow"><span/> {jurisdiction?.name ?? 'India'} · {promise.category}</div><h1>{promise.title}</h1><p className="editor-lede">{promise.description}</p>
    <div className="editor-notice"><ShieldCheck size={18}/><div><strong>{party?.name ?? 'Party'} · {manifesto?.title ?? 'Manifesto'}</strong><p>Draft record · Source-linked research · Not visible to the public</p></div></div>
    {query.error && <div className="editor-error">{query.error==='required'?'A rationale of at least 80 characters and a valid assessment status are required.':query.error==='confidence'?'Confidence must be between 0 and 1.':query.error==='evidence_required'?'Select at least one linked evidence source.':query.error==='revision'?'The assessment selected for revision is no longer available.':query.error==='submit'?'Could not submit this assessment. It may already have changed.':'The assessment could not be saved.'}</div>}
    {query.created && <div className="editor-success">Assessment draft created. You can submit it for independent review below.</div>}
    {query.submitted && <div className="editor-success">Assessment submitted to the independent review queue.</div>}
    <div className="editor-section-heading"><div><span className="section-kicker">SOURCE RECORD</span><h2>Evidence attached to this commitment</h2></div><span>{sources.length} sources</span></div>
    <div className="review-evidence-grid">{sources.map((source:any)=><article className="review-evidence" key={source.id}><span className="evidence-type">{source.source_type.replaceAll('_',' ')} · {source.visibility}</span><h3>{source.title}</h3><p>{source.publisher}</p><a href={source.source_url} target="_blank" rel="noreferrer">Open source <ArrowUpRight size={13}/></a></article>)}</div>
    <div className="editor-section-heading"><div><span className="section-kicker">ASSESSMENT HISTORY</span><h2>Research drafts & decisions</h2></div><span>{assessments?.length ?? 0} total</span></div>
    <div className="editor-assessment-list">{assessments?.length ? assessments.map((a:any)=><article className="editor-assessment" key={a.id}><div><span className="draft-state">{reviewLabel[a.review_state] ?? a.review_state}</span><h3>{a.status.replaceAll('_',' ')}</h3><p>{a.rationale}</p><small>Methodology {a.methodology_version} · {new Date(a.created_at).toLocaleDateString('en-IN')}</small>{a.review_notes && <blockquote>{a.review_notes}</blockquote>}{a.supersedes_id && <small>Supersedes assessment {a.supersedes_id.slice(0,8)}</small>}</div>{a.created_by===user.id && a.review_state==='draft' && <form action={submitAssessmentForReview}><input type="hidden" name="assessment_id" value={a.id}/><input type="hidden" name="promise_id" value={id}/><button type="submit" className="editor-secondary">Submit for review</button></form>}</article>) : <div className="empty-state"><FileText size={20}/><h2>No assessment drafts yet.</h2><p>Start with the evidence. A status is a conclusion, not a substitute for the reasoning.</p></div>}</div>
    {canDraft && <form action={createAssessmentDraft} className="editor-form"><div className="form-section-title"><span>05</span><div><h2>{revision ? 'Revise the assessment' : 'Prepare an evidence-based assessment'}</h2><p>{revision ? 'A reviewer requested changes. This creates a new version and preserves the previous review decision.' : 'Choose a provisional status and explain the basis. A separate editor must review it before publication.'}</p></div></div><input type="hidden" name="promise_id" value={id}/>{revision && <input type="hidden" name="supersedes_id" value={revision.id}/>}<div className="form-grid"><label>Provisional assessment *<select name="status" required defaultValue={revision?.status ?? 'insufficient_evidence'}>{verdicts.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label><label>Confidence (0–1)<input type="number" name="confidence" min="0" max="1" step="0.05" placeholder="Leave blank if not assessed" defaultValue={revision?.confidence ?? ''}/></label><label>Methodology version *<input name="methodology_version" defaultValue={revision?.methodology_version ?? '1.0'} required/></label><label className="form-span">Rationale *<textarea name="rationale" minLength={80} required rows={5} defaultValue={revision?.rationale ?? ''} placeholder="What does the evidence establish? What does it not establish? Address scope, time period, attribution, and limitations."/></label><fieldset className="form-span evidence-picker"><legend>Evidence considered</legend>{sources.length ? sources.map((source:any)=><label key={source.id}><input type="checkbox" name="evidence_ids" value={source.id} defaultChecked={source.visibility==='published'||source.submitted_by===user.id}/> <span><strong>{source.title}</strong><small>{source.publisher} · {source.visibility}</small></span></label>) : <p>No linked sources yet. Add evidence before preparing an assessment.</p>}</fieldset></div><div className="editor-form-footer"><p><ShieldCheck size={15}/> Saving creates a private draft. Submission sends it to a different editor for review.</p><button type="submit" disabled={!sources.length}>{revision ? 'Save revised assessment draft' : 'Save assessment draft'}</button></div></form>}
  </section></main>;
}
