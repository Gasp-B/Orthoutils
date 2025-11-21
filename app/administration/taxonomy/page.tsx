import TaxonomyManager from './TaxonomyManager';
import styles from './taxonomy-page.module.css';

export const metadata = {
  title: 'Gérer les catégories et tags | Othoutils',
  description: 'Ajoutez, supprimez ou renommez les domaines et tags des tests.',
};

function TaxonomyPage() {
  return (
    <main className={`container section-shell ${styles.page}`}>
      <div className="section-title">
        <span />
        <p className={styles.sectionLabel}>Administration</p>
      </div>

      <div className={`glass panel ${styles.introPanel}`}>
        <h1 className={styles.pageTitle}>Catégories & tags</h1>
        <p className={`text-subtle ${styles.pageLead}`}>
          Centralisez la liste des domaines et tags utilisables dans la fiche test. Les éléments créés ici seront
          immédiatement disponibles dans le formulaire « Ajouter / Éditer un test ».
        </p>
      </div>

      <TaxonomyManager />
    </main>
  );
}

export default TaxonomyPage;
