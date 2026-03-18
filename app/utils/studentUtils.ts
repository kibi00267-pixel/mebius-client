
export interface RoleInfo {
    role: 'teacher' | 'student' | 'admin-teacher';
    grade: string; // e.g., '小1', '' for teacher
    label: string; // e.g., '小学1年', '先生'
}

export function getRoleInfo(id: string): RoleInfo | null {
    const n = parseInt(id, 10);
    if (isNaN(n)) return null;

    // Admin: 9001
    if (n === 9001) return { role: 'admin-teacher', grade: '', label: '管理者先生' };

    // Teachers: 9002-9099
    if (n >= 9002 && n <= 9099) return { role: 'teacher', grade: '', label: '先生' };

    // Students
    const grades: [number, number, string, string][] = [
        [101, 199, '小1', '小学1年'], [201, 299, '小2', '小学2年'], [301, 399, '小3', '小学3年'],
        [401, 499, '小4', '小学4年'], [501, 599, '小5', '小学5年'], [601, 699, '小6', '小学6年'],
        [701, 799, '中1', '中学1年'], [801, 899, '中2', '中学2年'], [901, 999, '中3', '中学3年'],
    ];

    for (const [lo, hi, g, l] of grades) {
        if (n >= lo && n <= hi) return { role: 'student', grade: g, label: l };
    }

    return null;
}
