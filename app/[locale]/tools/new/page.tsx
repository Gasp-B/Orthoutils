import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import ToolCreationForm from './ToolCreationForm';
import styles from './new-tool-page.module.css';

type PageParams = { params: { locale: string } };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'ToolsNew' });

  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
  };
}

async function NewToolPage({ params }: PageParams) {
  const t = await getTranslations({ locale: params.locale, namespace: 'ToolsNew' });

  return (
    <div className={`container section-shell ${styles.page}`}>
      <div className="section-title">
        <span />
        <p className={styles.sectionLabel}>{t('sectionLabel')}</p>
      </div>

      <div className={`glass panel ${styles.introPanel}`}>
        <p className={styles.introTitle}>{t('intro.title')}</p>
        <p className={`text-subtle ${styles.introText}`}>{t('intro.required')}</p>
        <p className={`text-subtle ${styles.introText}`}>
          {t.rich('intro.preview', {
            catalogLink: (chunks) => (
              <Link href={{ pathname: '/', hash: 'catalogue' }} className="top-banner__link">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>

      <ToolCreationForm />
    </div>
  );
}

export default NewToolPage;
