'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { SeatedUser } from './components/MetaverseScene';
import { avatarPresets, getAvatarById, type AvatarStyle } from './data/avatars';

import { getRoleInfo, type RoleInfo } from './utils/studentUtils';
import { getStudents, type Student } from './data/students';
import { getTeachers, type Teacher } from './data/teachers';

const MetaverseScene = dynamic(() => import('./components/MetaverseScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#e8ddd0]">
      <div className="text-amber-700 text-lg animate-pulse">🏫 教室を準備中...</div>
    </div>
  ),
});

interface ChatMessage {
  id: number; sender: string; role: 'teacher' | 'student' | 'ai' | 'admin-teacher'; avatarEmoji: string;
  text: string; timestamp: string; isQuestion: boolean;
}
interface UserInfo {
  id: string; name: string; role: 'teacher' | 'student' | 'admin-teacher'; grade: string; label: string; avatarId: string;
}

const simStudents: { name: string; seatIndex: number; avatarId: string; studyTimeToday: string }[] = [
  { name: '田中太郎', seatIndex: 0, avatarId: 's01', studyTimeToday: '1時間15分' },
  { name: '佐藤花子', seatIndex: 1, avatarId: 's02', studyTimeToday: '45分' },
  { name: '鈴木一郎', seatIndex: 3, avatarId: 's03', studyTimeToday: '2時間10分' },
  { name: '高橋美咲', seatIndex: 5, avatarId: 's04', studyTimeToday: '20分' },
  { name: '伊藤健太', seatIndex: 7, avatarId: 's05', studyTimeToday: '1時間5分' },
  { name: '渡辺さくら', seatIndex: 8, avatarId: 's06', studyTimeToday: '55分' },
  { name: '山本翔', seatIndex: 10, avatarId: 's07', studyTimeToday: '1時間40分' },
  { name: '中村あい', seatIndex: 12, avatarId: 's08', studyTimeToday: '10分' },
  { name: '小林大地', seatIndex: 14, avatarId: 's01', studyTimeToday: '30分' },
  { name: '加藤ゆき', seatIndex: 16, avatarId: 's02', studyTimeToday: '1時間' },
];
const studentAutoMessages = [
  { name: '田中太郎', avatarId: 's01', text: '正負の数の問題、発展が難しいです…', delay: 8000 },
  { name: '佐藤花子', avatarId: 's02', text: '分数の正負の表し方がわかりません？', delay: 15000 },
  { name: '鈴木一郎', avatarId: 's03', text: '海面より低い標高ってどう表すんですか？', delay: 25000 },
  { name: '高橋美咲', avatarId: 's04', text: '宿題の範囲を教えてください？', delay: 35000 },
];

function getAIResponse(q: string): string {
  if (q.includes('正負') || q.includes('負の数')) return '正負の数は、0より大きい数を+、小さい数を-で表します。温度や標高で使います。';
  if (q.includes('分数') || q.includes('小数')) return '分数や小数も同じです。0より1/2小さい数は-1/2です。';
  if (q.includes('テスト')) return 'まずは基本問題をしっかり解いてから、標準→発展と進めましょう！';
  if (q.includes('宿題') || q.includes('範囲')) return '宿題は教科書P.15〜P.20です。わからないところがあれば聞いてください。';
  if (q.includes('海面') || q.includes('標高')) return '海面(0m)より高い→+、低い→-で表します。例：30m低い→-30m';
  if (q.includes('いつ')) return '来週月曜にミニテストを予定しています！';
  return `良い質問ですね！もう少し具体的に聞いてもらえますか？`;
}



// 2Dアバタープレビュー
function AvatarPreview({ avatar, size = 56 }: { avatar: AvatarStyle; size?: number }) {
  const s = size; const h = s * 0.38; const bw = s * 0.42; const bh = s * 0.32;
  return (
    <div style={{ width: s, height: s, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
      <div style={{ position: 'relative', width: h, height: h, marginBottom: 2 }}>
        <div style={{ width: h, height: h * 0.5, background: avatar.hairColor, borderRadius: '50% 50% 0 0', position: 'absolute', top: 0, zIndex: 2 }} />
        {avatar.hairStyle === 'long' && <div style={{ width: h * 1.15, height: h * 1.3, borderRadius: '50% 50% 40% 40%', background: avatar.hairColor, position: 'absolute', top: -h * 0.1, left: '50%', transform: 'translateX(-50%)', zIndex: 0 }} />}
        {avatar.hairStyle === 'ponytail' && <><div style={{ width: h * 0.18, height: h * 0.7, background: avatar.hairColor, position: 'absolute', top: h * 0.3, right: -h * 0.25, borderRadius: '0 50% 50% 0', zIndex: 0 }} /><div style={{ width: h * 0.14, height: h * 0.4, background: avatar.hairColor, position: 'absolute', top: h * 0.6, right: -h * 0.3, borderRadius: '50%', zIndex: 0 }} /></>}
        {avatar.hairStyle === 'spiky' && [-0.2, 0, 0.2].map((off, i) => <div key={i} style={{ width: h * 0.13, height: h * 0.3, background: avatar.hairColor, position: 'absolute', top: -h * 0.25, left: `calc(50% + ${off * h}px)`, transform: `translateX(-50%) rotate(${off * 20}deg)`, borderRadius: '50% 50% 0 0', zIndex: 3 }} />)}
        {avatar.hairStyle === 'bob' && <div style={{ width: h * 1.1, height: h * 0.85, background: avatar.hairColor, position: 'absolute', top: -h * 0.05, left: '50%', transform: 'translateX(-50%)', borderRadius: '50% 50% 30% 30%', zIndex: 0 }} />}
        {avatar.hairStyle === 'bun' && <div style={{ width: h * 0.3, height: h * 0.3, background: avatar.hairColor, position: 'absolute', top: -h * 0.3, left: '50%', transform: 'translateX(-50%)', borderRadius: '50%', zIndex: 3 }} />}
        <div style={{ width: h, height: h, background: avatar.skinColor, borderRadius: '50%', position: 'relative', zIndex: 1 }}>
          {/* 動物の耳 (2Dプレビュー用) - 全ての動物アバターに適用 */}
          {['🐰', '🦊', '🐱', '🐶', '🐻', '🐼', '🐨', '🦁', '🐵', '🐷', '🐔', '🐹', '🦉'].includes(avatar.emoji) && (
            <>
              {['🐰', '🦊', '🐱', '🐶'].includes(avatar.emoji) ? (
                <>
                  <div style={{ position: 'absolute', top: -h * 0.25, left: -h * 0.05, width: h * 0.25, height: h * 0.5, background: avatar.hairColor, borderRadius: '50% 50% 0 0', transform: 'rotate(-15deg)', zIndex: -1 }} />
                  <div style={{ position: 'absolute', top: -h * 0.25, right: -h * 0.05, width: h * 0.25, height: h * 0.5, background: avatar.hairColor, borderRadius: '50% 50% 0 0', transform: 'rotate(15deg)', zIndex: -1 }} />
                </>
              ) : (
                <>
                  <div style={{ position: 'absolute', top: -h * 0.05, left: -h * 0.15, width: h * 0.35, height: h * 0.35, background: avatar.hairColor, borderRadius: '50%', zIndex: -1 }} />
                  <div style={{ position: 'absolute', top: -h * 0.05, right: -h * 0.15, width: h * 0.35, height: h * 0.35, background: avatar.hairColor, borderRadius: '50%', zIndex: -1 }} />
                </>
              )}
            </>
          )}
          <div style={{ position: 'absolute', top: '42%', left: '28%', width: h * 0.1, height: h * 0.1, background: '#333', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', top: '42%', right: '28%', width: h * 0.1, height: h * 0.1, background: '#333', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', top: '60%', left: '50%', transform: 'translateX(-50%)', width: h * 0.18, height: h * 0.05, background: '#e8a090', borderRadius: '0 0 50% 50%' }} />
        </div>
        {avatar.accessory === 'glasses' && <div style={{ position: 'absolute', top: h * 0.35, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 1, zIndex: 5 }}><div style={{ width: h * 0.2, height: h * 0.16, border: '1.5px solid #333', borderRadius: '50%', background: 'rgba(200,220,255,0.3)' }} /><div style={{ width: h * 0.2, height: h * 0.16, border: '1.5px solid #333', borderRadius: '50%', background: 'rgba(200,220,255,0.3)' }} /></div>}
        {avatar.accessory === 'ribbon' && <div style={{ position: 'absolute', top: -h * 0.08, right: h * 0.05, zIndex: 5, fontSize: h * 0.3 }}>🎀</div>}
        {avatar.accessory === 'headband' && <div style={{ position: 'absolute', top: h * 0.05, left: '50%', transform: 'translateX(-50%)', width: h, height: h * 0.1, background: '#ef4444', borderRadius: 8, zIndex: 5 }} />}
        {avatar.accessory === 'cap' && <div style={{ position: 'absolute', top: -h * 0.12, left: '50%', transform: 'translateX(-50%)', zIndex: 5 }}><div style={{ width: h, height: h * 0.3, background: avatar.bodyColor, borderRadius: '50% 50% 0 0' }} /><div style={{ width: h * 1.2, height: h * 0.08, background: avatar.bodyColor, borderRadius: 3, marginTop: -1 }} /></div>}
      </div>
      <div style={{ width: bw, height: bh, background: avatar.bodyColor, borderRadius: `${bw * 0.3}px ${bw * 0.3}px 0 0` }}>
        <div style={{ position: 'absolute', bottom: bh * 0.6, left: '50%', transform: 'translateX(-50%)', width: bw * 0.25, height: bh * 0.18, background: '#fff', borderRadius: '0 0 50% 50%' }} />
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  // Login state
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [userId, setUserId] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarStyle | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<{ name: string; time: string } | null>(null);
  const [loginError, setLoginError] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // データ取得
  useEffect(() => {
    setStudents(getStudents());
    setTeachers(getTeachers());
  }, []);

  // Classroom state
  const [seated, setSeated] = useState(false);
  const [seatIndex, setSeatIndex] = useState(-1);
  const [seatedUsers, setSeatedUsers] = useState<SeatedUser[]>([]);

  // 初期着席ユーザー（生徒）の設定 - students 取得後に実行
  useEffect(() => {
    if (students.length > 0) {
      setSeatedUsers(students.map((s, i) => ({
        seatIndex: i * 2, // 適当な席番号
        name: s.name,
        role: 'student' as const,
        avatarId: s.avatarId
      })));
    }
  }, [students]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const msgIdRef = useRef(100);

  const roleInfo = userId.length >= 4 ? getRoleInfo(userId) : null;
  const filteredAvatars = roleInfo ? (roleInfo.role === 'teacher' ? avatarPresets.filter(a => a.id.startsWith('teacher')) : avatarPresets.filter(a => a.id.startsWith('s'))) : [];

  // ログイン共通処理
  const performLogin = useCallback((u: UserInfo) => {
    setUser(u);
    setLoggedIn(true);
    setChatOpen(true);
    sessionStorage.setItem('wakiverseUser', JSON.stringify(u));

    const now = () => new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    const msgs: ChatMessage[] = [{
      id: 1, sender: 'AI先生', role: 'ai', avatarEmoji: '🤖',
      text: `${u.name}${u.role === 'teacher' ? '先生' : 'さん'}、教室へようこそ！\n今日は「正負の数」を学習します。`,
      timestamp: now(), isQuestion: false,
    }];
    if (u.role === 'teacher' || u.role === 'admin-teacher') {
      setSeated(true); setSeatIndex(-1);
      setSeatedUsers(prev => {
        // すでに教壇に誰か（自分含む）がいる場合は重複を防ぐ
        const teacherExists = prev.some(pu => pu.role === 'teacher' || pu.role === 'admin-teacher' || pu.seatIndex === -1);
        if (teacherExists) return prev;
        return [{ seatIndex: -1, name: u.name, role: u.role, avatarId: u.avatarId }, ...prev];
      });
      msgs.push({ id: 2, sender: 'システム', role: 'ai', avatarEmoji: '📢', text: `👨‍🏫 ${u.name}先生が教壇に着席しました。`, timestamp: now(), isQuestion: false });
    }
    else {
      msgs.push({ id: 2, sender: 'システム', role: 'ai', avatarEmoji: '📢', text: '🪑 空いている席をクリックして着席してください。', timestamp: now(), isQuestion: false });
    }
    setMessages(msgs);
  }, []);

  // ログイン実行
  const handleLogin = () => {
    if (!roleInfo) { setLoginError('正しいIDを入力（先生:9001-9099, 生徒:0101-0999）'); return; }
    if (!userName.trim()) { setLoginError('名前を入力してください'); return; }
    if (!selectedAvatar) { setLoginError('アバターを選んでください'); return; }

    const s = students.find(st => st.id === userId);
    const t = teachers.find(te => te.id === userId);
    const foundUser = s || t;

    if (foundUser && foundUser.password && foundUser.password !== userPassword) {
      setLoginError('パスワードが正しくありません');
      return;
    }

    const u: UserInfo = { id: userId, name: userName.trim(), role: roleInfo.role, grade: roleInfo.grade, label: roleInfo.label, avatarId: selectedAvatar.id };
    performLogin(u);
  };

  // セッション復元
  useEffect(() => {
    const stored = sessionStorage.getItem('wakiverseUser');
    if (stored) {
      try {
        const u = JSON.parse(stored) as UserInfo;
        performLogin(u);
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }
  }, [performLogin]);

  // 自動メッセージ
  useEffect(() => {
    if (!loggedIn || !seated) return;
    const timers: NodeJS.Timeout[] = [];
    studentAutoMessages.forEach(sm => {
      const t = setTimeout(() => {
        const isQ = sm.text.includes('？');
        const now = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        setMessages(prev => [...prev, { id: msgIdRef.current++, sender: sm.name, role: 'student', avatarEmoji: getAvatarById(sm.avatarId).emoji, text: sm.text, timestamp: now, isQuestion: isQ }]);
        if (isQ) { const t2 = setTimeout(() => { setMessages(prev => [...prev, { id: msgIdRef.current++, sender: 'AI先生', role: 'ai', avatarEmoji: '🤖', text: getAIResponse(sm.text), timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }), isQuestion: false }]); }, 2000); timers.push(t2); }
      }, sm.delay);
      timers.push(t);
    });
    return () => timers.forEach(t => clearTimeout(t));
  }, [loggedIn, seated]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSeatClick = useCallback((idx: number) => {
    if (!user || seated) return;
    if (seatedUsers.some(u => u.seatIndex === idx)) return;
    setSeated(true); setSeatIndex(idx);
    setSeatedUsers(prev => {
      // 重複防止（自分と同じ名前の既存ユーザーを除去）
      const filtered = prev.filter(pu => pu.name !== user.name);
      return [...filtered, { seatIndex: idx, name: user.name, role: 'student' as any, avatarId: user.avatarId }];
    });
    setMessages(prev => [...prev, { id: msgIdRef.current++, sender: 'システム', role: 'ai', avatarEmoji: '📢', text: `🎒 ${user.name}さんが席${idx + 1}に着席！`, timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }), isQuestion: false }]);
  }, [user, seated, seatedUsers]);

  const sendMessage = () => {
    if (!inputText.trim() || !user) return;
    const isQ = inputText.includes('？') || inputText.includes('?');
    const now = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { id: msgIdRef.current++, sender: user.name, role: user.role, avatarEmoji: getAvatarById(user.avatarId).emoji, text: inputText.trim(), timestamp: now, isQuestion: isQ }]);
    const saved = inputText; setInputText('');
    if (isQ) { setTimeout(() => { setMessages(prev => [...prev, { id: msgIdRef.current++, sender: 'AI先生', role: 'ai', avatarEmoji: '🤖', text: getAIResponse(saved), timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }), isQuestion: false }]); }, 1500); }
  };

  const roleBg = (r: string) => r.includes('teacher') ? 'bg-amber-100 border-amber-300' : r === 'ai' ? 'bg-indigo-100 border-indigo-300' : 'bg-blue-100 border-blue-300';

  return (
    <div className="h-screen flex overflow-hidden bg-[#e8ddd0]">
      {/* 3Dシーン（常時表示） */}
      <div className="flex-1 relative">
        <MetaverseScene
          seatedUsers={seatedUsers}
          onSeatClick={handleSeatClick}
          onStudentClick={(name) => {
            if (name === user?.name) return; // 自分は除外
            const s = simStudents.find(st => st.name === name);
            if (s) setSelectedStudent({ name: s.name, time: s.studyTimeToday });
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
                  onClick={() => router.push('/analytics')}
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

        {/* ===== ログイン前: オーバーレイ ===== */}
        {!loggedIn && (
          <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: 'rgba(40, 30, 20, 0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="w-[440px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-stone-200 p-6">
              <div className="text-center mb-4">
                <h1 className="text-3xl font-bold"><span className="text-emerald-700">WAKI</span><span className="text-amber-800 font-light">VERSE</span></h1>
                <p className="text-stone-500 text-xs tracking-widest">バーチャル教室</p>
              </div>
              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-stone-500 mb-1">ID</label>
                  <input type="text" value={userId} onChange={e => {
                    const id = e.target.value;
                    setUserId(id);
                    setLoginError('');

                    // IDがあれば名前を自動補完（アバターは自動で変えない）
                    if (id.length === 4) {
                      const s = students.find(st => st.id === id);
                      const t = teachers.find(te => te.id === id);
                      if (s) {
                        setUserName(s.name);
                      } else if (t) {
                        setUserName(t.name);
                      }
                    }
                  }}
                    placeholder="0701" maxLength={4}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-stone-200 focus:border-emerald-500 focus:outline-none text-lg font-mono tracking-widest text-center" />
                </div>
                <div className="flex-[1.5]">
                  <label className="block text-xs font-bold text-stone-500 mb-1">パスワード</label>
                  <input type="password" value={userPassword} onChange={e => { setUserPassword(e.target.value); setLoginError(''); }}
                    placeholder="••••"
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-stone-200 focus:border-emerald-500 focus:outline-none text-lg font-mono tracking-widest text-center" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-bold text-stone-500 mb-1">なまえ</label>
                <input type="text" value={userName} onChange={e => { setUserName(e.target.value); setLoginError(''); }}
                  placeholder="なまえ"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-emerald-500 focus:outline-none text-lg font-bold text-center" />
              </div>
              {roleInfo && (
                <div className={`text-center py-1 rounded-lg text-xs font-bold mb-3 ${roleInfo.role.includes('teacher') ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                  {roleInfo.role.includes('teacher') ? '👨‍🏫' : '🎒'} {roleInfo.label}として入室
                </div>
              )}
              {filteredAvatars.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-bold text-stone-500 mb-2">アバターを選択</p>
                  <div className="grid grid-cols-5 gap-2">
                    {filteredAvatars.map(a => (
                      <button key={a.id} onClick={() => setSelectedAvatar(a)}
                        className={`p-1.5 rounded-xl border-2 transition-all hover:shadow-md ${selectedAvatar?.id === a.id ? 'border-emerald-500 bg-emerald-50 scale-105 shadow-lg' : 'border-stone-200 bg-white'}`}>
                        <div className="flex justify-center"><AvatarPreview avatar={a} size={48} /></div>
                        <p className="text-[9px] font-bold text-stone-500 text-center mt-0.5 leading-tight">{a.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {loginError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-1.5 text-center mb-2">{loginError}</p>}
              <button onClick={handleLogin} className="w-full py-2.5 rounded-xl font-bold text-white shadow-lg hover:-translate-y-0.5 transition-all"
                style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>🚪 教室に入る</button>
              <button onClick={() => window.location.href = '/create-test'}
                className="w-full mt-2 py-2 rounded-xl text-stone-500 border border-stone-200 hover:bg-stone-50 text-xs font-bold">📝 テスト作成ウィザード</button>
              <div className="mt-3 grid grid-cols-5 gap-1 text-[9px] text-stone-400 text-center">
                <span>0101:小1</span><span>0301:小3</span><span>0501:小5</span><span>0701:中1</span><span className="text-amber-600 font-bold">9001:先生</span>
              </div>
            </div>
          </div>
        )}

        {/* ===== ログイン後: トップバー ===== */}
        {loggedIn && user && (
          <>
            <div className="absolute top-3 left-3 flex gap-2 z-10">
              <div className="classroom-card px-3 py-1.5 flex items-center gap-2">
                <span className="text-lg font-bold"><span className="text-emerald-700">M</span><span className="text-amber-800">Z</span></span>
              </div>
              <div className={`classroom-card px-2 py-1.5 flex items-center gap-1.5 ${user.role.includes('teacher') ? 'bg-amber-50' : 'bg-blue-50'}`}>
                <span className="text-base">{getAvatarById(user.avatarId).emoji}</span>
                <span className="text-xs font-bold">{user.name}</span>
                <span className="text-[9px] text-stone-400">{user.label}</span>
              </div>
              {seated && (
                <div className="classroom-card px-2 py-1.5 bg-green-50 border-green-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-green-700 font-bold">{user.role === 'teacher' ? '教壇' : `席${seatIndex + 1}`}</span>
                </div>
              )}
            </div>

            {!seated && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10">
                <div className="classroom-card px-6 py-3 bg-white/95 shadow-xl border-2 border-emerald-300 text-center">
                  <p className="text-sm font-bold text-stone-800">🪑 席をクリックして着席</p>
                </div>
              </div>
            )}

            {/* 在室情報 / 出席簿 (Home画面用) */}
            <div className="absolute top-[80px] left-10 z-10 w-56">
              <div className="classroom-card bg-white/95 shadow-2xl border-2 border-stone-200 p-3">
                <div className="flex items-center justify-between mb-2 border-b-2 border-stone-100 pb-1.5">
                  <h2 className="text-xs font-extrabold text-stone-700 flex items-center gap-1.5">
                    <span className="text-base">📋</span> 出席簿
                  </h2>
                  <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">
                    {seatedUsers.length + 1} 名
                  </span>
                </div>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 flex flex-col gap-1">
                  {/* AI先生 */}
                  <div className="flex items-center gap-2 p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <span className="text-base">🤖</span>
                    <div>
                      <p className="text-[10px] font-bold text-indigo-700 leading-none">AI先生</p>
                    </div>
                  </div>
                  {/* 自分と生徒（重複防止） */}
                  {[{ name: user.name, role: user.role, avatarId: user.avatarId, isMe: true }, ...seatedUsers.filter(u => u.name !== user.name)].map((u, i) => {
                    const a = getAvatarById(u.avatarId);
                    const isTeacher = u.role.includes('teacher');
                    const isMe = 'isMe' in u && u.isMe;
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          if (isMe) return;
                          const s = simStudents.find(st => st.name === u.name);
                          if (s) setSelectedStudent({ name: s.name, time: s.studyTimeToday });
                        }}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all ${isMe ? '' : 'cursor-pointer hover:shadow-md'
                          } ${isTeacher ? 'bg-amber-50 border-amber-200' : 'bg-white border-stone-100' + (isMe ? '' : ' hover:border-emerald-200')
                          }`}
                      >
                        <span className="text-base">{a.emoji}</span>
                        <div>
                          <p className={`text-[10px] font-bold leading-none ${isTeacher ? 'text-amber-800' : 'text-stone-700'}`}>
                            {u.name}
                          </p>
                          <p className="text-[8px] text-stone-400 font-medium">
                            {isTeacher ? '先生' : '生徒'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 画面下部中央のメニュー */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
              <button onClick={() => {
                sessionStorage.removeItem('wakiverseUser');
                setLoggedIn(false); setUser(null); setSeated(false); setChatOpen(false); setMessages([]);
                setSeatedUsers(simStudents.map(s => ({ seatIndex: s.seatIndex, name: s.name, role: 'student' as const, avatarId: s.avatarId })));
              }} className="classroom-card px-4 py-2.5 text-xs font-bold text-stone-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all flex items-center gap-1.5"><span className="text-sm">🚪</span> 退室</button>

              <div className="h-8 w-[1px] bg-stone-200 mx-1" />

              <button onClick={() => router.push('/curriculum')} className="classroom-card px-4 py-2.5 text-xs font-bold text-teal-700 bg-white border-teal-100 hover:bg-teal-50 transition-all flex items-center gap-1.5 shadow-md"><span className="text-sm">📋</span> カリキュラム</button>
              <button onClick={() => router.push('/create-test')} className="classroom-card px-4 py-2.5 text-xs font-bold text-blue-700 bg-white border-blue-100 hover:bg-blue-50 transition-all flex items-center gap-1.5 shadow-md"><span className="text-sm">📝</span> テスト作成</button>
              <button onClick={() => router.push('/analytics')} className="classroom-card px-4 py-2.5 text-xs font-bold text-emerald-700 bg-white border-emerald-100 hover:bg-emerald-50 transition-all flex items-center gap-1.5 shadow-md"><span className="text-sm">📈</span> 成績管理</button>
            </div>

            {!chatOpen && (
              <button onClick={() => setChatOpen(true)} className="absolute top-3 right-3 z-10 classroom-card px-3 py-2 bg-emerald-50 border-emerald-300 font-bold text-emerald-700 text-xs shadow-lg">💬 チャット</button>
            )}
          </>
        )}
      </div>

      {/* チャットパネル */}
      {loggedIn && chatOpen && user && (
        <div className="w-[340px] flex flex-col bg-white/95 backdrop-blur border-l border-stone-200 shadow-2xl">
          <div className="p-2.5 border-b border-stone-200 bg-gradient-to-r from-emerald-50 to-blue-50 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-stone-800 text-sm">💬 教室チャット</h2>
              <p className="text-[9px] text-stone-500">「？」でAI自動回答</p>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-stone-400 hover:text-stone-600 text-sm">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-1.5 ${msg.sender === user.name ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 border ${roleBg(msg.role)}`}>{msg.avatarEmoji}</div>
                <div className={`max-w-[230px] ${msg.sender === user.name ? 'text-right' : ''}`}>
                  <div className={`flex items-center gap-1 mb-0.5 ${msg.sender === user.name ? 'justify-end' : ''}`}>
                    <span className="text-[9px] font-bold text-stone-600">{msg.sender}</span>
                    <span className="text-[9px] text-stone-400">{msg.timestamp}</span>
                    {msg.isQuestion && <span className="text-[9px] bg-red-100 text-red-600 px-0.5 rounded">❓</span>}
                  </div>
                  <div className={`text-xs p-2 rounded-xl leading-relaxed whitespace-pre-wrap ${msg.role === 'ai' ? 'bg-indigo-50 border border-indigo-200 text-indigo-900' :
                    msg.sender === user.name ? 'bg-emerald-500 text-white' :
                      msg.role.includes('teacher') ? 'bg-amber-50 border border-amber-200' : 'bg-stone-100 text-stone-800'
                    }`}>{msg.text}</div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="px-2 py-1 border-t border-stone-100 flex gap-1 flex-wrap">
            {user.role === 'student' ? (
              <>
                <button onClick={() => setInputText('正負の数がわかりません？')} className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">正負の数？</button>
                <button onClick={() => setInputText('テスト範囲は？')} className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">テスト範囲？</button>
              </>
            ) : (
              <>
                <button onClick={() => setInputText('質問はありますか？')} className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">質問募集</button>
                <button onClick={() => setInputText('宿題は教科書P.15〜P.20です。')} className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">宿題連絡</button>
              </>
            )}
          </div>
          <div className="p-2 border-t border-stone-200 bg-stone-50 flex gap-1.5">
            <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="メッセージ..." className="flex-1 px-2.5 py-2 rounded-xl border border-stone-200 focus:border-emerald-500 focus:outline-none text-xs bg-white" />
            <button onClick={sendMessage} className="px-3 py-2 rounded-xl font-bold text-white text-xs"
              style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>送信</button>
          </div>
        </div>
      )}
    </div>
  );
}
