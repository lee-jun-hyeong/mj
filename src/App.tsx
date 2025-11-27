import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Scores from './pages/Scores';
import ScoreDetail from './pages/ScoreDetail';
import Contis from './pages/Contis';
import ContiEdit from './pages/ContiEdit';
import ContiDetail from './pages/ContiDetail';
import SharedConti from './pages/SharedConti';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="scores" element={<Scores />} />
        <Route path="scores/:scoreId" element={<ScoreDetail />} />
        <Route path="contis" element={<Contis />} />
        <Route path="contis/new" element={<ContiEdit />} />
        <Route path="contis/:contiId" element={<ContiDetail />} />
        <Route path="contis/:contiId/edit" element={<ContiEdit />} />
        <Route path="shared/:shareToken" element={<SharedConti />} />
      </Route>
    </Routes>
  );
}

export default App;

