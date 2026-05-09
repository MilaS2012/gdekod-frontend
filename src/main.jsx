import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Dashboard from './pages/Dashboard.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/lk" element={<Dashboard />} />
        <Route path="/gdekod-lk.html" element={<Dashboard />} />
        <Route path="/index.html" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
