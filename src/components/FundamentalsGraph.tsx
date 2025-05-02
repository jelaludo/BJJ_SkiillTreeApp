import React, { useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import fundamentalsData from '../assets/BJJSkillTree.txt?raw';
import * as THREE from 'three';

// Parse fundamentals from the txt file
function parseFundamentals(data: string): string[] {
  return data
    .split('\n')
    .filter(line => line.startsWith('Fundamentals,'))
    .map(line => line.split(',')[1].trim());
}

type Node = {
  id: string;
  value: number; // 1 (dim) to 5 (brightest)
  x?: number;
  y?: number;
  z?: number;
  size?: number;
  gridU?: number;
  gridV?: number;
};
type Link = { source: string; target: string };

type GraphData = {
  nodes: Node[];
  links: Link[];
};

// Generate a Moebius strip surface grid
function moebiusSurfaceGrid(numU: number, numV: number, radius = 40, width = 12) {
  // Returns array of {x, y, z, uIdx, vIdx}
  const nodes = [];
  for (let uIdx = 0; uIdx < numU; uIdx++) {
    const u = (uIdx / numU) * 2 * Math.PI;
    for (let vIdx = 0; vIdx < numV; vIdx++) {
      const v = ((vIdx / (numV - 1)) * 2 - 1) * width; // v in [-width, width]
      const x = (radius + v * Math.cos(u / 2)) * Math.cos(u);
      const y = (radius + v * Math.cos(u / 2)) * Math.sin(u);
      const z = v * Math.sin(u / 2);
      nodes.push({ x, y, z, gridU: uIdx, gridV: vIdx });
    }
  }
  return nodes;
}

const FundamentalsGraph: React.FC = () => {
  // Parse skills
  const skills = useMemo(() => parseFundamentals(fundamentalsData), []);
  // Set grid size
  const numU = skills.length; // one loop per skill
  const numV = 8; // width of the strip (number of nodes across)

  // Generate grid nodes
  const gridNodes = moebiusSurfaceGrid(numU, numV);

  // Assign skill names to the center row of the grid, others are filler nodes
  const nodes: Node[] = gridNodes.map((pt, idx) => {
    // Center row gets skill name, others get generic id
    const isCenter = pt.gridV === Math.floor(numV / 2);
    const id = isCenter && skills[pt.gridU] ? skills[pt.gridU] : `filler-${pt.gridU}-${pt.gridV}`;
    // Random value 1-5 for now
    const value = Math.floor(Math.random() * 5) + 1;
    // Node size: bigger for center row (skills), smaller for fillers
    const size = isCenter ? 4 + value : 2 + value * 0.5;
    return { id, value, x: pt.x, y: pt.y, z: pt.z, size, gridU: pt.gridU, gridV: pt.gridV };
  });

  // Connect each node to its neighbors in the grid (mesh)
  const links: Link[] = [];
  for (let u = 0; u < numU; u++) {
    for (let v = 0; v < numV; v++) {
      const idx = u * numV + v;
      // Connect to next u (wrap around with twist for Moebius)
      if (u < numU - 1) {
        const nextU = (u + 1) * numV + v;
        links.push({ source: nodes[idx].id, target: nodes[nextU].id });
      } else {
        // Last row: connect to first row, but flip v (the twist)
        const flippedV = numV - 1 - v;
        const firstIdx = 0 * numV + flippedV;
        links.push({ source: nodes[idx].id, target: nodes[firstIdx].id });
      }
      // Connect to next v (if not at edge)
      if (v < numV - 1) {
        links.push({ source: nodes[idx].id, target: nodes[idx + 1].id });
      }
    }
  }

  const graphData: GraphData = { nodes, links };

  return (
    <div style={{ width: '100vw', height: '80vh' }}>
      <ForceGraph3D
        graphData={graphData}
        nodeAutoColorBy={() => 'orange'}
        nodeThreeObject={(node: any) => {
          // Node brightness: 1 (dim) to 5 (brightest)
          const value = (node as Node).value;
          const size = (node as Node).size || 3;
          // Orange/yellow color, brightness by value
          const color = new THREE.Color().setHSL(0.10, 1, 0.18 + 0.13 * value); // HSL for orange/yellow
          const material = new THREE.MeshBasicMaterial({ color });
          const sphere = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 16), material);
          return sphere;
        }}
        nodeThreeObjectExtend={true}
        linkColor={() => '#e6a23c'}
        linkOpacity={0.45}
        backgroundColor="#181818"
        showNavInfo={false}
      />
    </div>
  );
};

export default FundamentalsGraph; 