import React, { useMemo } from 'react';
import fundamentalsData from '../assets/BJJSkillTree.txt?raw';
import Moebius2D from './Moebius2D';

// Parse fundamentals from the txt file
function parseFundamentals(data: string): string[] {
  const seen = new Set<string>();
  return data
    .split('\n')
    .filter(line => line.startsWith('Fundamentals,'))
    .map(line => line.split(',')[1].trim())
    .filter(skill => {
      if (seen.has(skill)) return false;
      seen.add(skill);
      return true;
    });
}

const FundamentalsGraph: React.FC = () => {
  // Parse skills
  const skills = useMemo(() => parseFundamentals(fundamentalsData), []);

  return (
    <div style={{ width: '100vw', height: '80vh', position: 'relative' }}>
      <Moebius2D skills={skills} />
    </div>
  );
};

export default FundamentalsGraph;

// 3D Implementation (On Hold)
// The following code is preserved for future reference but currently not in use.
// We're temporarily using a 2D SVG implementation due to performance and mesh issues.
/*
import * as THREE from 'three';
import ForceGraph3D from 'react-force-graph-3d';

// ... rest of the 3D implementation code ...
*/ 