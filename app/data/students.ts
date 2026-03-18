
export interface Student {
    id: string;
    name: string;
    grade: string;
    targetSubject: string;
    avatarId: string;
    curriculum: string[]; // List of assigned test IDs or category names
    studyTimeToday: string; // e.g. "1時間20分"
    password?: string;
}

export const students: Student[] = [
    {
        id: "0701",
        name: "田中 太郎",
        grade: "中1",
        targetSubject: "math",
        avatarId: "s01",
        curriculum: [
            "11-01-01",
            "11-01-03"
        ],
        studyTimeToday: "1時間15分",
        password: "0701"
    },
    {
        id: "0702",
        name: "佐藤 花子",
        grade: "中1",
        targetSubject: "math",
        avatarId: "s02",
        curriculum: [
            "11-01-01"
        ],
        studyTimeToday: "45分",
        password: "0702"
    },
    {
        id: "0801",
        name: "鈴木 一郎",
        grade: "中2",
        targetSubject: "math",
        avatarId: "s03",
        curriculum: [],
        studyTimeToday: "2時間10分",
        password: "0801"
    },
    {
        id: "0901",
        name: "高橋 美咲",
        grade: "中3",
        targetSubject: "math",
        avatarId: "s04",
        curriculum: [],
        studyTimeToday: "20分",
        password: "0901"
    },
    {
        id: "0703",
        name: "伊藤 健太",
        grade: "中1",
        targetSubject: "math",
        avatarId: "s05",
        curriculum: [],
        studyTimeToday: "1時間5分",
        password: "0703"
    },
    {
        id: "0704",
        name: "渡辺 さくら",
        grade: "中1",
        targetSubject: "math",
        avatarId: "s06",
        curriculum: [],
        studyTimeToday: "55分",
        password: "0704"
    },
    {
        id: "0802",
        name: "山本 翔",
        grade: "中2",
        targetSubject: "math",
        avatarId: "s07",
        curriculum: [],
        studyTimeToday: "1時間40分",
        password: "0802"
    },
    {
        id: "0902",
        name: "中村 あい",
        grade: "中3",
        targetSubject: "math",
        avatarId: "s08",
        curriculum: [],
        studyTimeToday: "10分",
        password: "0902"
    }
];

export function getStudents(): Student[] {
    return students;
}
