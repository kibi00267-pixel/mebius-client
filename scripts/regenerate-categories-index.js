const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const questionsDir = path.join(projectRoot, 'public', 'questions');
const treeDataPath = path.join(projectRoot, 'app', 'create-test', 'page.tsx');
const outPath = path.join(questionsDir, '_categories.json');

function parseNamesFromTreeData() {
    if (!fs.existsSync(treeDataPath)) return new Map();
    const src = fs.readFileSync(treeDataPath, 'utf8');
    const map = new Map();
    const re = /id:\s*'(\d{2}(?:-\d{2}){3})'\s*,\s*name:\s*'([^']*)'/g;
    for (const m of src.matchAll(re)) {
        const id = m[1];
        const name = m[2];
        if (!map.has(id)) {
            map.set(id, name);
        }
    }
    return map;
}

function parentIdFromDetailId(id) {
    const parts = id.split('-');
    if (parts.length < 4) return id;
    return parts.slice(0, 3).join('-');
}

function loadQuestionCount(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
        throw new Error(`Expected array in ${filePath}`);
    }
    return parsed.length;
}

function main() {
    if (!fs.existsSync(questionsDir)) {
        throw new Error(`Directory not found: ${questionsDir}`);
    }

    const nameMap = parseNamesFromTreeData();
    const files = fs
        .readdirSync(questionsDir)
        .filter((f) => f.endsWith('.json') && f !== '_categories.json')
        .sort();

    const categories = [];

    for (const file of files) {
        const id = path.basename(file, '.json');
        if (!/^\d{2}(?:-\d{2}){3}$/.test(id)) {
            continue;
        }
        const filePath = path.join(questionsDir, file);
        const questionCount = loadQuestionCount(filePath);
        categories.push({
            id,
            name: nameMap.get(id) || id,
            parentId: parentIdFromDetailId(id),
            questionCount,
        });
    }

    fs.writeFileSync(outPath, `${JSON.stringify(categories, null, 2)}\n`, 'utf8');
    console.log(`[regenerate-categories-index] wrote ${categories.length} categories: ${outPath}`);
}

main();
