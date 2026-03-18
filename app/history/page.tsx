'use client';

export default function HistoryPage() {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 shadow-sm">
                <button onClick={() => window.location.href = '/'} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
                <h1 className="text-lg font-bold text-violet-600">📋 テスト履歴</h1>
            </header>
            <main className="max-w-4xl mx-auto p-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
                    {[
                        { name: '中2数学 式の計算 確認テスト', date: '2026/02/08', count: 10, status: '完了' },
                        { name: '中2数学 連立方程式 小テスト', date: '2026/02/05', count: 5, status: '印刷済み' },
                        { name: '中1数学 方程式 まとめテスト', date: '2026/01/28', count: 20, status: '完了' },
                    ].map((t, i) => (
                        <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-all">
                            <div>
                                <p className="font-bold text-gray-800">{t.name}</p>
                                <p className="text-xs text-gray-400">{t.date} ・ {t.count}問</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${t.status === '完了' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                {t.status}
                            </span>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
