import Header from './header/header';
import PhaseBanner from './banner/phase-banner';
import Footer from './footer/footer';

export default function RootLayout({ children }) {
  return (
    <>
      <Header />
      <div className="govuk-width-container">
        <PhaseBanner />
        {children}
      </div>
      <Footer/>
    </>
  );
};
