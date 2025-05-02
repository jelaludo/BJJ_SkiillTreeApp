import React, { useMemo, useRef, useState } from 'react';

interface Moebius2DProps {
  skills: string[];
  tSegments?: number;
  wSegments?: number;
  bandWidth?: number;
}

const ASPECT_RATIO = 2; // width:height for the figure-8

const Moebius2D: React.FC<Moebius2DProps> = ({
  skills,
  tSegments = 100,
  wSegments = 20,
  bandWidth = 40,
}) => {
  const [labelsOn, setLabelsOn] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);

  // Responsive size (80vw, auto height)
  const width = 0.8 * window.innerWidth;
  const height = width / ASPECT_RATIO;
  const centerX = width / 2;
  const centerY = height / 2;
  const baseRadiusX = width * 0.26; // scale for figure-8
  const baseRadiusY = height * 0.32;

  // Calculate band edge points for the Möbius band using figure-8 equations
  const bandPath = useMemo(() => {
    const points: [number, number][] = [];
    // Edge A (w = +bandWidth/2)
    for (let i = 0; i <= tSegments; i++) {
      const t = (i / tSegments) * Math.PI * 2;
      const baseX = baseRadiusX * Math.sin(t);
      const baseY = baseRadiusY * Math.sin(t) * Math.cos(t);
      const tangentX = baseRadiusX * Math.cos(t);
      const tangentY = baseRadiusY * (Math.cos(t) * Math.cos(t) - Math.sin(t) * Math.sin(t));
      const tangentLength = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
      const normalX = -tangentY / tangentLength;
      const normalY = tangentX / tangentLength;
      const twistFactor = Math.cos(t / 2);
      const nodeX = baseX + bandWidth * 0.5 * normalX * twistFactor;
      const nodeY = baseY + bandWidth * 0.5 * normalY * twistFactor;
      points.push([nodeX + centerX, nodeY + centerY]);
    }
    // Edge B (w = -bandWidth/2, reversed)
    for (let i = tSegments; i >= 0; i--) {
      const t = (i / tSegments) * Math.PI * 2;
      const baseX = baseRadiusX * Math.sin(t);
      const baseY = baseRadiusY * Math.sin(t) * Math.cos(t);
      const tangentX = baseRadiusX * Math.cos(t);
      const tangentY = baseRadiusY * (Math.cos(t) * Math.cos(t) - Math.sin(t) * Math.sin(t));
      const tangentLength = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
      const normalX = -tangentY / tangentLength;
      const normalY = tangentX / tangentLength;
      const twistFactor = Math.cos(t / 2);
      const nodeX = baseX - bandWidth * 0.5 * normalX * twistFactor;
      const nodeY = baseY - bandWidth * 0.5 * normalY * twistFactor;
      points.push([nodeX + centerX, nodeY + centerY]);
    }
    return `M${points.map(([x, y]) => `${x},${y}`).join(' L ')} Z`;
  }, [centerX, centerY, baseRadiusX, baseRadiusY, tSegments, bandWidth]);

  // Place skill nodes along the centerline (w=0)
  const nodes = useMemo(() => {
    return skills.map((skill, index) => {
      const t = (index / skills.length) * Math.PI * 2;
      const baseX = baseRadiusX * Math.sin(t);
      const baseY = baseRadiusY * Math.sin(t) * Math.cos(t);
      return {
        id: skill,
        x: baseX + centerX,
        y: baseY + centerY,
      };
    });
  }, [skills, baseRadiusX, baseRadiusY, centerX, centerY]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#181818',
      }}
    >
      <button
        style={{
          margin: '16px 0',
          background: labelsOn ? '#ffd86b' : '#333',
          color: labelsOn ? '#222' : '#ffd86b',
          border: 'none',
          borderRadius: 8,
          padding: '8px 18px',
          fontWeight: 700,
          fontSize: 16,
          cursor: 'pointer',
          boxShadow: '0 2px 8px #000a',
          transition: 'all 0.2s',
        }}
        onClick={() => setLabelsOn(l => !l)}
      >
        Labels: {labelsOn ? 'ON' : 'OFF'}
      </button>
      <svg
        ref={svgRef}
        width="80vw"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ background: '#181818', display: 'block', width: '80vw', height: 'auto', maxWidth: width, minHeight: 300 }}
      >
        <defs>
          <linearGradient id="moebiusGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffd86b" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#e6a23c" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#181818" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {/* Möbius band */}
        <path
          d={bandPath}
          fill="url(#moebiusGold)"
          stroke="#e6a23c"
          strokeWidth="2"
          strokeOpacity="0.5"
        />
        {/* Render nodes and labels */}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r={8} fill="#ffd86b" />
            {labelsOn && (
              <text
                x={node.x}
                y={node.y - 12}
                textAnchor="middle"
                fill="#ffd86b"
                fontSize="12"
                style={{ pointerEvents: 'none' }}
              >
                {node.id}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

export default Moebius2D; 