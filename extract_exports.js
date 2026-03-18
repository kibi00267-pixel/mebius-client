const fs = require('fs');
const text = fs.readFileSync('c:/Users/waki.KIBI/作業/mebius-client/app/data/questions.ts', 'utf-8');
const lines = text.split('\n');
const exports = lines.filter(l => l.includes('export const questions_12_02'));
console.log(exports.join('\n'));
