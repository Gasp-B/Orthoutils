import Hero from '../components/Hero';
import ReferentialsSection from '../components/ReferentialsSection';
import ToolsSection from '../components/ToolsSection';

function HomePage() {
  return (
    <>
      <Hero />
      <ReferentialsSection />
      <ToolsSection />

      <footer className="container footer">
        Made with soin pour les équipes d'orthophonie. Mobile first, adaptatif et pensé pour vos collaborations.
      </footer>
    </>
  );
}

export default HomePage;
