'use client';

import { useState, useTransition } from 'react';
import { Bookmark } from 'lucide-react';
import { toggleBookmark } from '@/app/actions';

export function BookmarkButton({ promiseId, initiallySaved, signedIn }: { promiseId: string; initiallySaved: boolean; signedIn: boolean }) {
  const [saved, setSaved] = useState(initiallySaved);
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (!signedIn) {
      window.location.href = `/sign-in?next=${encodeURIComponent(`/promises/${promiseId}`)}`;
      return;
    }
    const next = !saved;
    startTransition(async () => {
      const result = await toggleBookmark(promiseId, next);
      setMessage(result.message);
      if (result.ok) setSaved(next);
    });
  }

  return <div className="bookmark-control"><button className={`bookmark-button${saved ? ' is-saved' : ''}`} type="button" onClick={toggle} disabled={pending} aria-pressed={saved}><Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />{pending ? 'Saving…' : saved ? 'Saved' : 'Save commitment'}</button>{message && <span role="status" className="bookmark-message">{message}</span>}</div>;
}
