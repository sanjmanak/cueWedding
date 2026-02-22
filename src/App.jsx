import { Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Landing from './components/Landing';
import Phase1Story from './components/phases/Phase1Story';
import Phase2People from './components/phases/Phase2People';
import Phase3Soundtrack from './components/phases/Phase3Soundtrack';
import Phase4Program from './components/phases/Phase4Program';
import Phase5Details from './components/phases/Phase5Details';
import Phase6Review from './components/phases/Phase6Review';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/phase/1" element={<Phase1Story />} />
          <Route path="/phase/2" element={<Phase2People />} />
          <Route path="/phase/3" element={<Phase3Soundtrack />} />
          <Route path="/phase/4" element={<Phase4Program />} />
          <Route path="/phase/5" element={<Phase5Details />} />
          <Route path="/phase/6" element={<Phase6Review />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
