import React, { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, Bot, DatabaseZap, FileText, FlaskConical, TrendingUp } from 'lucide-react';
import { getGlobalSearch } from '@/app/actions/platformDb';
import { getDb } from '@/lib/analytics/cache';
import { getHeadlineKpis, type HeadlineKpis } from '@/lib/executiveSummary';
import { formatCount, formatPercent } from '@/lib/ml/modelArtifactViews';
import { GlobalSearch } from '@/components/platform/global-search';
import { Panel, Stat } from '@/components/model/Panel';

export const dynamic = 'force-dynamic';

const TOUR = [
  { step: 1, href: '/data-quality', title: 'Data Quality', icon: DatabaseZap, text: 'What the dataset contains, what is missing, what was excluded, and how every number traces back to the source file.' },
  { step: 2, href: '/research', title: 'Research & Statistics', icon: FlaskConical, text: 'A replication-style study of HbA1c testing and readmission, and a tool for testing differences between any two cohorts.' },
  { step: 3, href: '/predictive', title: 'Predictive Analytics', icon: TrendingUp, text: 'The 30-day readmission model: honest evaluation, what drives it, how it treats different groups, and a what-if calculator.' },
  { step: 4, href: '/assistant', title: 'Analytics Assistant', icon: Bot, text: 'Ask questions in plain English; every answer shows its validated SQL and is checked against the real result.' },
  { step: 5, href: '/report', title: 'Analysis Report', icon: FileText, text: 'One printable document assembling the findings above. Use Download PDF.' },
];

export default async function HomePage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const query = typeof searchParams.q === 'string' ? searchParams.q.slice(0, 100) : '';
  const results = await getGlobalSearch(query);

  let kpis: HeadlineKpis | null = null;
  try {
    kpis = getHeadlineKpis(getDb());
  } catch (error) {
    console.error('Failed to compute home KPIs:', error);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8">
      <header>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">MedOrch</h1>
        <p className="mt-3 text-lg text-white/55 max-w-3xl leading-relaxed">
          Healthcare analytics on historical, de-identified encounter data (UCI Diabetes 130-US Hospitals, 1999–2008). A
          teaching demonstration: not for clinical, billing or operational decisions.
        </p>
      </header>

      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Encounters" value={formatCount(kpis.encounters)} hint={`${formatCount(kpis.patients)} patients`} />
          <Stat label="30-day readmission" value={formatPercent(kpis.thirtyDayRate)} hint="readmitted = '<30'" />
          <Stat label="Any readmission" value={formatPercent(kpis.anyReadmissionRate)} hint="readmitted != 'NO'" />
          <Stat label="HbA1c tested" value={formatPercent(kpis.hba1cTestedShare)} hint="Share of encounters" />
        </div>
      )}

      <Panel title="Start here: a five-step tour" subtitle="The quickest way through the project, in the order that tells its story.">
        <ol className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {TOUR.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex h-full flex-col rounded-2xl border border-white/10 bg-black/30 p-5 transition-colors hover:border-brand-teal/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-teal/15 text-sm font-bold text-brand-teal">{item.step}</span>
                    <Icon className="h-5 w-5 text-white/50 group-hover:text-brand-teal" />
                    <span className="font-semibold text-white">{item.title}</span>
                  </div>
                  <p className="mt-3 flex-1 text-sm text-white/55">{item.text}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-teal">
                    Open <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </Panel>

      <Suspense fallback={null}>
        <GlobalSearch results={results} />
      </Suspense>
    </div>
  );
}
