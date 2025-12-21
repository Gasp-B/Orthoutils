import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/routing';

type ManagePageProps = {
  params: Promise<{ locale: string }>;
};

type TaskRow = {
  id: string;
  task: string;
  title: string;
  status: {
    label: string;
    className: string;
  };
  priority: {
    label: string;
    className: string;
  };
};

export async function generateMetadata({ params }: ManagePageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'TestsManageTasks' });

  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    metadataBase: new URL('https://othoutils.example.com'),
  };
}

export default async function ManageTestsPage({ params }: ManagePageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'TestsManageTasks' });

  const tasks: TaskRow[] = [
    {
      id: 'task-ux-audit',
      task: t('table.rows.uxAudit.task'),
      title: t('table.rows.uxAudit.title'),
      status: {
        label: t('status.inReview'),
        className: 'border border-amber-400/30 bg-amber-500/10 text-amber-200',
      },
      priority: {
        label: t('priority.high'),
        className: 'border border-rose-400/30 bg-rose-500/10 text-rose-200',
      },
    },
    {
      id: 'task-content-refresh',
      task: t('table.rows.contentRefresh.task'),
      title: t('table.rows.contentRefresh.title'),
      status: {
        label: t('status.inProgress'),
        className: 'border border-sky-400/30 bg-sky-500/10 text-sky-200',
      },
      priority: {
        label: t('priority.medium'),
        className: 'border border-violet-400/30 bg-violet-500/10 text-violet-200',
      },
    },
    {
      id: 'task-qa-review',
      task: t('table.rows.qaReview.task'),
      title: t('table.rows.qaReview.title'),
      status: {
        label: t('status.waiting'),
        className: 'border border-slate-400/30 bg-slate-500/10 text-slate-200',
      },
      priority: {
        label: t('priority.low'),
        className: 'border border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
      },
    },
  ];

  return (
    <main className="container section-shell">
      <section className="flex flex-col gap-8">
        <header className="glass panel flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-subtle">
              {t('eyebrow')}
            </p>
            <h1 className="text-3xl font-semibold text-white">{t('title')}</h1>
            <p className="text-base text-subtle">{t('subtitle')}</p>
          </div>
        </header>

        <div className="glass panel flex flex-wrap items-center gap-3">
          <button className="ui-button ui-button-sm ui-button-outline" type="button">
            {t('actions.filter')}
          </button>
          <button className="ui-button ui-button-sm ui-button-ghost" type="button">
            {t('actions.status')}
          </button>
          <button className="ui-button ui-button-sm ui-button-ghost" type="button">
            {t('actions.priority')}
          </button>
          <button className="ui-button ui-button-sm ui-button-ghost" type="button">
            {t('actions.view')}
          </button>
          <Link
            className="ui-button ui-button-sm sm:ml-auto"
            href={`/${locale}/administration/tests/create`}
          >
            {t('actions.primary')}
          </Link>
        </div>

        <div className="glass panel overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="px-6 py-4 font-semibold text-subtle">{t('table.columns.task')}</th>
                  <th className="px-6 py-4 font-semibold text-subtle">{t('table.columns.title')}</th>
                  <th className="px-6 py-4 font-semibold text-subtle">{t('table.columns.status')}</th>
                  <th className="px-6 py-4 font-semibold text-subtle">{t('table.columns.priority')}</th>
                  <th className="px-6 py-4 font-semibold text-subtle">{t('table.columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((row) => (
                  <tr key={row.id} className="border-b border-white/5 last:border-b-0">
                    <td className="px-6 py-5 font-semibold text-white">{row.task}</td>
                    <td className="px-6 py-5 text-subtle">{row.title}</td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${row.status.className}`}
                      >
                        {row.status.label}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${row.priority.className}`}
                      >
                        {row.priority.label}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                        <button className="ui-button ui-button-sm ui-button-ghost" type="button">
                          {t('table.actions.view')}
                        </button>
                        <button className="ui-button ui-button-sm ui-button-outline" type="button">
                          {t('table.actions.update')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
