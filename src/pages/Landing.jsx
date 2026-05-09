import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/landing.css';

import LandingNav from '../components/landing/LandingNav.jsx';
import Hero from '../components/landing/Hero.jsx';
import ShopsStrip from '../components/landing/ShopsStrip.jsx';
import Catalog from '../components/landing/Catalog.jsx';
import Banners from '../components/landing/Banners.jsx';
import HowItWorks from '../components/landing/HowItWorks.jsx';
import Pricing from '../components/landing/Pricing.jsx';
import LkPromo from '../components/landing/LkPromo.jsx';
import LandingFooter from '../components/landing/LandingFooter.jsx';
import AuthPopup from '../components/landing/AuthPopup.jsx';
import { DocModal, FaqModal, ContactsModal, CookieBanner } from '../components/landing/Modals.jsx';

export default function Landing() {
  const navigate = useNavigate();
  const [popupOpen, setPopupOpen] = useState(false);
  const [docModal, setDocModal] = useState(null);
  const [faqOpen, setFaqOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [activeCat, setActiveCat] = useState('eda');

  const openPopup = () => setPopupOpen(true);
  const closePopup = () => setPopupOpen(false);
  const openDocModal = (id) => setDocModal(id);
  const closeDocModal = () => setDocModal(null);

  // Scroll-reveal animation для карточек
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    const els = document.querySelectorAll('.promo-card, .step, .trust-item');
    els.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [activeCat]);

  return (
    <>
      <LandingNav openPopup={openPopup} switchCat={setActiveCat} />
      <Hero openPopup={openPopup} />
      <ShopsStrip openPopup={openPopup} />
      <Catalog activeCat={activeCat} setActiveCat={setActiveCat} openPopup={openPopup} />
      <Banners openPopup={openPopup} />
      <HowItWorks openPopup={openPopup} />
      <Pricing openDocModal={openDocModal} />
      <LkPromo openPopup={openPopup} />
      <LandingFooter
        openDocModal={openDocModal}
        openContactsModal={() => setContactsOpen(true)}
        openFaqModal={() => setFaqOpen(true)}
      />

      <AuthPopup open={popupOpen} onClose={closePopup} openDocModal={openDocModal} />

      <DocModal
        id="ofertaModal"
        open={docModal === 'ofertaModal'}
        onClose={closeDocModal}
        title="Оферта"
        icon="📄"
        text="Текст оферты появится здесь"
      />
      <DocModal
        id="privacyModal"
        open={docModal === 'privacyModal'}
        onClose={closeDocModal}
        title="Политика конфиденциальности"
        icon="🔒"
        text="Политика конфиденциальности появится здесь"
      />
      <FaqModal open={faqOpen} onClose={() => setFaqOpen(false)} />
      <ContactsModal open={contactsOpen} onClose={() => setContactsOpen(false)} />

      <CookieBanner openDocModal={openDocModal} />
    </>
  );
}
