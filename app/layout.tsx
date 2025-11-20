import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Othoutils | Référentiels cliniques orthophoniques',
  description:
    'Catalogue d’outils cliniques validés par des orthophonistes avec gouvernance éditoriale et suivi des validations.',
  metadataBase: new URL('https://othoutils.example.com'),
};

type RootLayoutProps = {
  children: React.ReactNode;
};

function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr">
      <body>
        <div className="page">{children}</div>
      </body>
    </html>
  );
}

export default RootLayout;
