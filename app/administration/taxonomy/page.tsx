import TaxonomyManager from './TaxonomyManager';

export const metadata = {
  title: 'Gérer les catégories et tags | Othoutils',
  description: 'Ajoutez, supprimez ou renommez les domaines et tags des tests.',
};

function TaxonomyPage() {
  return (
    <main className="container section-shell" style={{ padding: '1.5rem 0 2rem', gap: '1rem' }}>
      <div className="section-title">
        <span />
        <p style={{ margin: 0 }}>Administration</p>
      </div>

      <div className="glass panel" style={{ padding: '1.5rem', display: 'grid', gap: '0.6rem' }}>
        <h1 style={{ margin: 0, color: '#0f172a' }}>Catégories & tags</h1>
        <p className="text-subtle" style={{ margin: 0 }}>
          Centralisez la liste des domaines et tags utilisables dans la fiche test. Les éléments créés ici seront
          immédiatement disponibles dans le formulaire « Ajouter / Éditer un test ».
        </p>
      </div>

      <TaxonomyManager />
    </main>
  );
}

export default TaxonomyPage;
