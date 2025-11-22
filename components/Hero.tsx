import { getTranslations } from 'next-intl/server';
import styles from './hero.module.css';

async function Hero() {
  const t = await getTranslations('Hero');

  const supportCards = [
    {
      title: t('cards.verifiedTitle'),
      desc: t('cards.verifiedDesc'),
    },
    {
      title: t('cards.peerTitle'),
      desc: t('cards.peerDesc'),
    },
    {
      title: t('cards.readyTitle'),
      desc: t('cards.readyDesc'),
    },
  ];

  return (
    <section className="container hero-shell">
      <div className="glass hero-grid">
        <div className="stack">
          <div className="section-title">
            <span />
            <p className={styles.sectionLabel}>{t('sectionLabel')}</p>
          </div>
          <h1 className="title-lg">{t('title')}</h1>
          <p className="hero-lead section-note">{t('lead')}</p>
          <div className="hero-actions">
            <a href="#catalogue" className="primary-btn">
              {t('primaryCta')}
            </a>
            <a href="#collaboration" className="secondary-btn">
              {t('secondaryCta')}
            </a>
          </div>
        </div>
        <div className="hero-support">
          {supportCards.map((item) => (
            <div key={item.title} className="glass panel support-card">
              <p className={styles.cardTitle}>{item.title}</p>
              <p className={`body-text ${styles.cardBody}`}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Hero;
