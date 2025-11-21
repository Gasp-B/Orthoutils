import TestForm from './TestForm';

export const metadata = {
  title: 'Gérer les tests | Othoutils',
  description: 'Ajoutez ou mettez à jour un test avec ses domaines et tags.',
};

export default function ManageTestsPage() {
  return (
    <main className="container section-shell" style={{ padding: '1.5rem 0 2rem', gap: '1rem' }}>
      <div className="section-title">
        <span />
        <p style={{ margin: 0 }}>Créer ou mettre à jour un test</p>
      </div>

      <div className="glass panel" style={{ padding: '1.5rem', display: 'grid', gap: '0.6rem' }}>
        <h1 style={{ margin: 0, color: '#0f172a' }}>Ajouter / Éditer un test</h1>
        <p className="text-subtle" style={{ margin: 0 }}>
          Utilisez ce formulaire pour créer un test ou modifier une fiche existante, y compris ses tags et domaines associés.
        </p>
      </div>

      <TestForm />
    </main>
  );
}
