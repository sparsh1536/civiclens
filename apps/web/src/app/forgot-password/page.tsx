'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ArrowLeft, Globe2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    const supabase = createClient();
    if (!supabase) {
      setError('Authentication is not connected. Please contact the CivicLens administrator.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage('If an account exists for this email, a password reset link has been sent. Check your inbox and spam folder.');
  }

  return (
    <main className="auth-shell">
      <aside className="auth-aside">
        <Link href="/" className="brand"><span className="brand-mark"><Globe2 size={19}/></span><span>Civic<span>Lens</span><small>PUBLIC ACCOUNTABILITY</small></span></Link>
        <div><span className="aside-index">ACCOUNT RECOVERY</span><h1>Back to the<br/><em>evidence.</em></h1><p>Reset your password securely and return to your research workspace.</p></div>
        <span className="aside-index">CIVICLENS · INDIA</span>
      </aside>
      <section className="auth-content">
        <div className="auth-card">
          <span className="section-kicker">ACCOUNT RECOVERY</span>
          <h2>Forgot your password?</h2>
          <p>Enter the email address associated with your CivicLens account. We’ll send a secure reset link.</p>
          {error && <div className="auth-alert">{error}</div>}
          {message && <div className="auth-notice">{message}</div>}
          <form onSubmit={submit}>
            <div className="field"><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/></div>
            <button className="primary-button" disabled={loading}>{loading ? 'Sending link…' : 'Send reset link'}</button>
          </form>
          <Link href="/sign-in" className="auth-back"><ArrowLeft size={14}/> Back to sign in</Link>
        </div>
      </section>
    </main>
  );
}
