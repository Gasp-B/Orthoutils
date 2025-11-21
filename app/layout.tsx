import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import Header from '../components/Header';

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
        <Providers>
          <Header />
          <main className="page">{children}</main>
        </Providers>
      </body>
    </html>
  );
}

export default RootLayout;
