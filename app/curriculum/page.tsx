'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { students as mockStudents, type Student } from '../data/students';
import { teachers as mockTeachers, type Teacher } from '../data/teachers';
import { getAvatarById, avatarPresets } from '../data/avatars';

export default function CurriculumPage() {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>(mockStudents);
    const [teachers, setTeachers] = useState<Teacher[]>(mockTeachers);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [selectedGrade, setSelectedGrade] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [registerData, setRegisterData] = useState({ name: '', id: '', type: 'student', grade: '中1' });

    useEffect(() => {
        const stored = sessionStorage.getItem('wakiverseUser');
        if (stored) setCurrentUser(JSON.parse(stored));
    }, []);

    const isTeacher = currentUser?.role === 'teacher' || currentUser?.role === 'admin-teacher';
    const isAdmin = currentUser?.role === 'admin-teacher';

    const grades = ['all', '小1', '小2', '小3', '小4', '小5', '小6', '中1', '中2', '中3'];

    const filteredStudents = isTeacher
        ? (selectedGrade === 'all' ? students : students.filter(s => s.grade === selectedGrade))
        : students.filter(s => s.id === currentUser?.id);

    const deleteStudent = (id: string) => {
        if (confirm('この生徒を削除しますか？')) {
            setStudents(prev => prev.filter(s => s.id !== id));
        }
    };

    const deleteTeacher = (id: string) => {
        if (!isAdmin) return;
        if (confirm('この先生を削除しますか？')) {
            setTeachers(prev => prev.filter(t => t.id !== id));
        }
    };

    const handleRegister = () => {
        if (!registerData.name || !registerData.id) return;
        if (registerData.type === 'student') {
            const newStudent: Student = {
                id: registerData.id,
                name: registerData.name,
                grade: registerData.grade,
                targetSubject: 'math',
                avatarId: 's01', // Default animal
                curriculum: [],
                studyTimeToday: '0分',
                password: registerData.id // Initial password is ID
            };
            setStudents(prev => [...prev, newStudent]);
        } else {
            const newTeacher: Teacher = {
                id: registerData.id,
                name: registerData.name,
                role: 'teacher',
                avatarId: 'teacher-1',
                password: registerData.id // Initial password is ID
            };
            setTeachers(prev => [...prev, newTeacher]);
        }
        setShowRegisterModal(false);
        setRegisterData({ name: '', id: '', type: 'student', grade: '中1' });
    };

    const updatePassword = (id: string, newPassword: string, type: 'student' | 'teacher') => {
        if (!isAdmin) return;
        if (type === 'student') {
            setStudents(prev => prev.map(s => s.id === id ? { ...s, password: newPassword } : s));
        } else {
            setTeachers(prev => prev.map(t => t.id === id ? { ...t, password: newPassword } : t));
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <button onClick={() => router.push('/classroom')} className="text-slate-400 hover:text-slate-600 font-bold text-lg">← 教室に戻る</button>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">📋</span>
                            カリキュラム・生徒管理
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        {isTeacher && (
                            <>
                                <button onClick={() => setShowRegisterModal(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95">新規登録</button>
                                <button onClick={() => router.push('/create-test')} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95">新規テスト作成</button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-8">
                {/* Tabs */}
                {isAdmin && (
                    <div className="flex gap-4 border-b border-slate-200">
                        <button onClick={() => setActiveTab('students')}
                            className={`px-8 py-4 font-black transition-all border-b-4 ${activeTab === 'students' ? 'border-emerald-500 text-emerald-600 bg-emerald-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                            生徒管理
                        </button>
                        {isTeacher && (
                            <button onClick={() => setActiveTab('teachers')}
                                className={`px-8 py-4 font-black transition-all border-b-4 ${activeTab === 'teachers' ? 'border-emerald-500 text-emerald-600 bg-emerald-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                先生管理
                            </button>
                        )}
                    </div>
                )}

                {activeTab === 'students' ? (
                    <>
                        {/* Filters */}
                        {isTeacher && (
                            <div className="mb-8 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">学年フィルタ:</span>
                                <div className="flex flex-wrap gap-2">
                                    {grades.map(g => (
                                        <button key={g} onClick={() => setSelectedGrade(g)}
                                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${selectedGrade === g ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200'}`}>
                                            {g === 'all' ? '全員' : g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Student Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredStudents.map(student => {
                                const avatar = getAvatarById(student.avatarId);
                                return (
                                    <div key={student.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden group relative">
                                        <button
                                            onClick={() => deleteStudent(student.id)}
                                            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-full border border-red-100 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all z-10 shadow-sm"
                                            title="削除"
                                        >✕</button>
                                        <div className="p-6">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl shadow-inner border border-slate-100 group-hover:scale-110 transition-transform">
                                                    {avatar.emoji}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-1">{student.id} / {student.grade}</p>
                                                    <h3 className="text-lg font-black text-slate-800">{student.name}</h3>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">学習中のカリキュラム</p>
                                                    <div className="flex flex-wrap gap-2 min-h-[60px]">
                                                        {student.curriculum.length > 0 ? (
                                                            student.curriculum.map(curr => (
                                                                <span key={curr} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-100">
                                                                    {curr === '11-01-01' ? '正負の数の表し方' : curr === '11-01-03' ? '正負の数の大小' : curr}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <p className="text-xs text-slate-400 italic">未割り当て</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {isAdmin && (
                                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ログインパスワード</span>
                                                            <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">要管理</span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={student.password || ''}
                                                            onChange={(e) => updatePassword(student.id, e.target.value, 'student')}
                                                            className="w-full text-xs font-mono bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                                            placeholder="パスワードを入力"
                                                        />
                                                    </div>
                                                )}

                                                <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                                                    <span className={`px-2 py-1 rounded-full font-bold ${student.targetSubject === 'math' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100'}`}>
                                                        {student.targetSubject === 'math' ? '🧮 数学' : student.targetSubject}
                                                    </span>
                                                    <button className="text-slate-400 hover:text-slate-800 font-bold transition-colors">詳細・編集 →</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <span className="text-2xl">👨‍🏫</span> 先生一覧
                            </h2>
                        </div>
                        {/* Teacher Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {teachers.map(teacher => {
                                const avatar = getAvatarById(teacher.avatarId);
                                return (
                                    <div key={teacher.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden group relative">
                                        <button
                                            onClick={() => deleteTeacher(teacher.id)}
                                            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-full border border-red-100 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all z-10 shadow-sm"
                                            title="削除"
                                        >✕</button>
                                        <div className="p-6 text-center">
                                            <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 flex items-center justify-center text-4xl mb-4 border border-amber-100 shadow-inner group-hover:scale-110 transition-transform">
                                                {avatar.emoji}
                                            </div>
                                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">{teacher.id} / {teacher.role === 'admin-teacher' ? '管理者' : '先生'}</p>
                                            <h3 className="text-xl font-black text-slate-800 mb-4">{teacher.name} 先生</h3>

                                            {isAdmin && (
                                                <div className="mb-4 p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-left">
                                                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1.5">管理者用パスワード設定</p>
                                                    <input
                                                        type="text"
                                                        value={teacher.password || ''}
                                                        onChange={(e) => updatePassword(teacher.id, e.target.value, 'teacher')}
                                                        className="w-full text-xs font-mono bg-white border border-amber-200 px-2.5 py-1.5 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                                    />
                                                </div>
                                            )}

                                            <button className="w-full py-2 bg-slate-50 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors">設定・権限</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {filteredStudents.length === 0 && activeTab === 'students' && (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 font-bold">該当する生徒が見つかりません</p>
                    </div>
                )}
            </main>

            {/* Registration Modal */}
            {showRegisterModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 bg-slate-50 border-b border-slate-100">
                            <h2 className="text-xl font-black text-slate-800">新規ユーザー作成</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">種類</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setRegisterData(d => ({ ...d, type: 'student' }))} className={`flex-1 py-2 rounded-lg font-bold text-sm ${registerData.type === 'student' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>生徒</button>
                                    {isAdmin && <button onClick={() => setRegisterData(d => ({ ...d, type: 'teacher' }))} className={`flex-1 py-2 rounded-lg font-bold text-sm ${registerData.type === 'teacher' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>先生</button>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">ID (4桁の数字)</label>
                                <input type="text" value={registerData.id} onChange={e => setRegisterData(d => ({ ...d, id: e.target.value }))} className="w-full px-4 py-2 rounded-xl border border-slate-200" placeholder="0101" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">氏名</label>
                                <input type="text" value={registerData.name} onChange={e => setRegisterData(d => ({ ...d, name: e.target.value }))} className="w-full px-4 py-2 rounded-xl border border-slate-200" placeholder="山田 太郎" />
                            </div>
                            {registerData.type === 'student' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">学年</label>
                                    <select value={registerData.grade} onChange={e => setRegisterData(d => ({ ...d, grade: e.target.value }))} className="w-full px-4 py-2 rounded-xl border border-slate-200">
                                        {grades.filter(g => g !== 'all').map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-slate-50 flex gap-3">
                            <button onClick={() => setShowRegisterModal(false)} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">キャンセル</button>
                            <button onClick={handleRegister} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg active:scale-95">作成する</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
