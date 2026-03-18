
export interface Teacher {
    id: string;
    name: string;
    role: 'teacher' | 'admin-teacher';
    avatarId: string;
    password?: string;
}

export const teachers: Teacher[] = [
    {
        id: "9001",
        name: "脇",
        role: "admin-teacher",
        avatarId: "teacher-1",
        password: "9001"
    },
    {
        id: "9002",
        name: "佐藤 先生",
        role: "teacher",
        avatarId: "teacher-2",
        password: "9002"
    }
];

export function getTeachers(): Teacher[] {
    return teachers;
}
