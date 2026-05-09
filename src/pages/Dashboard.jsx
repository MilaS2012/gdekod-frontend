import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

import DashNav from '../components/dashboard/DashNav.jsx';
import Sidebar from '../components/dashboard/Sidebar.jsx';
import MainContent from '../components/dashboard/MainContent.jsx';
import DashFooter from '../components/dashboard/DashFooter.jsx';
import {
  PasswordModal, CancelModal, PayOperatorModal, PayCardModal, PaySbpModal,
  ContactsModalDash, OfertaModal, PrivacyModal, ReceiptModal,
} from '../components/dashboard/DashModals.jsx';
import { CookieBanner } from '../components/landing/Modals.jsx';
import { scrollToEl } from '../utils/dashboard-logic.js';
import { isLoggedIn } from '../utils/auth.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [openModalId, setOpenModalId] = useState(null);

  // Сессия в текущем демо разрешает доступ всем — оригинальная логика тоже не блокировала
  // переход напрямую. Если хотите редирект — раскомментируйте:
  // useEffect(() => { if (!isLoggedIn()) navigate('/'); }, []);

  const openModal = (id) => setOpenModalId(id);
  const closeModal = () => setOpenModalId(null);

  // expose switchTab for legacy renderers (favourites empty-state link, etc.)
  useEffect(() => {
    window.__switchTab = setActiveTab;
    return () => { delete window.__switchTab; };
  }, []);

  return (
    <>
      <DashNav />
      <div className="lk-layout">
        <Sidebar
          switchTab={setActiveTab}
          scrollToEl={scrollToEl}
          openModal={openModal}
        />
        <MainContent
          activeTab={activeTab}
          switchTab={setActiveTab}
          openModal={openModal}
        />
      </div>

      <PasswordModal open={openModalId === 'passwordModal'} onClose={closeModal} />
      <CancelModal open={openModalId === 'cancelModal'} onClose={closeModal} />
      <PayOperatorModal open={openModalId === 'payOperatorModal'} onClose={closeModal} />
      <PayCardModal open={openModalId === 'payCardModal'} onClose={closeModal} />
      <PaySbpModal open={openModalId === 'paySbpModal'} onClose={closeModal} />
      <ContactsModalDash open={openModalId === 'contactsModal'} onClose={closeModal} />
      <OfertaModal open={openModalId === 'ofertaModal'} onClose={closeModal} />
      <PrivacyModal open={openModalId === 'privacyModal'} onClose={closeModal} />
      <ReceiptModal open={openModalId === 'receiptModal'} onClose={closeModal} />

      <DashFooter openModal={openModal} switchTab={setActiveTab} />
      <CookieBanner openDocModal={openModal} />
    </>
  );
}
