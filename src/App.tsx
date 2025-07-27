import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Group from './pages/Group';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/group/:groupId" element={<Group />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;