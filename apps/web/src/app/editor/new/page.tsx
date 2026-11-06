import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, FilePlus2, ShieldCheck } from 'lucide-react';
import { createCommitmentDraft } from '@/app/actions';
import { createClient } from '@/lib/supabase/server';

const errors: Record<string,string> = {
  required: 'Complete all required fields before saving.', url: 'Use valid HTTP or HTTPS links for source documents.',
  party: 'Could not find or create the political party record.', election: 'Could not find or create the election record.',
  manifesto: 'Could not find or create the manifesto record.', promise: 'Could not save the commitment draft.',
  evidence: 'The commitment was saved, but the evidence record could not be created.',
  link: 'The commitment and evidence were saved, but the source link failed. Please attach it from the draft editor.',
};

export default async function NewCommitmentPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  if (!supabase) redirect('/sign-in?next=%2Feditor%2Fnew');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in?next=%2Feditor%2Fnew');
  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  if (!roles?.some((item: { role: string }) => item.role === 'editor' || item.role === 'admin')) redirect('/editor?error=access');
  const { data: jurisdictions } = await supabase.from('jurisdictions').select('id,name,level').order('level').order('name');

  return <main className="editor-page"><header className="records-top"><Link href="/editor" className="back-link"><ArrowLeft size={15}/> Editorial desk</Link><span className="records-label">NEW COMMITMENT · DRAFT</span></header><section className="editor-content"><div className="records-eyebrow"><span/> STRUCTURED INTAKE</div><h1>Put it on<br/><em>the record.</em></h1><p className="editor-lede">Create a commitment together with its election, manifesto and initial evidence source. Everything is saved as a private draft.</p>
    {params.error && <div className="editor-error">{errors[params.error] ?? 'Something went wrong while saving this draft.'} {params.created && <span>Partial record ID: {params.created}</span>}</div>}
    <form action={createCommitmentDraft} className="editor-form">
      <div className="form-section-title"><span>01</span><div><h2>Jurisdiction & election</h2><p>Identify the government level and electoral context.</p></div></div>
      <div className="form-grid"><label>Jurisdiction *<select name="jurisdiction_id" required defaultValue=""><option value="" disabled>Select jurisdiction</option>{jurisdictions?.map((item: { id: string; name: string; level: string }) => <option value={item.id} key={item.id}>{item.name} · {item.level}</option>)}</select></label><label>Election type *<select name="election_type" required defaultValue=""><option value="" disabled>Select type</option><option value="Lok Sabha">Lok Sabha</option><option value="State Legislative Assembly">State Legislative Assembly</option><option value="By-election">By-election</option><option value="Other">Other</option></select></label><label>Election date *<input type="date" name="election_date" required/></label><label>Term / cycle label<input name="term_label" placeholder="e.g. 2024–2029"/></label></div>
      <div className="form-section-title"><span>02</span><div><h2>Party & manifesto</h2><p>Record the original document, not a paraphrase.</p></div></div>
      <div className="form-grid"><label>Political party *<input name="party_name" required placeholder="Official party name"/></label><label>Abbreviation<input name="party_abbreviation" placeholder="e.g. ABC"/></label><label className="form-span">Manifesto title *<input name="manifesto_title" required placeholder="Official manifesto / election document title"/></label><label className="form-span">Manifesto document URL *<input type="url" name="manifesto_url" required placeholder="https://..."/></label></div>
      <div className="form-section-title"><span>03</span><div><h2>Public commitment</h2><p>Capture the promise as stated. Keep interpretation separate from the original claim.</p></div></div>
      <div className="form-grid"><label className="form-span">Commitment title *<input name="promise_title" required placeholder="A concise, faithful description"/></label><label className="form-span">Description *<textarea name="promise_description" required rows={4} placeholder="Record the commitment in context. Include relevant qualifiers or target conditions."/></label><label>Category *<select name="category" required defaultValue=""><option value="" disabled>Select category</option>{['Economy','Employment','Education','Healthcare','Agriculture','Infrastructure','Environment','Social welfare','Governance','National security','Other'].map((x)=><option key={x}>{x}</option>)}</select></label><label>Target group<input name="target_group" placeholder="e.g. rural households"/></label><label>Target date<input type="date" name="target_date"/></label></div>
      <div className="form-section-title"><span>04</span><div><h2>Initial evidence source</h2><p>Attach at least one verifiable source to establish provenance.</p></div></div>
      <div className="form-grid"><label>Source title *<input name="evidence_title" required placeholder="Document, report or dataset title"/></label><label>Publisher *<input name="evidence_publisher" required placeholder="Issuing institution"/></label><label>Source type *<select name="evidence_type" required defaultValue="government_document"><option value="government_document">Government document</option><option value="official_dataset">Official dataset</option><option value="parliament_record">Parliament record</option><option value="audit_report">Audit report</option><option value="court_record">Court record</option><option value="research_paper">Research paper</option><option value="news_report">News report</option><option value="other">Other</option></select></label><label>Publication date<input type="date" name="evidence_published_at"/></label><label className="form-span">Source URL *<input type="url" name="evidence_url" required placeholder="https://..."/></label><label className="form-span">Research note<textarea name="evidence_summary" rows={3} placeholder="What does this source establish? Note limitations; do not infer performance."/></label></div>
      <div className="editor-form-footer"><p><ShieldCheck size={15}/> Saved as draft. Nothing becomes public until an administrator reviews and publishes it.</p><button type="submit"><FilePlus2 size={16}/> Save commitment draft</button></div>
    </form></section></main>;
}
