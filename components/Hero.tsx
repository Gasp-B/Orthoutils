import styles from './hero.module.css';

function Hero() {
  return (
    <section className="container hero-shell">
      <div className="glass hero-grid">
        <div className="stack">
          <div className="section-title">
            <span />
            <p className={styles.sectionLabel}>Référentiels conçus et validés par des orthophonistes</p>
          </div>
          <h1 className="title-lg">
            Une bibliothèque clinique pour consulter des outils éprouvés et suivre leur validation
          </h1>
          <p className="hero-lead section-note">
            Pensé pour les cabinets, centres hospitaliers et services de rééducation : Othoutils met en avant les
            questionnaires, batteries et fiches de suivi déjà relus par des professionnels de santé. Les équipes peuvent
            ensuite proposer, en toute discrétion, des ajustements documentés et relus avant diffusion.
          </p>
          <div className="hero-actions">
            <a href="#catalogue" className="primary-btn">
              Consulter les référentiels validés
            </a>
            <a href="#collaboration" className="secondary-btn">
              Comprendre la validation éditoriale
            </a>
          </div>
        </div>
        <div className="hero-support">
          {[
            {
              title: 'Référentiels vérifiés',
              desc: 'Chaque fiche est relue par des orthophonistes et publiée avec les précisions nécessaires au terrain.',
            },
            {
              title: 'Validation par pairs',
              desc: 'Un circuit de relecture clair : brouillon, relecture interdisciplinaire puis diffusion sécurisée.',
            },
            {
              title: 'Prêt pour le terrain',
              desc: 'Interface lumineuse, lisible et accessible pour travailler au cabinet, à l’hôpital ou en mobilité.',
            },
          ].map((item) => (
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
