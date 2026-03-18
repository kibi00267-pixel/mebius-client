'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getQuestionsByCategory, type Question } from '../data/questions';
import { generateSimilarProblem } from '../utils/aiUtils';
import { formatMath } from '../utils/mathUtils';
import { getRoleInfo } from '../utils/studentUtils';

// Default mock data (fallback)
const DEFAULT_MOCK_QUESTIONS = [
    ...getQuestionsByCategory('11-01-01-01').slice(0, 3),
];

export default function ResultsPage() {
    const router = useRouter();

    // State for questions and results
    const [questions, setQuestions] = useState<Question[]>(DEFAULT_MOCK_QUESTIONS);
    const [results, setResults] = useState<Record<string, boolean>>({});
    const [testDate, setTestDate] = useState('2025/02/10');
    const [testTitle, setTestTitle] = useState('確認テスト');
    const [isGenerating, setIsGenerating] = useState(false);

    // Student ID Selection State
    const [step, setStep] = useState<'input-id' | 'grading'>('input-id');
    const [studentId, setStudentId] = useState('');
    const [studentName, setStudentName] = useState('');
    const [idError, setIdError] = useState('');

    const handleStartGrading = () => {
        if (!studentId) { setIdError('IDを入力してください'); return; }
        const role = getRoleInfo(studentId);
        if (!role) { setIdError('無効なIDです (例: 0101)'); return; }

        // Simple mock name mapping for demo
        const mockNames: Record<string, string> = {
            '0101': '田中 太郎', '0102': '佐藤 花子', '0701': '山田 健太',
            '0901': '鈴木 一郎', '9001': '先生'
        };
        setStudentName(mockNames[studentId] || `${role.grade}の生徒`);
        setStep('grading');
    };

    // Initialize results when questions change
    useEffect(() => {
        setResults(Object.fromEntries(questions.map(q => [q.id, true])));
    }, [questions]);

    // Load from storage on mount
    useEffect(() => {
        const storedQs = sessionStorage.getItem('grading_target_questions');
        const storedDate = sessionStorage.getItem('grading_test_date');
        const storedTitle = sessionStorage.getItem('grading_test_title');

        if (storedQs) {
            try {
                const qs = JSON.parse(storedQs) as Question[];
                if (qs.length > 0) {
                    setQuestions(qs);
                }
            } catch (e) {
                console.error('Failed to parse grading questions', e);
            }
        }
        if (storedDate) setTestDate(storedDate);
        if (storedTitle) setTestTitle(storedTitle);

        // Role-based skip: if logged in as student, auto-set ID and skip step
        const storedUser = sessionStorage.getItem('wakiverseUser');
        if (storedUser) {
            const u = JSON.parse(storedUser);
            if (u.role === 'student') {
                setStudentId(u.id);
                setStudentName(u.name);
                setStep('grading');
            }
        }
    }, []);

    const toggleResult = (id: string) => {
        setResults(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCreateReview = async () => {
        setIsGenerating(true);
        // 1. Identify Incorrect Questions
        const incorrectIds = Object.keys(results).filter(id => !results[id]);

        if (incorrectIds.length === 0) {
            alert('❌ 間違いが選択されていません。\n\n間違った問題をクリックして「不正解」にしてから、もう一度ボタンを押してください。\n(全問正解の場合は復習テストは作成されません)');
            setIsGenerating(false);
            return;
        }

        // 2. Find original question objects
        const incorrectQuestions = questions.filter(q => incorrectIds.includes(q.id));

        // 3. Generate Similar Problems (AI)
        const newQuestions: Question[] = [];
        for (const q of incorrectQuestions) {
            const variant = await generateSimilarProblem(q);
            newQuestions.push(variant);
        }

        // 4. Save to storage for the Create Test page to pick up
        sessionStorage.setItem('review_questions', JSON.stringify(newQuestions));
        sessionStorage.setItem('review_student_name', studentName);
        sessionStorage.setItem('review_original_title', testTitle);

        // 5. Redirect
        router.push('/create-test?mode=review');
    };

    return (
        <div className="h-screen overflow-y-auto bg-stone-50 font-sans text-stone-900 p-8">
            <header className="mb-8 flex items-center gap-4">
                <button onClick={() => router.push('/')} className="text-stone-400 hover:text-stone-600 font-bold">← 教室に戻る</button>
                <h1 className="text-3xl font-bold text-blue-800">📊 テスト結果入力</h1>
            </header>

            {step === 'input-id' ? (
                <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-stone-200 p-10 mt-20">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">🎓</div>
                        <h2 className="text-2xl font-bold text-stone-800">だれの採点をしますか？</h2>
                        <p className="text-stone-500 mt-2">生徒IDを入力してください</p>
                    </div>
                    <div className="mb-6">
                        <input
                            type="text"
                            value={studentId}
                            onChange={(e) => { setStudentId(e.target.value); setIdError(''); }}
                            placeholder="例: 0101"
                            className="w-full text-center text-3xl font-bold tracking-widest p-4 border-2 border-stone-200 rounded-xl focus:border-blue-500 focus:outline-none"
                            maxLength={4}
                        />
                        {idError && <p className="text-red-500 text-sm font-bold text-center mt-2">{idError}</p>}
                    </div>
                    <button
                        onClick={handleStartGrading}
                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all"
                    >
                        採点を開始
                    </button>
                    <div className="mt-6 text-center text-xs text-stone-400">
                        <p>IDヒント: 0101 (小1), 0701 (中1)</p>
                    </div>
                </div>
            ) : (
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
                    <div className="mb-6 flex justify-between items-end border-b border-stone-100 pb-4">
                        <div>
                            <h2 className="text-xl font-bold mb-1">第1回 {testTitle} ({testDate}実施)</h2>
                            <div className="flex items-center gap-2 text-stone-500 text-sm">
                                <span>受験者:</span>
                                <span className="font-bold text-lg text-stone-800">{studentName}</span>
                                <span className="text-xs bg-stone-100 px-2 py-0.5 rounded text-stone-500">ID: {studentId}</span>
                            </div>
                        </div>
                        {studentId !== (JSON.parse(sessionStorage.getItem('wakiverseUser') || '{}').id) && (
                            <button onClick={() => setStep('input-id')} className="text-xs font-bold text-stone-400 hover:text-stone-600 underline">
                                別の生徒に変更
                            </button>
                        )}
                    </div>
                    <div className="mb-6">
                        <p className="text-stone-500 text-sm">
                            間違った問題をクリックして <span className="text-red-500 font-bold">❌（不正解）</span> に変更してください。<br />
                            <span className="text-xs text-stone-400">※デフォルトは全て正解（⭕）になっています。</span>
                        </p>
                    </div>

                    <div className="space-y-6 mb-8">
                        {questions.map((q, i) => {
                            const isCorrect = results[q.id];
                            return (
                                <div key={q.id}
                                    className={`relative flex items-start gap-4 p-6 rounded-2xl border-2 transition-all cursor-pointer group select-none ${isCorrect ? 'border-stone-200 bg-white hover:border-blue-300' : 'border-red-300 bg-red-50 hover:border-red-400'}`}
                                    onClick={() => toggleResult(q.id)}
                                >
                                    {/* Click overlay for easier tapping */}
                                    <div className="absolute inset-0 z-10" />

                                    <div className={`relative z-20 w-16 h-16 rounded-full flex items-center justify-center text-4xl font-bold shrink-0 transition-transform group-hover:scale-110 ${isCorrect ? 'bg-stone-100 text-stone-300' : 'bg-white text-red-500 shadow-md border-2 border-red-500'}`}>
                                        {isCorrect ? '⭕' : '❌'}
                                    </div>
                                    <div className="flex-1 relative z-20">
                                        <div className="flex justify-between mb-3">
                                            <span className="font-bold text-stone-500">問{i + 1}</span>
                                            <span className="text-xs font-bold px-2 py-1 bg-stone-100 rounded text-stone-500">{q.diff}</span>
                                        </div>
                                        <div className="font-medium text-xl mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatMath(q.question) }} />

                                        {/* Answer Section - Faint by default, easier to see on hover or if incorrect */}
                                        <div className={`p-3 rounded-lg border transition-all ${isCorrect ? 'bg-stone-50 border-stone-100' : 'bg-red-100/50 border-red-200'}`}>
                                            <div className="text-xs font-bold text-stone-400 mb-1">解答</div>
                                            <div className={`text-lg font-bold transition-colors ${isCorrect ? 'text-stone-300' : 'text-red-600'}`} dangerouslySetInnerHTML={{ __html: formatMath(q.answer) }} />
                                        </div>
                                    </div>
                                    <div className="self-center relative z-20">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${isCorrect ? 'bg-white border-stone-200 text-stone-300' : 'bg-red-600 border-red-600 text-white shadow-md animate-pulse'}`}>
                                            {isCorrect ? '正解' : '要復習'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="sticky bottom-0 bg-white/95 backdrop-blur pt-4 pb-8 border-t border-stone-100 flex justify-center -mx-8 px-8 rounded-b-2xl z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                        <button
                            onClick={handleCreateReview}
                            disabled={isGenerating}
                            className="w-full md:w-auto px-16 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold text-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0"
                        >
                            {isGenerating ? (
                                <>
                                    <span className="animate-spin text-2xl">⚡</span>
                                    <span>AIが類似問題を生成中...</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-3xl">🤖</span>
                                    <span>復習テストを作成</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
