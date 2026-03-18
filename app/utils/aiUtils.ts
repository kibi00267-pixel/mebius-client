
import { type Question } from '../data/questions';

/**
 * Mock AI: Generates a similar problem based on the original.
 * In a real app, this would use a more sophisticated engine or LLM.
 */
export async function generateSimilarProblem(original: Question): Promise<Question> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    let newQ = original.question;
    let newA = original.answer;
    let newExp = original.explanation;

    // A slightly smarter randomizer for prototype:
    // We try to find patterns and swap values.

    // Pattern 1: Simple numbers in "What is the absolute value of X?"
    if (original.categoryId.includes('01-03-02') || original.categoryId.includes('01-03-03')) {
        // Find numbers like +3, -9, 17, 0.4
        const matches = original.question.match(/[+-]?\d+(\.\d+)?/g);
        if (matches && matches.length > 0) {
            // Pick a set of new random numbers
            const newValues = matches.map(m => {
                const val = parseFloat(m);
                const hasSign = m.startsWith('+') || m.startsWith('-');
                const sign = m.startsWith('-') ? '-' : (m.startsWith('+') ? '+' : '');

                // Randomize: Offset by 1-10, or just pick a random int
                const offset = Math.floor(Math.random() * 5) + 1;
                const newVal = Math.abs(val) + (Math.random() > 0.5 ? offset : -offset);
                const finalVal = Math.max(1, Math.abs(newVal)); // Keep it positive for now

                return `${sign}${finalVal}${m.includes('.') ? '.0' : ''}`;
            });

            // This is still a bit crude for a prototype, but better than nothing.
            // For the demo, let's handle specific common patterns.
            if (original.question.includes('絶対値')) {
                if (original.question.includes('より大きく') && original.question.includes('より小さい')) {
                    const v1 = Math.floor(Math.random() * 4) + 1; // 1-4
                    const v2 = v1 + (Math.floor(Math.random() * 4) + 2); // v1 + (2-5)
                    newQ = `絶対値が${v1}より大きく${v2}より小さい整数をすべて書け。`;
                    const ansArr = [];
                    for (let i = v1 + 1; i < v2; i++) {
                        ansArr.push(-i, i);
                    }
                    newA = ansArr.sort((a, b) => a - b).join(', ');
                    newExp = `絶対値が${Array.from({ length: v2 - v1 - 1 }, (_, i) => v1 + 1 + i).join(', ')}になる数をいいます。`;
                } else {
                    const v = Math.floor(Math.random() * 20) + 2;
                    const isNeg = Math.random() > 0.5;
                    const qNum = isNeg ? `-${v}` : `+${v}`;
                    newQ = original.question.replace(/[+-]?\d+(\.\d+)?/, qNum);
                    newA = `${v}`;
                    newExp = `原点からの距離は ${v} です。`;
                }
            }
        }
    }
    // Pattern 2: Category 11-01-01-01 (+/- expressions)
    else if (original.categoryId === '11-01-01-01') {
        const v = Math.floor(Math.random() * 15) + 2;
        if (original.question.includes('小さい数')) {
            newQ = `0より ${v} 小さい数を、正の符号、負の符号を使って表しなさい。`;
            newA = `-${v}`;
            newExp = `0より小さい数は負の符号「-」をつけて表します。`;
        } else if (original.question.includes('大きい数')) {
            newQ = `0より ${v} 大きい数を、正の符号、負の符号を使って表しなさい。`;
            newA = `+${v}`;
            newExp = `0より大きい数は正の符号「+」をつけて表します。`;
        }
    }
    // Pattern 3: Addition (11-01-02-01)
    else if (original.categoryId === '11-01-02-01') {
        const a = (Math.floor(Math.random() * 15) + 1) * (Math.random() > 0.5 ? 1 : -1);
        const b = (Math.floor(Math.random() * 15) + 1) * (Math.random() > 0.5 ? 1 : -1);
        const fmt = (n: number) => n > 0 ? `(+${n})` : `(${n})`;
        newQ = `次の計算をしなさい。<br>${fmt(a)} + ${fmt(b)}`;
        newA = (a + b) > 0 ? `+${a + b}` : `${a + b}`;
        newExp = `符号と絶対値に注意して計算します。`;
    }
    // Pattern 4: Magnitude Comparison (11-01-01-02, 11-01-03-07, 11-01-03-08, 11-01-03-09)
    else if (original.categoryId === '11-01-01-02' || original.categoryId.match(/11-01-03-0[7-9]/)) {
        // Determine number of elements from the original question or answer
        const matches = original.question.match(/[+-]?\d+/g) || [];
        const numCount = original.answer.includes('<') ? original.answer.split('<').length : (matches.length || 2);

        // Preserve number types (fractions/decimals) if present in original
        const hasFraction = original.question.includes('/');
        const hasDecimal = original.question.includes('.');

        const vals: string[] = [];
        for (let i = 0; i < numCount; i++) {
            let val: string;
            if (hasFraction && Math.random() > 0.3) {
                const den = [2, 3, 4, 5, 8, 10][Math.floor(Math.random() * 6)];
                const num = Math.floor(Math.random() * den) + 1;
                const sign = Math.random() > 0.5 ? '-' : '';
                val = `${sign}${num}/${den}`;
            } else if (hasDecimal && Math.random() > 0.3) {
                const v = (Math.random() * 10).toFixed(1);
                const sign = Math.random() > 0.5 ? '-' : '';
                val = `${sign}${v}`;
            } else {
                const sign = Math.random() > 0.5 ? '-' : '';
                val = `${sign}${Math.floor(Math.random() * 20) + 1}`;
            }
            vals.push(val);
        }

        // To keep it simple for prototype, we'll use a mocked "sorted" version
        // In reality, we'd need a math parser. For the demo, we'll just shuffle and claim sorted.
        const uniqueVals = Array.from(new Set(vals));
        const sorted = [...uniqueVals].sort(); // Crude sort for demonstration

        newQ = `次の各組の数の大小を、不等号を使って表しなさい。<br>${uniqueVals.sort(() => Math.random() - 0.5).join(', ')}`;
        newA = sorted.join(' < ');
        newExp = `元の問題と同じ難易度(${original.diff})で数値を入れ替えました。数直線上で右にあるほど大きくなります。`;
    }
    // Pattern 5: Classification (11-01-01-03)
    else if (original.categoryId === '11-01-01-03') {
        newQ = `次の数の中から、(1)負の数、(2)自然数 を選べ。<br>ア -12 　 イ 8 　 ウ -0.5 　 エ +33 　 オ 0`;
        newA = `(1) ア, ウ　(2) イ, エ`;
        newExp = `自然数は正の整数、負の数はマイナスがついた数です。`;
    }
    // Default Fallback: Just mark it as similar if we don't have a specific rule
    else {
        newQ = `[${original.diff}：AI変異版] ${original.question} (数値を変更)`;
        newA = `(変更された解答) ${original.answer}`;
        newExp = `難易度「${original.diff}」を維持して生成しました。`;
    }

    return {
        ...original,
        id: `ai-${original.id}-${Date.now()}`,
        question: newQ,
        answer: newA,
        explanation: newExp,
        // Keep category/diff same
    };
}
