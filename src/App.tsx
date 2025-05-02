import { useState, useEffect } from 'react';
import BJJSkillTree from './components/BJJSkillTree';
import FundamentalsGraph from './components/FundamentalsGraph';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>BJJ Skill Tree: Fundamentals (Moebius Strip)</h1>
      <FundamentalsGraph />
    </div>
  );
}

export default App; 