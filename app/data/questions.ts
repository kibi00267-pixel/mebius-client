export interface Question {
    id: string;
    categoryId: string;
    diff: '基礎' | '基本' | '標準' | '応用' | '発展' | '対策' | '発見';
    question: string;
    answer: string;
    explanation: string;
    answerStyle?: 'numberLine' | 'default';
}

export interface Category {
    id: string;
    name: string;
    parentId: string;
    questionCount: number;
}

import * as fs from 'fs';
import * as path from 'path';

function loadJsonFile<T>(filePath: string, fallback: T): T {
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

const questionsJsonPath = path.join(process.cwd(), 'public', 'questions.json');
const categoriesJsonPath = path.join(process.cwd(), 'public', 'questions', '_categories.json');

export const allQuestions: Record<string, Question[]> = loadJsonFile<Record<string, Question[]>>(questionsJsonPath, {});
export const categories: Category[] = loadJsonFile<Category[]>(categoriesJsonPath, []);
