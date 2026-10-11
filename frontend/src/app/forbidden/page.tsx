import React from 'react';
import Link from 'next/link';

export default async function ForbiddenPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const raw = (await props.searchParams).path;
  const path = typeof raw === 'string' ? raw.slice(0, 80) : '';

  return (
    <div className="max-w-xl mx-auto py-24 text-center space-y-4">
      <h2 className="text-3xl font-bold text-white tracking-tight">Access restricted</h2>
      <p className="text-white/55 text-sm">
        Your role does not have access to {path ? <span className="font-mono text-white/75">{path}</span> : 'that page'}. Sign in with a
        different account, or go back to a page your role can use.
      </p>
      <Link href="/" className="inline-block rounded-xl border border-brand-teal bg-brand-teal/20 px-5 py-2 text-sm font-medium text-brand-teal">
        Back to home
      </Link>
    </div>
  );
}
