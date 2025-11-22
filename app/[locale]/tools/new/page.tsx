import Link from 'next/link';
import ToolCreationForm from './ToolCreationForm';
import styles from './new-tool-page.module.css';

export const metadata = {
  title: 'Ajouter un outil | Othoutils',
  description: "Créez une fiche d'outil pour enrichir le catalogue.",
};

function NewToolPage() {
  return (
    <div className={`container section-shell ${styles.page}`}>
      <div className="section-title">
        <span />
        <p className={styles.sectionLabel}>Créer une fiche outil</p>
      </div>

      <div className={`glass panel ${styles.introPanel}`}>
        <p className={styles.introTitle}>
          Renseignez les informations clés pour qu\'une nouvelle fiche apparaisse dans le catalogue.
        </p>
        <p className={`text-subtle ${styles.introText}`}>
          Les champs Nom, Catégorie, Type, Tags et Source sont obligatoires. Les fiches créées sont signalées comme
          contributions communautaires et apparaîtront dans la liste principale.
        </p>
        <p className={`text-subtle ${styles.introText}`}>
          Besoin de vérifier le rendu ? Consultez le{' '}
          <Link href="/#catalogue" className="top-banner__link">
            catalogue
          </Link>{' '}
          après validation.
        </p>
      </div>

      <ToolCreationForm />
    </div>
  );
}

export default NewToolPage;
