import React, { useMemo, useRef, useState, useEffect } from 'react';
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

const TOOLTIP_ID = 'bjj-skilltree-tooltip';
const MODAL_ID = 'bjj-skilltree-modal';

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

  // --- LABELS STATE ---
  const [labelsOn, setLabelsOn] = useState(true);
  const fgRef = useRef<any>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Top-right button style
  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    top: 20,
    right: 30,
    zIndex: 1100,
    background: labelsOn ? '#ffd86b' : '#333',
    color: labelsOn ? '#222' : '#ffd86b',
    border: 'none',
    borderRadius: 8,
    padding: '10px 22px',
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer',
    boxShadow: '0 2px 8px #000a',
    transition: 'all 0.2s',
  };

  // Tooltip style (under the title)
  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: '50%',
    top: 60,
    transform: 'translateX(-50%)',
    pointerEvents: 'none',
    fontSize: 'min(2.5vw, 2.5vh, 28px)',
    background: 'rgba(30,30,30,0.95)',
    color: '#ffd86b',
    borderRadius: 8,
    padding: '10px 24px',
    fontWeight: 700,
    zIndex: 9999,
    boxShadow: '0 2px 8px #000a',
    whiteSpace: 'nowrap',
    textAlign: 'center',
    display: 'none',
  };

  // Modal style (under the title, but bigger)
  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    left: '50%',
    top: 120,
    transform: 'translateX(-50%)',
    background: '#222',
    color: '#ffd86b',
    padding: '32px 40px',
    borderRadius: 16,
    zIndex: 2000,
    fontSize: 22,
    fontWeight: 700,
    boxShadow: '0 4px 32px #000c',
    minWidth: 300,
    textAlign: 'center',
    display: 'none',
  };

  // Create tooltip and modal DOM elements on mount
  useEffect(() => {
    let tooltip = document.getElementById(TOOLTIP_ID) as HTMLDivElement | null;
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = TOOLTIP_ID;
      Object.assign(tooltip.style, tooltipStyle);
      document.body.appendChild(tooltip);
    }
    tooltipRef.current = tooltip;

    let modal = document.getElementById(MODAL_ID) as HTMLDivElement | null;
    if (!modal) {
      modal = document.createElement('div');
      modal.id = MODAL_ID;
      Object.assign(modal.style, modalStyle);
      document.body.appendChild(modal);
    }
    modalRef.current = modal;

    // Clean up on unmount
    return () => {
      if (tooltip) tooltip.remove();
      if (modal) modal.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show/hide tooltip on node hover
  const handleNodeHover = labelsOn
    ? (node: any) => {
        console.log('Hovered node:', node);
        if (tooltipRef.current) {
          if (node && (node as Node).id.startsWith('filler-') === false) {
            tooltipRef.current.textContent = (node as Node).id;
            tooltipRef.current.style.display = 'block';
          } else {
            tooltipRef.current.style.display = 'none';
          }
        }
      }
    : undefined;

  // Show/hide modal on node click
  const handleNodeClick = labelsOn
    ? (node: any) => {
        console.log('Clicked node:', node);
        if (modalRef.current) {
          if (node && (node as Node).id.startsWith('filler-') === false) {
            modalRef.current.innerHTML = `
              <div>${(node as Node).id}</div>
              <div style="font-size: 16px; margin-top: 12px; color: #fff; font-weight: 400;">(Description: ${(node as Node).id})</div>
              <div style="margin-top: 18px; font-size: 14px; color: #ffd86b; opacity: 0.7;">(Click anywhere to close)</div>
            `;
            modalRef.current.style.display = 'block';
            // Add click handler to close
            const closeModal = () => {
              if (modalRef.current) modalRef.current.style.display = 'none';
              window.removeEventListener('mousedown', closeModal);
            };
            window.addEventListener('mousedown', closeModal);
          } else {
            modalRef.current.style.display = 'none';
          }
        }
      }
    : undefined;

  // Hide tooltip and modal if labels are turned off
  useEffect(() => {
    if (!labelsOn) {
      if (tooltipRef.current) tooltipRef.current.style.display = 'none';
      if (modalRef.current) modalRef.current.style.display = 'none';
    }
  }, [labelsOn]);

  return (
    <div style={{ width: '100vw', height: '80vh', position: 'relative' }}>
      {/* Toggle Button */}
      <button style={buttonStyle} onClick={() => setLabelsOn(l => !l)}>
        Labels: {labelsOn ? 'ON' : 'OFF'}
      </button>
      <ForceGraph3D
        ref={fgRef}
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
        nodeLabel={() => ''} // disable built-in tooltip
        onNodeHover={handleNodeHover}
        onNodeClick={handleNodeClick}
      />
    </div>
  );
};

export default FundamentalsGraph; 