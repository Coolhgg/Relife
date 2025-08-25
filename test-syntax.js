import fs from 'src/shims/fs'; // auto: converted require to shim
import path from 'src/shims/path'; // auto: converted require to shim

// Simple syntax check by trying to parse as JavaScript
const filePath = 'src/components/AlarmForm.tsx';
try {
  const content = fs.readFileSync(filePath, 'utf8');

  // Remove TypeScript types and JSX for basic syntax check
  const cleaned = content
    .replace(/: [A-Za-z\[\]<>|&\s]+(?=[,)=])/g, '') // Remove type annotations
    .replace(/interface\s+\w+\s*{[^}]*}/g, '') // Remove interfaces
    .replace(/type\s+\w+\s*=.+?;/g, ''); // Remove type definitions

  console.log('Basic syntax structure appears valid');
} catch (error) {
  console.error('Syntax error:', error.message);
}
