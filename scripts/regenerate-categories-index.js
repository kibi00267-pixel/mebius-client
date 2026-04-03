const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const questionsDir = path.join(projectRoot, 'public', 'questions');
const questionsJsonPath = path.join(projectRoot, 'public', 'questions.json');
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
    const nameMap = parseNamesFromTreeData();
    const categories = [];

    if (!fs.existsSync(questionsDir)) {
        fs.mkdirSync(questionsDir, { recursive: true });
    }

    const hasPerCategoryFiles = fs
        .readdirSync(questionsDir)
        .some((f) => f.endsWith('.json') && f !== '_categories.json' && /^\d{2}(?:-\d{2}){3}\.json$/.test(f));

    if (hasPerCategoryFiles) {
        const files = fs
            .readdirSync(questionsDir)
            .filter((f) => f.endsWith('.json') && f !== '_categories.json')
            .sort();

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
    } else {
        const allQuestions = fs.existsSync(questionsJsonPath)
            ? JSON.parse(fs.readFileSync(questionsJsonPath, 'utf8'))
            : {};

        for (const [id, questions] of Object.entries(allQuestions)) {
            if (!/^\d{2}(?:-\d{2}){3}$/.test(id)) continue;
            categories.push({
                id,
                name: nameMap.get(id) || id,
                parentId: parentIdFromDetailId(id),
                questionCount: Array.isArray(questions) ? questions.length : 0,
            });
        }

        categories.sort((a, b) => a.id.localeCompare(b.id));
    }

    fs.writeFileSync(outPath, `${JSON.stringify(categories, null, 2)}\n`, 'utf8');
    console.log(`[regenerate-categories-index] wrote ${categories.length} categories: ${outPath}`);
}

main();
