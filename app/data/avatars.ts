// アバター定義

export interface AvatarStyle {
    id: string;
    name: string;
    skinColor: string;
    hairColor: string;
    hairStyle: 'short' | 'long' | 'ponytail' | 'spiky' | 'bob' | 'bun';
    bodyColor: string;
    accessory: 'none' | 'glasses' | 'ribbon' | 'headband' | 'cap';
    emoji: string; // 2Dプレビュー用
}

export const avatarPresets: AvatarStyle[] = [
    // 生徒用（動物シリーズ）
    { id: 's01', name: 'クマ', skinColor: '#8B4513', hairColor: '#5D2906', hairStyle: 'short', bodyColor: '#3b82f6', accessory: 'none', emoji: '🐻' },
    { id: 's02', name: 'ウサギ', skinColor: '#FFF0F5', hairColor: '#FFB6C1', hairStyle: 'short', bodyColor: '#ec4899', accessory: 'none', emoji: '🐰' },
    { id: 's03', name: 'ネコ', skinColor: '#FFDAB9', hairColor: '#F4A460', hairStyle: 'short', bodyColor: '#22c55e', accessory: 'none', emoji: '🐱' },
    { id: 's04', name: 'イヌ', skinColor: '#D2B48C', hairColor: '#8B4513', hairStyle: 'short', bodyColor: '#f97316', accessory: 'none', emoji: '🐶' },
    { id: 's05', name: 'パンダ', skinColor: '#FFFFFF', hairColor: '#000000', hairStyle: 'short', bodyColor: '#6366f1', accessory: 'none', emoji: '🐼' },
    { id: 's06', name: 'キツネ', skinColor: '#FF8C00', hairColor: '#FFFFFF', hairStyle: 'short', bodyColor: '#a855f7', accessory: 'none', emoji: '🦊' },
    { id: 's07', name: 'コアラ', skinColor: '#A9A9A9', hairColor: '#808080', hairStyle: 'short', bodyColor: '#f59e0b', accessory: 'none', emoji: '🐨' },
    { id: 's08', name: 'ライオン', skinColor: '#FFD700', hairColor: '#CD853F', hairStyle: 'short', bodyColor: '#14b8a6', accessory: 'none', emoji: '🦁' },

    // 先生用（動物シリーズ 20種類）
    { id: 'teacher-01', name: 'イヌ先生', skinColor: '#D2B48C', hairColor: '#8B4513', hairStyle: 'short', bodyColor: '#1e293b', accessory: 'none', emoji: '🐶' },
    { id: 'teacher-02', name: 'ネコ先生', skinColor: '#FFDAB9', hairColor: '#F4A460', hairStyle: 'short', bodyColor: '#334155', accessory: 'none', emoji: '🐱' },
    { id: 'teacher-03', name: 'パンダ先生', skinColor: '#FFFFFF', hairColor: '#000000', hairStyle: 'short', bodyColor: '#111827', accessory: 'none', emoji: '🐼' },
    { id: 'teacher-04', name: 'ウサギ先生', skinColor: '#FFF0F5', hairColor: '#FFB6C1', hairStyle: 'short', bodyColor: '#3b82f6', accessory: 'none', emoji: '🐰' },
    { id: 'teacher-05', name: 'クマ先生', skinColor: '#8B4513', hairColor: '#5D2906', hairStyle: 'short', bodyColor: '#1e293b', accessory: 'none', emoji: '🐻' },
    { id: 'teacher-06', name: 'ライオン先生', skinColor: '#FFD700', hairColor: '#CD853F', hairStyle: 'spiky', bodyColor: '#451a03', accessory: 'none', emoji: '🦁' },
    { id: 'teacher-07', name: 'トラ先生', skinColor: '#FFA500', hairColor: '#333333', hairStyle: 'spiky', bodyColor: '#1e293b', accessory: 'none', emoji: '🐯' },
    { id: 'teacher-08', name: 'コアラ先生', skinColor: '#A9A9A9', hairColor: '#808080', hairStyle: 'short', bodyColor: '#475569', accessory: 'none', emoji: '🐨' },
    { id: 'teacher-09', name: 'ペンギン先生', skinColor: '#F0F8FF', hairColor: '#111827', hairStyle: 'short', bodyColor: '#0f172a', accessory: 'none', emoji: '🐧' },
    { id: 'teacher-10', name: 'カエル先生', skinColor: '#90EE90', hairColor: '#228B22', hairStyle: 'short', bodyColor: '#064e3b', accessory: 'none', emoji: '🐸' },
    { id: 'teacher-11', name: 'サル先生', skinColor: '#D2B48C', hairColor: '#A0522D', hairStyle: 'short', bodyColor: '#334155', accessory: 'none', emoji: '🐵' },
    { id: 'teacher-12', name: 'ゾウ先生', skinColor: '#708090', hairColor: '#4A5D6E', hairStyle: 'short', bodyColor: '#1e293b', accessory: 'none', emoji: '🐘' },
    { id: 'teacher-13', name: 'キリン先生', skinColor: '#FFD700', hairColor: '#8B4513', hairStyle: 'short', bodyColor: '#451a03', accessory: 'none', emoji: '🦒' },
    { id: 'teacher-14', name: 'ヒツジ先生', skinColor: '#F5F5F5', hairColor: '#FFFFFF', hairStyle: 'short', bodyColor: '#334155', accessory: 'none', emoji: '🐑' },
    { id: 'teacher-15', name: 'ブタ先生', skinColor: '#FFC0CB', hairColor: '#FF69B4', hairStyle: 'short', bodyColor: '#1e293b', accessory: 'none', emoji: '🐷' },
    { id: 'teacher-16', name: 'ニワトリ先生', skinColor: '#FFFFFF', hairColor: '#B22222', hairStyle: 'spiky', bodyColor: '#451a03', accessory: 'none', emoji: '🐔' },
    { id: 'teacher-17', name: 'ハムスター先生', skinColor: '#F5DEB3', hairColor: '#DEB887', hairStyle: 'short', bodyColor: '#334155', accessory: 'none', emoji: '🐹' },
    { id: 'teacher-18', name: 'キツネ先生', skinColor: '#FF8C00', hairColor: '#FFFFFF', hairStyle: 'short', bodyColor: '#1e293b', accessory: 'none', emoji: '🦊' },
    { id: 'teacher-19', name: 'タヌキ先生', skinColor: '#A0522D', hairColor: '#000000', hairStyle: 'short', bodyColor: '#451a03', accessory: 'none', emoji: '🍃' },
    { id: 'teacher-20', name: 'フクロウ先生', skinColor: '#CD853F', hairColor: '#8B4513', hairStyle: 'short', bodyColor: '#1e293b', accessory: 'glasses', emoji: '🦉' },

    // AI
    { id: 'ai', name: 'AI先生', skinColor: '#c4b5fd', hairColor: '#6366f1', hairStyle: 'short', bodyColor: '#4f46e5', accessory: 'glasses', emoji: '🤖' },
];

export function getAvatarById(id: string): AvatarStyle {
    return avatarPresets.find(a => a.id === id) || avatarPresets[0];
}
