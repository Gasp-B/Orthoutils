import Link from 'next/link';
import ToolCreationForm from './ToolCreationForm';

export const metadata = {
  title: 'Ajouter un outil | Othoutils',
  description: "Créez une fiche d'outil pour enrichir le catalogue.",
};

function NewToolPage() {
  return (
    <div className="container section-shell" style={{ gap: '1.2rem', marginTop: '2rem' }}>
      <div className="section-title">
        <span />
        <p style={{ margin: 0 }}>Créer une fiche outil</p>
      </div>

      <div className="glass panel" style={{ padding: '1.5rem', display: 'grid', gap: '0.8rem' }}>
        <p style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>
          Renseignez les informations clés pour qu\'une nouvelle fiche apparaisse dans le catalogue.
        </p>
        <p className="text-subtle" style={{ margin: 0 }}>
          Les champs Nom, Catégorie, Type, Tags et Source sont obligatoires. Les fiches créées sont signalées comme
          contributions communautaires et apparaîtront dans la liste principale.
        </p>
        <p className="text-subtle" style={{ margin: 0 }}>
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
