import { useState, useEffect } from 'react';
import skillTreeData from '../assets/BJJSkillTree.txt?raw';

const BJJSkillTree = () => {
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    try {
      const skillList = skillTreeData.split('\n').filter(skill => skill.trim() !== '');
      setSkills(skillList);
    } catch (error) {
      console.error('Error loading skill tree data:', error);
    }
  }, []);

  return (
    <div className="skill-tree">
      <h2>BJJ Skills</h2>
      <ul>
        {skills.map((skill, index) => (
          <li key={index}>{skill}</li>
        ))}
      </ul>
    </div>
  );
};

export default BJJSkillTree; 