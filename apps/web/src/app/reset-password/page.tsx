'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ArrowLeft, Globe2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (password.length < 8) {
      setError('Use at least 8 characters for your new password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setError('Authentication is not connected. Please contact the CivicLens administrator.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage('Your password has been updated. You can now sign in.');
    setPassword('');
    setConfirmPassword('');
  }

  return (
    <main className="auth-shell">
      <aside className="auth-aside">
        <Link href="/" className="brand"><span className="brand-mark"><Globe2 size={19}/></span><span>Civic<span>Lens</span><small>PUBLIC ACCOUNTABILITY</small></span></Link>
        <div><span className="aside-index">SECURE YOUR ACCOUNT</span><h1>A fresh<br/><em>start.</em></h1><p>Choose a new password for your CivicLens account.</p></div>
        <span className="aside-index">CIVICLENS · INDIA</span>
      </aside>
      <section className="auth-content">
        <div className="auth-card">
          <span className="section-kicker">NEW PASSWORD</span>
          <h2>Reset your password</h2>
          <p>Choose a strong password with at least 8 characters.</p>
          {error && <div className="auth-alert">{error}</div>}
          {message && <div className="auth-notice">{message}</div>}
          <form onSubmit={submit}>
            <div className="field"><label htmlFor="password">New password</label><input id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters"/></div>
            <div className="field"><label htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Enter it again"/></div>
            <button className="primary-button" disabled={loading}>{loading ? 'Updating…' : 'Update password'}</button>
          </form>
          <Link href="/sign-in" className="auth-back"><ArrowLeft size={14}/> Back to sign in</Link>
        </div>
      </section>
    </main>
  );
}
