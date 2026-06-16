import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Upload from './pages/Upload';
import Review from './pages/Review';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Upload />} />
        <Route path="/review" element={<Review />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
