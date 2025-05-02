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
      <BJJSkillTree />
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
    </div>
  );
}

export default App; 