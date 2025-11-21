import TestForm from './TestForm';
import styles from './manage-page.module.css';

export const metadata = {
  title: 'Gérer les tests | Othoutils',
  description: 'Ajoutez ou mettez à jour un test avec ses domaines et tags.',
};

export default function ManageTestsPage() {
  return (
    <main className={`container section-shell ${styles.page}`}>
      <div className="section-title">
        <span />
        <p className={styles.sectionLabel}>Créer ou mettre à jour un test</p>
      </div>

      <div className={`glass panel ${styles.introPanel}`}>
        <h1 className={styles.pageTitle}>Ajouter / Éditer un test</h1>
        <p className={`text-subtle ${styles.pageLead}`}>
          Utilisez ce formulaire pour créer un test ou modifier une fiche existante, y compris ses tags et domaines associés.
        </p>
      </div>

      <TestForm />
    </main>
  );
}
