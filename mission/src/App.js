import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './components/AuthPage';
import ChatPage from './components/ChatPage';

function App() {
  return (
    <Router>
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/chat" element={<ChatPage />} />
    </Routes>
  </Router>

  );
}

export default App;
