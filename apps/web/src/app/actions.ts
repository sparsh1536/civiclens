'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signOut() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect('/');
}

export async function toggleBookmark(promiseId: string, shouldSave: boolean) {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: 'Authentication is not configured.' };
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false, message: 'Sign in to save commitments.' };

  if (shouldSave) {
    const { error } = await supabase.from('user_bookmarks').insert({ user_id: user.id, promise_id: promiseId });
    if (error && error.code !== '23505') return { ok: false, message: error.message };
  } else {
    const { error } = await supabase.from('user_bookmarks').delete().eq('user_id', user.id).eq('promise_id', promiseId);
    if (error) return { ok: false, message: error.message };
  }
  revalidatePath('/');
  revalidatePath('/promises');
  revalidatePath(`/promises/${promiseId}`);
  return { ok: true, message: shouldSave ? 'Saved to your research.' : 'Removed from saved research.' };
}

const value = (formData: FormData, key: string) => String(formData.get(key) ?? '').trim();
const nullable = (formData: FormData, key: string) => value(formData, key) || null;

export async function createCommitmentDraft(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect('/sign-in?next=%2Feditor%2Fnew');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in?next=%2Feditor%2Fnew');

  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  if (!roles?.some((item: { role: string }) => item.role === 'editor' || item.role === 'admin')) redirect('/editor?error=access');

  const required = ['jurisdiction_id','party_name','election_type','election_date','manifesto_title','manifesto_url','promise_title','promise_description','category','evidence_title','evidence_publisher','evidence_type','evidence_url'];
  if (required.some((key) => !value(formData, key))) redirect('/editor/new?error=required');

  const urlFields = ['manifesto_url','evidence_url'];
  for (const key of urlFields) {
    try {
      const url = new URL(value(formData, key));
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol');
    } catch {
      redirect('/editor/new?error=url');
    }
  }

  const partyName = value(formData, 'party_name');
  const partyAbbreviation = nullable(formData, 'party_abbreviation');
  let partyQuery = supabase.from('political_parties').select('id').eq('name', partyName);
  partyQuery = partyAbbreviation ? partyQuery.eq('abbreviation', partyAbbreviation) : partyQuery.is('abbreviation', null);
  let { data: party, error: partyLookupError } = await partyQuery.maybeSingle();
  if (partyLookupError) redirect('/editor/new?error=party');
  if (!party) {
    const inserted = await supabase.from('political_parties')
      .insert({ name: partyName, abbreviation: partyAbbreviation }).select('id').single();
    if (inserted.error || !inserted.data) redirect('/editor/new?error=party');
    party = inserted.data;
  }

  const electionType = value(formData, 'election_type');
  const electionDate = value(formData, 'election_date');
  let { data: election, error: electionLookupError } = await supabase.from('elections')
    .select('id').eq('jurisdiction_id', value(formData, 'jurisdiction_id'))
    .eq('election_type', electionType).eq('election_date', electionDate).maybeSingle();
  if (electionLookupError) redirect('/editor/new?error=election');
  if (!election) {
    const inserted = await supabase.from('elections').insert({
      jurisdiction_id: value(formData, 'jurisdiction_id'), election_type: electionType,
      election_date: electionDate, term_label: nullable(formData, 'term_label'), visibility: 'draft',
    }).select('id').single();
    if (inserted.error || !inserted.data) redirect('/editor/new?error=election');
    election = inserted.data;
  }

  let { data: manifesto, error: manifestoLookupError } = await supabase.from('manifestos')
    .select('id').eq('election_id', election.id).eq('party_id', party.id).eq('language_code', 'en').maybeSingle();
  if (manifestoLookupError) redirect('/editor/new?error=manifesto');
  if (!manifesto) {
    const inserted = await supabase.from('manifestos').insert({
      election_id: election.id, party_id: party.id, title: value(formData, 'manifesto_title'),
      document_url: value(formData, 'manifesto_url'), language_code: 'en', visibility: 'draft',
    }).select('id').single();
    if (inserted.error || !inserted.data) redirect('/editor/new?error=manifesto');
    manifesto = inserted.data;
  }

  const promiseResult = await supabase.from('promises').insert({
    manifesto_id: manifesto.id, title: value(formData, 'promise_title'),
    description: value(formData, 'promise_description'), category: value(formData, 'category'),
    target_group: nullable(formData, 'target_group'), target_date: nullable(formData, 'target_date'),
    visibility: 'draft', status: 'not_assessed',
  }).select('id').single();
  if (promiseResult.error || !promiseResult.data) redirect('/editor/new?error=promise');

  const evidenceResult = await supabase.from('evidence').insert({
    title: value(formData, 'evidence_title'), publisher: value(formData, 'evidence_publisher'),
    source_type: value(formData, 'evidence_type'), source_url: value(formData, 'evidence_url'),
    published_at: nullable(formData, 'evidence_published_at'), summary: nullable(formData, 'evidence_summary'),
    visibility: 'draft', submitted_by: user.id,
  }).select('id').single();
  if (evidenceResult.error || !evidenceResult.data) redirect(`/editor/new?error=evidence&created=${promiseResult.data.id}`);

  const linkResult = await supabase.from('promise_evidence').insert({
    promise_id: promiseResult.data.id, evidence_id: evidenceResult.data.id,
    relationship: 'source', notes: 'Initial source captured with the commitment draft.',
  });
  if (linkResult.error) redirect(`/editor/new?error=link&created=${promiseResult.data.id}`);

  revalidatePath('/editor');
  revalidatePath('/');
  redirect(`/editor?created=${promiseResult.data.id}`);
}

export async function createAssessmentDraft(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect('/sign-in?next=%2Feditor%2Freview');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in?next=%2Feditor%2Freview');
  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  if (!roles?.some((item: { role: string }) => ['researcher', 'editor', 'admin'].includes(item.role))) redirect('/editor?error=access');

  const promiseId = value(formData, 'promise_id');
  const rationale = value(formData, 'rationale');
  const status = value(formData, 'status');
  const confidenceRaw = value(formData, 'confidence');
  const methodologyVersion = value(formData, 'methodology_version') || '1.0';
  const allowedStatuses = ['in_progress', 'fulfilled', 'partially_fulfilled', 'not_fulfilled', 'disputed', 'insufficient_evidence'];
  if (!promiseId || rationale.length < 80 || !allowedStatuses.includes(status)) redirect(`/editor/promises/${promiseId}?error=required`);
  const confidence = confidenceRaw ? Number(confidenceRaw) : null;
  if (confidence !== null && (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)) redirect(`/editor/promises/${promiseId}?error=confidence`);

  const { data: promise } = await supabase.from('promises').select('id,visibility').eq('id', promiseId).maybeSingle();
  if (!promise || promise.visibility !== 'draft') redirect('/editor?error=promise');
  const evidenceIds = formData.getAll('evidence_ids').map(String).filter(Boolean);
  if (!evidenceIds.length) redirect(`/editor/promises/${promiseId}?error=evidence_required`);

  const supersedesId = value(formData, 'supersedes_id');
  let validSupersedesId: string | null = null;
  if (supersedesId) {
    const { data: prior } = await supabase.from('assessments').select('id').eq('id', supersedesId).eq('promise_id', promiseId).eq('created_by', user.id).eq('review_state', 'changes_requested').maybeSingle();
    if (!prior) redirect(`/editor/promises/${promiseId}?error=revision`);
    validSupersedesId = prior.id;
  }
  const created = await supabase.from('assessments').insert({
    promise_id: promiseId, status, rationale, confidence, methodology_version: methodologyVersion,
    visibility: 'draft', review_state: 'draft', created_by: user.id, supersedes_id: validSupersedesId,
  }).select('id').single();
  if (created.error || !created.data) redirect(`/editor/promises/${promiseId}?error=assessment`);

  if (evidenceIds.length) {
    const linked = await supabase.from('assessment_evidence').insert(evidenceIds.map((evidenceId) => ({
      assessment_id: created.data.id, evidence_id: evidenceId,
      supports_assessment: true, explanation: 'Evidence reviewed in support of this assessment.',
    })));
    if (linked.error) redirect(`/editor/promises/${promiseId}?error=evidence_link&assessment=${created.data.id}`);
  }
  revalidatePath(`/editor/promises/${promiseId}`);
  redirect(`/editor/promises/${promiseId}?created=${created.data.id}`);
}

export async function submitAssessmentForReview(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect('/sign-in');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');
  const assessmentId = value(formData, 'assessment_id');
  const promiseId = value(formData, 'promise_id');
  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  if (!roles?.some((item: { role: string }) => ['researcher', 'editor', 'admin'].includes(item.role))) redirect('/editor?error=access');
  const { error } = await supabase.from('assessments').update({
    review_state: 'in_review',
  }).eq('id', assessmentId).eq('created_by', user.id).eq('visibility', 'draft').eq('review_state', 'draft');
  if (error) redirect(`/editor/promises/${promiseId}?error=submit`);
  revalidatePath('/editor/review');
  revalidatePath(`/editor/promises/${promiseId}`);
  redirect(`/editor/promises/${promiseId}?submitted=${assessmentId}`);
}

export async function decideAssessment(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect('/sign-in');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');
  const assessmentId = value(formData, 'assessment_id');
  const decision = value(formData, 'decision');
  const reviewNotes = value(formData, 'review_notes');
  if (!['publish', 'changes_requested'].includes(decision) || reviewNotes.length < 30) redirect(`/editor/review/${assessmentId}?error=required`);
  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  if (!roles?.some((item: { role: string }) => item.role === 'editor' || item.role === 'admin')) redirect('/editor?error=access');
  const update = await supabase.from('assessments').update({
    review_state: decision === 'publish' ? 'published' : 'changes_requested',
    visibility: decision === 'publish' ? 'published' : 'draft',
    reviewed_by: user.id, review_notes: reviewNotes,
  }).eq('id', assessmentId).eq('review_state', 'in_review').eq('visibility', 'draft');
  if (update.error) redirect(`/editor/review/${assessmentId}?error=review`);
  revalidatePath('/editor/review');
  revalidatePath('/promises');
  redirect('/editor/review?updated=1');
}

export async function publishCommitmentBundle(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect('/sign-in');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');
  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  if (!roles?.some((item: { role: string }) => item.role === 'admin')) redirect('/editor?error=access');
  const promiseId = value(formData, 'promise_id');
  const { error } = await supabase.rpc('publish_commitment_bundle', { p_promise_id: promiseId });
  if (error) redirect(`/editor/publication?error=publish`);
  revalidatePath('/editor');
  revalidatePath('/editor/publication');
  revalidatePath('/promises');
  revalidatePath('/');
  redirect('/editor/publication?published=1');
}
