const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, 'app', 'data', 'questions.ts');
const jsonPath = path.join(projectRoot, 'public', 'questions.json');
const categoriesIndexPath = path.join(projectRoot, 'public', 'questions', '_categories.json');

function loadAllQuestionsFromSource() {
    const source = fs.readFileSync(sourcePath, 'utf8');
    const merged = `${source}\n;globalThis.__ALL_QUESTIONS__ = allQuestions;`;
    const transpiled = ts.transpileModule(merged, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2020,
        },
    });

    const sandbox = {
        module: { exports: {} },
        exports: {},
        require,
        console,
        process,
        globalThis: {},
    };

    vm.runInNewContext(transpiled.outputText, sandbox, { filename: 'questions.validate.transpiled.js' });

    if (!sandbox.globalThis.__ALL_QUESTIONS__) {
        throw new Error('allQuestions was not found in app/data/questions.ts');
    }

    return sandbox.globalThis.__ALL_QUESTIONS__;
}

function loadAllQuestionsFromJson() {
    if (!fs.existsSync(jsonPath)) {
        throw new Error(`missing file: ${jsonPath}`);
    }
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

function loadCategoriesIndex() {
    if (!fs.existsSync(categoriesIndexPath)) {
        throw new Error(`missing file: ${categoriesIndexPath}`);
    }
    return JSON.parse(fs.readFileSync(categoriesIndexPath, 'utf8'));
}

function validateShape(allQuestions) {
    const errors = [];
    if (!allQuestions || typeof allQuestions !== 'object' || Array.isArray(allQuestions)) {
        errors.push('allQuestions is not an object');
        return errors;
    }

    for (const [categoryId, questions] of Object.entries(allQuestions)) {
        if (!Array.isArray(questions)) {
            errors.push(`category ${categoryId} is not an array`);
            continue;
        }
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q || typeof q !== 'object') {
                errors.push(`category ${categoryId}[${i}] is not an object`);
                continue;
            }
            if (typeof q.id !== 'string' || q.id.length === 0) errors.push(`category ${categoryId}[${i}] invalid id`);
            if (q.categoryId !== categoryId) errors.push(`category ${categoryId}[${i}] categoryId mismatch: ${q.categoryId}`);
            if (typeof q.diff !== 'string') errors.push(`category ${categoryId}[${i}] invalid diff`);
            if (typeof q.question !== 'string') errors.push(`category ${categoryId}[${i}] invalid question`);
            if (typeof q.answer !== 'string') errors.push(`category ${categoryId}[${i}] invalid answer`);
            if (typeof q.explanation !== 'string') errors.push(`category ${categoryId}[${i}] invalid explanation`);
        }
    }
    return errors;
}

function validateCategoriesIndex(allQuestions, categoriesIndex) {
    const errors = [];
    if (!Array.isArray(categoriesIndex)) {
        errors.push('categories index is not an array');
        return errors;
    }

    const indexMap = new Map();
    for (let i = 0; i < categoriesIndex.length; i++) {
        const row = categoriesIndex[i];
        if (!row || typeof row !== 'object') {
            errors.push(`categories index row ${i} is not an object`);
            continue;
        }
        const { id, parentId, questionCount } = row;
        if (typeof id !== 'string' || id.length === 0) {
            errors.push(`categories index row ${i} has invalid id`);
            continue;
        }
        if (typeof parentId !== 'string' || parentId.length === 0) {
            errors.push(`categories index row ${i} (${id}) has invalid parentId`);
        }
        if (!Number.isInteger(questionCount) || questionCount < 0) {
            errors.push(`categories index row ${i} (${id}) has invalid questionCount`);
        }
        if (indexMap.has(id)) {
            errors.push(`duplicate category id in index: ${id}`);
        } else {
            indexMap.set(id, row);
        }
    }

    for (const [categoryId, questions] of Object.entries(allQuestions)) {
        if (!Array.isArray(questions)) continue;
        if (!indexMap.has(categoryId)) {
            errors.push(`missing index entry for category ${categoryId}`);
            continue;
        }
        const indexCount = indexMap.get(categoryId).questionCount;
        if (indexCount !== questions.length) {
            errors.push(`questionCount mismatch for ${categoryId}: index=${indexCount}, actual=${questions.length}`);
        }
    }

    for (const indexedId of indexMap.keys()) {
        if (!Object.prototype.hasOwnProperty.call(allQuestions, indexedId)) {
            errors.push(`orphan index entry without questions in questions.json: ${indexedId}`);
        }
    }

    return errors;
}

function main() {
    const mode = process.argv.includes('--json') ? 'json' : 'source';
    const allQuestions = mode === 'json' ? loadAllQuestionsFromJson() : loadAllQuestionsFromSource();

    const shapeErrors = validateShape(allQuestions);
    const errors = [...shapeErrors];

    if (mode === 'json') {
        const categoriesIndex = loadCategoriesIndex();
        errors.push(...validateCategoriesIndex(allQuestions, categoriesIndex));
    }

    const categoryCount = Object.keys(allQuestions || {}).length;
    console.log(`[validate-questions] mode=${mode} categories=${categoryCount}`);

    if (errors.length > 0) {
        console.error('[validate-questions] FAILED');
        for (const err of errors) console.error(`- ${err}`);
        process.exit(1);
    }

    console.log('[validate-questions] OK');
}

main();
