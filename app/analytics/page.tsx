'use client';

export default function AnalyticsPage() {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 shadow-sm">
                <button onClick={() => window.location.href = '/'} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
                <h1 className="text-lg font-bold text-pink-600">📊 成績分析</h1>
            </header>
            <main className="max-w-4xl mx-auto p-8">
                <div className="grid grid-cols-3 gap-6 mb-8">
                    {[
                        { label: '平均正答率', value: '72%', color: 'text-blue-600' },
                        { label: 'テスト回数', value: '12回', color: 'text-violet-600' },
                        { label: '苦手分野', value: '3単元', color: 'text-pink-600' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-700 mb-4">苦手分野ランキング</h3>
                    <div className="space-y-3">
                        {[
                            { name: '連立方程式 - 代入法', rate: 45 },
                            { name: '式の計算 - 文字式の利用', rate: 52 },
                            { name: '一次関数 - グラフの読み取り', rate: 58 },
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-700">{i + 1}. {item.name}</span>
                                    <span className="text-pink-600 font-bold">{item.rate}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-gradient-to-r from-pink-500 to-rose-400 h-2 rounded-full transition-all" style={{ width: `${item.rate}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
