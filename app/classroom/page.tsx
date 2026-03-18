'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { SeatedUser } from '../components/MetaverseScene';
import { avatarPresets, getAvatarById } from '../data/avatars';
import { getStudents, type Student } from '../data/students';

const MetaverseScene = dynamic(() => import('../components/MetaverseScene'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-[#e8ddd0]">
            <div className="text-amber-700 text-lg animate-pulse">🏫 教室を準備中...</div>
        </div>
    ),
});

interface ChatMessage {
    id: number;
    sender: string;
    role: 'teacher' | 'student' | 'ai' | 'admin-teacher';
    avatarEmoji: string;
    text: string;
    timestamp: string;
    isQuestion: boolean;
}

interface UserInfo {
    id: string;
    name: string;
    role: 'teacher' | 'student' | 'ai' | 'admin-teacher';
    grade: string;
    label: string;
    avatarId: string;
}


const studentAutoMessages = [
    { name: '田中太郎', avatarId: 's01', text: '正負の数の問題、基本はわかるけど発展が難しいです…', delay: 8000 },
    { name: '佐藤花子', avatarId: 's02', text: '分数の正負の表し方がわかりません？', delay: 15000 },
    { name: '鈴木一郎', avatarId: 's03', text: '海面より低い標高ってどう表すんですか？', delay: 25000 },
    { name: '高橋美咲', avatarId: 's04', text: '宿題の範囲を教えてください？', delay: 35000 },
    { name: '伊藤健太', avatarId: 's05', text: 'テストいつですか？', delay: 45000 },
];

function getAIResponse(question: string): string {
    const q = question.toLowerCase();
    if (q.includes('正負') || q.includes('マイナス') || q.includes('負の数'))
        return '正負の数についてですね！0より大きい数を正の数（+）、0より小さい数を負の数（-）で表します。温度や標高など、基準から上下する量を表すときに便利です。';
    if (q.includes('分数') || q.includes('小数'))
        return '分数や小数でも考え方は同じです。0 より 1/2 小さい数は -1/2 と表します。';
    if (q.includes('テスト') || q.includes('試験'))
        return 'テストの準備ですか？まずは基本問題をしっかり解いてから、標準→発展と進めましょう！';
    if (q.includes('わからない') || q.includes('教えて'))
        return 'どの部分がわからないか、もう少し具体的に聞いてください。一緒に解いていきましょう！';
    if (q.includes('宿題') || q.includes('課題') || q.includes('範囲'))
        return '宿題は教科書P.15〜P.20の正負の数の基本問題です。わからないところがあれば聞いてくださいね。';
    if (q.includes('海面') || q.includes('標高'))
        return '海面を基準（0m）として、高い地点を +、低い地点を - で表します。例：海面より30m低い → -30m です。';
    if (q.includes('いつ'))
        return '来週月曜にミニテストを予定しています。基本問題中心です！';
    return `良い質問です！「${question.slice(0, 20)}」について、教科書の関連ページを確認してみましょう。`;
}

export default function ClassroomPage() {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [seated, setSeated] = useState(false);
    const [seatIndex, setSeatIndex] = useState<number>(-1);
    const [students, setStudents] = useState<Student[]>([]);
    const [seatedUsers, setSeatedUsers] = useState<SeatedUser[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<{ name: string; time: string } | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [chatOpen, setChatOpen] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const msgIdRef = useRef(100);

    useEffect(() => {
        const stored = sessionStorage.getItem('wakiverseUser');
        if (!stored) { window.location.href = '/'; return; }
        const u: UserInfo = JSON.parse(stored);
        setUser(u);

        const sData = getStudents();
        setStudents(sData);

        const simSeated: SeatedUser[] = sData.map((s, i) => ({
            seatIndex: i * 2, name: s.name, role: 'student' as const, avatarId: s.avatarId,
        }));

        const now = () => new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        const greetings: ChatMessage[] = [{
            id: 1, sender: 'AI先生', role: 'ai', avatarEmoji: '🤖',
            text: `おはようございます！${u.name}${u.role === 'teacher' ? '先生' : 'さん'}、教室へようこそ！\n今日は「正負の数」を学習します。`,
            timestamp: now(), isQuestion: false,
        }];

        if (u.role === 'teacher' || u.role === 'admin-teacher') {
            setSeated(true);
            setSeatIndex(-1);
            setSeatedUsers([{ seatIndex: -1, name: u.name, role: u.role as any, avatarId: u.avatarId }, ...simSeated]);
            greetings.push({
                id: 2, sender: 'システム', role: 'ai', avatarEmoji: '📢',
                text: `👨‍🏫 ${u.name}先生が教壇に着席しました。生徒${sData.length}名が在席中です。`,
                timestamp: now(), isQuestion: false,
            });
        }
        else {
            setSeatedUsers(simSeated);
            greetings.push({
                id: 2, sender: 'システム', role: 'ai', avatarEmoji: '📢',
                text: '🪑 空いている席をクリックして着席してください。',
                timestamp: now(), isQuestion: false,
            });
        }
        setMessages(greetings);
    }, []);

    // シミュレーション生徒の自動メッセージ
    useEffect(() => {
        if (!user || !seated) return;
        const timers: NodeJS.Timeout[] = [];
        studentAutoMessages.forEach(sm => {
            const t = setTimeout(() => {
                const isQ = sm.text.includes('？') || sm.text.includes('?');
                const now = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
                const avatarInfo = getAvatarById(sm.avatarId);
                setMessages(prev => [...prev, {
                    id: msgIdRef.current++, sender: sm.name, role: 'student',
                    avatarEmoji: avatarInfo.emoji, text: sm.text, timestamp: now, isQuestion: isQ,
                }]);
                if (isQ) {
                    const t2 = setTimeout(() => {
                        setMessages(prev => [...prev, {
                            id: msgIdRef.current++, sender: 'AI先生', role: 'ai',
                            avatarEmoji: '🤖', text: getAIResponse(sm.text),
                            timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
                            isQuestion: false,
                        }]);
                    }, 2000);
                    timers.push(t2);
                }
            }, sm.delay);
            timers.push(t);
        });
        return () => timers.forEach(t => clearTimeout(t));
    }, [user, seated]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const handleSeatClick = useCallback((idx: number) => {
        if (!user || seated) return;
        if (seatedUsers.some(u => u.seatIndex === idx)) return;
        if (user.role === 'student') {
            setSeated(true);
            setSeatIndex(idx);
            setSeatedUsers(prev => {
                // 重複防止（自分と同じ名前の既存ユーザーを除去）
                const filtered = prev.filter(pu => pu.name !== user.name);
                return [...filtered, { seatIndex: idx, name: user.name, role: 'student', avatarId: user.avatarId }];
            });
            setMessages(prev => [...prev, {
                id: msgIdRef.current++, sender: 'システム', role: 'ai', avatarEmoji: '📢',
                text: `🎒 ${user.name}さんが席${idx + 1}に着席しました！`,
                timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
                isQuestion: false,
            }]);
        }
    }, [user, seated, seatedUsers]);

    const sendMessage = () => {
        if (!inputText.trim() || !user) return;
        const isQ = inputText.includes('？') || inputText.includes('?') || inputText.endsWith('か');
        const now = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        const myAvatar = getAvatarById(user.avatarId);
        setMessages(prev => [...prev, {
            id: msgIdRef.current++, sender: user.name, role: user.role,
            avatarEmoji: myAvatar.emoji, text: inputText.trim(), timestamp: now, isQuestion: isQ,
        }]);
        const saved = inputText;
        setInputText('');
        if (isQ) {
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: msgIdRef.current++, sender: 'AI先生', role: 'ai',
                    avatarEmoji: '🤖', text: getAIResponse(saved),
                    timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
                    isQuestion: false,
                }]);
            }, 1500);
        }
    };

    if (!user) return null;

    const myAvatar = getAvatarById(user.avatarId);
    const roleBg = (r: string) => r === 'teacher' ? 'bg-amber-100 border-amber-300' : r === 'ai' ? 'bg-indigo-100 border-indigo-300' : 'bg-blue-100 border-blue-300';

    return (
        <div className="h-screen flex overflow-hidden bg-[#e8ddd0]">
            <div className="flex-1 relative">
                <MetaverseScene
                    seatedUsers={seatedUsers}
                    onSeatClick={handleSeatClick}
                    onStudentClick={(name) => {
                        if (name === user?.name) return;
                        const s = students.find(st => st.name === name);
                        if (s) setSelectedStudent({ name: s.name, time: s.studyTimeToday || '0分' });
                    }}
                />

                {/* 生徒ステータスポップアップ */}
                {selectedStudent && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                        <div className="classroom-card bg-white/95 shadow-2xl border-2 border-emerald-400 p-6 w-72 text-center animate-in zoom-in duration-200">
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="absolute top-2 right-2 text-stone-400 hover:text-stone-600 p-1"
                            >✕</button>
                            <div className="text-4xl mb-3">🎒</div>
                            <h3 className="text-lg font-extrabold text-stone-800 mb-1">{selectedStudent.name} さん</h3>
                            <p className="text-[10px] text-stone-500 font-bold mb-4 tracking-widest uppercase">STUDY STATUS</p>

                            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                                <p className="text-[11px] text-emerald-600 font-bold mb-1">本日の学習時間</p>
                                <p className="text-2xl font-black text-emerald-700">{selectedStudent.time}</p>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => window.location.href = '/analytics'}
                                    className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-bold text-stone-600 transition-colors"
                                >📊 詳しく見る</button>
                                <button
                                    onClick={() => {
                                        setChatOpen(true);
                                        setSelectedStudent(null);
                                        setInputText(`@${selectedStudent.name} `);
                                    }}
                                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-xs font-bold text-white shadow-md transition-all"
                                >💬 メッセージ</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* トップバー */}
                <div className="absolute top-4 left-4 flex gap-3 z-10">
                    <div className="classroom-card px-4 py-2">
                        <h1 className="text-lg font-bold"><span className="text-emerald-700">WAKI</span><span className="text-amber-800 font-light">VERSE</span></h1>
                    </div>
                    <div className={`classroom-card px-3 py-2 flex items-center gap-2 ${user.role === 'teacher' ? 'bg-amber-50 border-amber-300' : 'bg-blue-50 border-blue-300'}`}>
                        <span className="text-xl">{myAvatar.emoji}</span>
                        <div>
                            <span className="text-sm font-bold">{user.name}</span>
                            <span className="block text-[10px] text-stone-500">{user.label} / {myAvatar.name}</span>
                        </div>
                    </div>
                    {seated && (
                        <div className="classroom-card px-3 py-2 bg-green-50 border-green-300 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-green-700 font-bold">
                                {user.role === 'teacher' ? '教壇に着席中' : `席${seatIndex + 1}に着席中`}
                            </span>
                        </div>
                    )}
                </div>

                {/* 在室情報 / 出席簿 */}
                <div className="absolute top-[80px] left-10 z-10 w-64">
                    <div className="classroom-card bg-white/95 shadow-2xl border-2 border-stone-200 p-4">
                        <div className="flex items-center justify-between mb-3 border-b-2 border-stone-100 pb-2">
                            <h2 className="text-sm font-extrabold text-stone-700 flex items-center gap-2">
                                <span className="text-lg">📋</span> 出席簿
                            </h2>
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                                {seatedUsers.length + 1} 名
                            </span>
                        </div>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                            {/* AI先生を表示 */}
                            <div className="flex items-center gap-3 p-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                                <span className="text-xl">🤖</span>
                                <div>
                                    <p className="text-[11px] font-bold text-indigo-700 leading-none mb-1">AI先生</p>
                                    <p className="text-[9px] text-indigo-400 font-medium">アシスタント</p>
                                </div>
                            </div>
                            {/* 自分と生徒を表示（重複させない） */}
                            {[
                                { name: user.name, role: user.role, avatarId: user.avatarId, isMe: true },
                                ...seatedUsers.filter(u => u.name !== user.name)
                            ].map((u, i) => {
                                const a = getAvatarById(u.avatarId);
                                const isTeacher = u.role === 'teacher';
                                const isMe = 'isMe' in u && u.isMe;
                                return (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            if (isMe) return;
                                            const s = students.find(st => st.name === u.name);
                                            if (s) setSelectedStudent({ name: s.name, time: s.studyTimeToday || '0分' });
                                        }}
                                        className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${isMe ? '' : 'cursor-pointer hover:shadow-md'
                                            } ${isTeacher ? 'bg-amber-50 border-amber-200' : 'bg-white border-stone-100' + (isMe ? '' : ' hover:border-emerald-200')
                                            }`}
                                    >
                                        <span className="text-xl">{a.emoji}</span>
                                        <div>
                                            <p className={`text-[11px] font-bold leading-none mb-1 ${isTeacher ? 'text-amber-800' : 'text-stone-700'
                                                }`}>
                                                {u.name}{isMe ? '（あなた）' : ''}
                                            </p>
                                            <p className="text-[9px] text-stone-400 font-medium">
                                                {isTeacher ? '先生' : '生徒'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {!seated && (
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
                        <div className="classroom-card px-8 py-4 text-center bg-white/95 shadow-xl border-2 border-emerald-300">
                            <p className="text-base font-bold text-stone-800 mb-1">🪑 空いている席をクリックして着席</p>
                            <p className="text-xs text-stone-500">アバターが表示されている席は着席済みです</p>
                        </div>
                    </div>
                )}

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
                    <button onClick={() => {
                        sessionStorage.removeItem('wakiverseUser');
                        window.location.href = '/';
                    }} className="classroom-card px-4 py-2.5 text-xs font-bold text-stone-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all flex items-center gap-1.5"><span className="text-sm">🚪</span> 退室</button>

                    <div className="h-8 w-[1px] bg-stone-200 mx-1" />

                    <button onClick={() => window.location.href = '/curriculum'} className="classroom-card px-4 py-2.5 text-xs font-bold text-teal-700 bg-white border-teal-100 hover:bg-teal-50 transition-all flex items-center gap-1.5 shadow-md"><span className="text-sm">📋</span> カリキュラム</button>
                    <button onClick={() => window.location.href = '/create-test'} className="classroom-card px-4 py-2.5 text-xs font-bold text-blue-700 bg-white border-blue-100 hover:bg-blue-50 transition-all flex items-center gap-1.5 shadow-md"><span className="text-sm">📝</span> テスト作成</button>
                    <button onClick={() => window.location.href = '/analytics'} className="classroom-card px-4 py-2.5 text-xs font-bold text-emerald-700 bg-white border-emerald-100 hover:bg-emerald-50 transition-all flex items-center gap-1.5 shadow-md"><span className="text-sm">📊</span> 成績分析</button>
                </div>

                {!chatOpen && (
                    <button onClick={() => setChatOpen(true)}
                        className="absolute top-4 right-4 z-10 classroom-card px-4 py-3 bg-emerald-50 border-emerald-300 font-bold text-emerald-700 shadow-lg">
                        💬 チャット
                    </button>
                )}
            </div>

            {/* チャットパネル */}
            {chatOpen && (
                <div className="w-[380px] flex flex-col bg-white/95 backdrop-blur border-l border-stone-200 shadow-2xl">
                    <div className="p-3 border-b border-stone-200 bg-gradient-to-r from-emerald-50 to-blue-50 flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-stone-800 text-sm">💬 教室チャット</h2>
                            <p className="text-[10px] text-stone-500">「？」を含むメッセージにAIが自動回答</p>
                        </div>
                        <button onClick={() => setChatOpen(false)} className="text-stone-400 hover:text-stone-600">✕</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex gap-2 ${msg.sender === user.name ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 border ${roleBg(msg.role)}`}>
                                    {msg.avatarEmoji}
                                </div>
                                <div className={`max-w-[260px] ${msg.sender === user.name ? 'text-right' : ''}`}>
                                    <div className={`flex items-center gap-1 mb-0.5 ${msg.sender === user.name ? 'justify-end' : ''}`}>
                                        <span className="text-[10px] font-bold text-stone-600">{msg.sender}</span>
                                        <span className="text-[10px] text-stone-400">{msg.timestamp}</span>
                                        {msg.isQuestion && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold">❓</span>}
                                    </div>
                                    <div className={`text-sm p-2.5 rounded-xl leading-relaxed whitespace-pre-wrap ${msg.role === 'ai' ? 'bg-indigo-50 border border-indigo-200 text-indigo-900' :
                                        msg.sender === user.name ? 'bg-emerald-500 text-white' :
                                            msg.role === 'teacher' ? 'bg-amber-50 border border-amber-200 text-amber-900' :
                                                'bg-stone-100 text-stone-800'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="px-3 py-1.5 border-t border-stone-100 flex gap-1 flex-wrap">
                        {user.role === 'student' ? (
                            <>
                                <button onClick={() => setInputText('正負の数がわかりません？')} className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100">正負の数？</button>
                                <button onClick={() => setInputText('分数の正負を教えてください？')} className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100">分数の正負？</button>
                                <button onClick={() => setInputText('テスト範囲はどこですか？')} className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100">テスト範囲？</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setInputText('今日の授業について質問はありますか？')} className="text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100">質問募集</button>
                                <button onClick={() => setInputText('宿題は教科書P.15〜P.20です。')} className="text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100">宿題連絡</button>
                                <button onClick={() => setInputText('来週ミニテストをします。範囲は正負の数です。')} className="text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100">テスト連絡</button>
                            </>
                        )}
                    </div>

                    <div className="p-3 border-t border-stone-200 bg-stone-50">
                        <div className="flex gap-2">
                            <input type="text" value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                placeholder={user.role === 'teacher' ? '生徒への連絡・回答...' : '先生への質問...'}
                                className="flex-1 px-3 py-2.5 rounded-xl border border-stone-200 focus:border-emerald-500 focus:outline-none text-sm bg-white" />
                            <button onClick={sendMessage}
                                className="px-4 py-2.5 rounded-xl font-bold text-white text-sm shadow-md"
                                style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>送信</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
