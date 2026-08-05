const fs = require('fs');
const path = 'd:/ClinOps/MedOrch/frontend/src/components/AgentWorkspace.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/text-slate-900/g, 'text-white');
content = content.replace(/text-slate-700/g, 'text-white/80');
content = content.replace(/text-slate-500/g, 'text-white/50');
content = content.replace(/text-slate-400/g, 'text-white/40');
content = content.replace(/text-slate-300/g, 'text-white/30');
content = content.replace(/bg-slate-50/g, 'bg-surface-black');
content = content.replace(/bg-slate-100/g, 'bg-white/5');
content = content.replace(/bg-slate-200\/60/g, 'bg-white/5');
content = content.replace(/bg-slate-200/g, 'bg-white/10');
content = content.replace(/border-slate-100/g, 'border-white/5');
content = content.replace(/border-slate-200/g, 'border-white/10');
content = content.replace(/border-slate-300/g, 'border-white/20');
content = content.replace(/bg-white/g, 'bg-surface-obsidian');
content = content.replace(/prose-slate/g, 'prose-invert');

fs.writeFileSync(path, content);
console.log('Fixed AgentWorkspace.tsx');
