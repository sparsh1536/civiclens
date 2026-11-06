import type { ReactNode } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';

export default function EditorialLayout({ children }: { children: ReactNode }) {
  return <WorkspaceShell active="editor">{children}</WorkspaceShell>;
}
