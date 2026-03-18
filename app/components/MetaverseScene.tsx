'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { type AvatarStyle, getAvatarById } from '../data/avatars';

// --- 教室の床 ---
function Floor() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[16, 14]} />
            <meshStandardMaterial color="#c4a882" roughness={0.8} />
        </mesh>
    );
}

// --- 壁 ---
function Walls() {
    const wallColor = '#f5f0e8';
    return (
        <group>
            <mesh position={[0, 2, -7]} receiveShadow><planeGeometry args={[16, 4]} /><meshStandardMaterial color={wallColor} /></mesh>
            <mesh position={[-8, 2, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[14, 4]} /><meshStandardMaterial color={wallColor} /></mesh>
            <mesh position={[8, 2, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[14, 4]} /><meshStandardMaterial color={wallColor} /></mesh>
            <mesh position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[16, 14]} /><meshStandardMaterial color="#fafafa" /></mesh>
        </group>
    );
}

// --- 黒板 (出席者名ボード) ---
function Blackboard({ seatedUsers }: { seatedUsers: SeatedUser[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const textureRef = useRef<THREE.CanvasTexture>(null!);

    const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // 背景（黒板色）
            ctx.fillStyle = '#2d5a3d';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // タイトル
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = 'bold 60px "Sawarabi Gothic", sans-serif';
            ctx.fillText('📋 今日の出席', 60, 100);

            // 境界線（チョーク風）
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.moveTo(50, 130);
            ctx.lineTo(970, 130);
            ctx.stroke();

            // 名前リスト
            ctx.font = '38px "Sawarabi Gothic", sans-serif'; // フォントサイズを小さくして重なりを防ぐ
            ctx.setLineDash([]);

            // 先生も表示対象に含める
            const attendees = seatedUsers.filter(u => u.role !== 'ai');
            const cols = 4;
            const startX = 60;
            const startY = 190;
            const spacingX = 240; // 列間を広げる
            const spacingY = 95;  // 行間を広げる

            attendees.forEach((s, i) => {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const isTeacher = s.role === 'teacher' || s.role === 'admin-teacher';
                const roleMark = isTeacher ? '★' : '・';
                ctx.fillStyle = isTeacher ? '#ffeb3b' : '#ffffff';
                ctx.fillText(`${roleMark}${s.name}`, startX + col * spacingX, startY + row * spacingY);
            });

            if (attendees.length === 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.font = 'italic 40px "Sawarabi Gothic", sans-serif';
                ctx.fillText('まだ誰も着席していません', startX, startY);
            }
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }, [seatedUsers]);

    return (
        <group position={[0, 2.3, -6.9]}>
            {/* 枠 */}
            <mesh position={[0, 0, -0.05]}>
                <boxGeometry args={[6, 2.2, 0.1]} />
                <meshStandardMaterial color="#8B7355" roughness={0.6} />
            </mesh>
            {/* 黒板面 */}
            <mesh>
                <boxGeometry args={[5.6, 1.8, 0.08]} />
                <meshStandardMaterial map={texture} roughness={0.4} />
            </mesh>
            {/* 粉受け */}
            <mesh position={[0, -1, 0.05]}>
                <boxGeometry args={[5.8, 0.1, 0.15]} />
                <meshStandardMaterial color="#8B7355" />
            </mesh>
        </group>
    );
}

// --- 名札 (アバターの上に表示) ---
function NameTag({ name }: { name: string }) {
    const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, 256, 128);
            // カプセル型の背景
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            const x = 20, y = 40, w = 216, h = 48, r = 24;
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            ctx.fill();

            // 名前テキスト
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 28px "Sawarabi Gothic", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(name, 128, 64);
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }, [name]);

    return (
        <sprite position={[0, 1.5, 0]} scale={[0.6, 0.3, 1]}>
            <spriteMaterial map={texture} transparent depthWrite={false} depthTest={true} />
        </sprite>
    );
}

// --- 机（さらに小さめ）---
function Desk({ position, color, scale = 1 }: { position: [number, number, number]; color: string; scale?: number }) {
    return (
        <group position={position} scale={[scale * 0.6, scale * 0.6, scale * 0.6]}>
            <mesh position={[0, 0.7, 0]} castShadow><boxGeometry args={[1.0, 0.05, 0.6]} /><meshStandardMaterial color={color} roughness={0.3} metalness={0.1} /></mesh>
            {[[-0.4, 0.35, -0.22], [0.4, 0.35, -0.22], [-0.4, 0.35, 0.22], [0.4, 0.35, 0.22]].map((p, i) => (
                <mesh key={i} position={p as [number, number, number]}><boxGeometry args={[0.03, 0.7, 0.03]} /><meshStandardMaterial color="#666" metalness={0.8} roughness={0.3} /></mesh>
            ))}
        </group>
    );
}

// --- 椅子（黒板方向・小さめ）---
function Chair({ position, color }: { position: [number, number, number]; color: string }) {
    return (
        <group position={position} scale={[0.7, 0.7, 0.7]}>
            <mesh position={[0, 0.45, 0]}><boxGeometry args={[0.4, 0.03, 0.4]} /><meshStandardMaterial color={color} /></mesh>
            <mesh position={[0, 0.68, 0.18]}><boxGeometry args={[0.4, 0.45, 0.03]} /><meshStandardMaterial color={color} /></mesh>
            {[[-0.2, 0.22, -0.2], [0.2, 0.22, -0.2], [-0.2, 0.22, 0.2], [0.2, 0.22, 0.2]].map((p, i) => (
                <mesh key={i} position={p as [number, number, number]}><boxGeometry args={[0.03, 0.45, 0.03]} /><meshStandardMaterial color="#555" metalness={0.8} /></mesh>
            ))}
        </group>
    );
}

// --- 3Dアバター（アバタースタイルに基づいて描画）---
function Avatar3D({ position, rotation = [0, 0, 0], avatar, breathing = true, displayName }: {
    position: [number, number, number]; rotation?: [number, number, number]; avatar: AvatarStyle; breathing?: boolean; displayName?: string;
}) {
    const ref = useRef<THREE.Group>(null!);
    useFrame((state) => {
        if (ref.current && breathing) {
            ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.01;
        }
    });

    // 髪型の3Dレンダリング
    const renderHair = () => {
        switch (avatar.hairStyle) {
            case 'short':
                return (
                    <mesh position={[0, 1.18, -0.02]}>
                        <sphereGeometry args={[0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
                        <meshStandardMaterial color={avatar.hairColor} />
                    </mesh>
                );
            case 'long':
                return (
                    <group>
                        <mesh position={[0, 1.18, -0.02]}>
                            <sphereGeometry args={[0.21, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
                            <meshStandardMaterial color={avatar.hairColor} />
                        </mesh>
                        {/* 長い髪の垂れ下がり */}
                        <mesh position={[-0.15, 0.95, -0.05]}><boxGeometry args={[0.06, 0.35, 0.08]} /><meshStandardMaterial color={avatar.hairColor} /></mesh>
                        <mesh position={[0.15, 0.95, -0.05]}><boxGeometry args={[0.06, 0.35, 0.08]} /><meshStandardMaterial color={avatar.hairColor} /></mesh>
                        <mesh position={[0, 0.88, -0.12]}><boxGeometry args={[0.3, 0.4, 0.04]} /><meshStandardMaterial color={avatar.hairColor} /></mesh>
                    </group>
                );
            case 'ponytail':
                return (
                    <group>
                        <mesh position={[0, 1.18, -0.02]}>
                            <sphereGeometry args={[0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
                            <meshStandardMaterial color={avatar.hairColor} />
                        </mesh>
                        {/* ポニーテール */}
                        <mesh position={[0, 1.15, -0.18]} rotation={[0.5, 0, 0]}>
                            <cylinderGeometry args={[0.04, 0.06, 0.3, 8]} />
                            <meshStandardMaterial color={avatar.hairColor} />
                        </mesh>
                        <mesh position={[0, 1.0, -0.28]}>
                            <sphereGeometry args={[0.06, 8, 8]} />
                            <meshStandardMaterial color={avatar.hairColor} />
                        </mesh>
                    </group>
                );
            case 'spiky':
                return (
                    <group>
                        <mesh position={[0, 1.18, -0.02]}>
                            <sphereGeometry args={[0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
                            <meshStandardMaterial color={avatar.hairColor} />
                        </mesh>
                        {/* スパイキー */}
                        {[-0.08, 0, 0.08].map((x, i) => (
                            <mesh key={i} position={[x, 1.32 + (i === 1 ? 0.03 : 0), 0]} rotation={[0, 0, (x) * 2]}>
                                <coneGeometry args={[0.04, 0.12, 6]} />
                                <meshStandardMaterial color={avatar.hairColor} />
                            </mesh>
                        ))}
                    </group>
                );
            case 'bob':
                return (
                    <group>
                        <mesh position={[0, 1.15, 0]}>
                            <sphereGeometry args={[0.22, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
                            <meshStandardMaterial color={avatar.hairColor} />
                        </mesh>
                        {/* ボブの横 */}
                        <mesh position={[-0.17, 1.02, 0]}><boxGeometry args={[0.06, 0.18, 0.22]} /><meshStandardMaterial color={avatar.hairColor} /></mesh>
                        <mesh position={[0.17, 1.02, 0]}><boxGeometry args={[0.06, 0.18, 0.22]} /><meshStandardMaterial color={avatar.hairColor} /></mesh>
                    </group>
                );
            case 'bun':
                return (
                    <group>
                        <mesh position={[0, 1.18, -0.02]}>
                            <sphereGeometry args={[0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
                            <meshStandardMaterial color={avatar.hairColor} />
                        </mesh>
                        {/* おだんご */}
                        <mesh position={[0, 1.35, 0]}>
                            <sphereGeometry args={[0.08, 12, 12]} />
                            <meshStandardMaterial color={avatar.hairColor} />
                        </mesh>
                    </group>
                );
        }
    };

    // アクセサリの3Dレンダリング
    const renderAccessory = () => {
        switch (avatar.accessory) {
            case 'glasses':
                return (
                    <group position={[0, 1.08, 0.15]}>
                        <mesh position={[-0.06, 0, 0]}><torusGeometry args={[0.04, 0.008, 8, 16]} /><meshStandardMaterial color="#333" /></mesh>
                        <mesh position={[0.06, 0, 0]}><torusGeometry args={[0.04, 0.008, 8, 16]} /><meshStandardMaterial color="#333" /></mesh>
                        <mesh position={[0, 0, 0]}><boxGeometry args={[0.04, 0.008, 0.008]} /><meshStandardMaterial color="#333" /></mesh>
                    </group>
                );
            case 'ribbon':
                return (
                    <group position={[0.14, 1.22, 0.1]}>
                        <mesh position={[-0.03, 0, 0]} rotation={[0, 0, 0.3]}><boxGeometry args={[0.06, 0.03, 0.02]} /><meshStandardMaterial color="#ef4444" /></mesh>
                        <mesh position={[0.03, 0, 0]} rotation={[0, 0, -0.3]}><boxGeometry args={[0.06, 0.03, 0.02]} /><meshStandardMaterial color="#ef4444" /></mesh>
                    </group>
                );
            case 'headband':
                return (
                    <mesh position={[0, 1.2, 0]}>
                        <torusGeometry args={[0.19, 0.015, 8, 24]} />
                        <meshStandardMaterial color="#ef4444" />
                    </mesh>
                );
            case 'cap':
                return (
                    <group position={[0, 1.25, 0.02]}>
                        <mesh><cylinderGeometry args={[0.2, 0.22, 0.1, 16]} /><meshStandardMaterial color={avatar.bodyColor} /></mesh>
                        <mesh position={[0, -0.03, 0.16]} rotation={[0.3, 0, 0]}><boxGeometry args={[0.2, 0.02, 0.12]} /><meshStandardMaterial color={avatar.bodyColor} /></mesh>
                    </group>
                );
            default: return null;
        }
    };

    return (
        <group ref={ref} position={position} rotation={rotation}>
            {/* 体 */}
            <mesh position={[0, 0.75, 0]}>
                <boxGeometry args={[0.35, 0.4, 0.25]} />
                <meshStandardMaterial color={avatar.bodyColor} />
            </mesh>
            {/* 襟 */}
            <mesh position={[0, 0.9, 0.08]}>
                <boxGeometry args={[0.12, 0.1, 0.06]} />
                <meshStandardMaterial color="#fff" />
            </mesh>
            {/* 腕 */}
            <mesh position={[-0.25, 0.75, 0]}><boxGeometry args={[0.12, 0.3, 0.15]} /><meshStandardMaterial color={avatar.bodyColor} /></mesh>
            <mesh position={[0.25, 0.75, 0]}><boxGeometry args={[0.12, 0.3, 0.15]} /><meshStandardMaterial color={avatar.bodyColor} /></mesh>
            {/* 頭 */}
            <mesh position={[0, 1.1, 0]}>
                <sphereGeometry args={[0.18, 16, 16]} />
                <meshStandardMaterial color={avatar.skinColor} />
            </mesh>
            {/* 動物の耳 (全ユーザー対象: 絵文字で判定) */}
            {['🐻', '🐰', '🐱', '🐶', '🐼', '🦊', '🐨', '🦁', '🐵', '🐷', '🐔', '🐹', '🦉'].includes(avatar.emoji) && (
                <group position={[0, 1.1, 0]}>
                    {/* 左耳 */}
                    <mesh position={[-0.12, 0.16, 0]} rotation={[0, 0, 0.5]}>
                        {['🐰', '🦊', '🐱', '🐶'].includes(avatar.emoji) ? (
                            <coneGeometry args={[0.06, 0.15, 4]} />
                        ) : (
                            <sphereGeometry args={[0.07, 8, 8]} />
                        )}
                        <meshStandardMaterial color={avatar.hairColor || avatar.bodyColor} />
                    </mesh>
                    {/* 右耳 */}
                    <mesh position={[0.12, 0.16, 0]} rotation={[0, 0, -0.5]}>
                        {['🐰', '🦊', '🐱', '🐶'].includes(avatar.emoji) ? (
                            <coneGeometry args={[0.06, 0.15, 4]} />
                        ) : (
                            <sphereGeometry args={[0.07, 8, 8]} />
                        )}
                        <meshStandardMaterial color={avatar.hairColor || avatar.bodyColor} />
                    </mesh>
                </group>
            )}
            {/* 目 */}
            <mesh position={[-0.06, 1.1, 0.16]}><sphereGeometry args={[0.025, 8, 8]} /><meshStandardMaterial color="#333" /></mesh>
            <mesh position={[0.06, 1.1, 0.16]}><sphereGeometry args={[0.025, 8, 8]} /><meshStandardMaterial color="#333" /></mesh>
            {/* 口 */}
            <mesh position={[0, 1.04, 0.16]}><boxGeometry args={[0.06, 0.015, 0.01]} /><meshStandardMaterial color="#e8a090" /></mesh>
            {/* 髪 */}
            {renderHair()}
            {/* アクセサリ */}
            {renderAccessory()}
            <NameTag name={displayName || avatar.name} />
        </group>
    );
}

// --- 窓 ---
function Windows() {
    return (
        <group>
            {[-4, -1, 2, 5].map((z, i) => (
                <group key={i} position={[7.95, 2.5, z]}>
                    <mesh rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[2, 1.6]} /><meshStandardMaterial color="#b8d4e8" emissive="#87ceeb" emissiveIntensity={0.2} transparent opacity={0.6} /></mesh>
                    <mesh rotation={[0, -Math.PI / 2, 0]} position={[-0.01, 0, 0]}><planeGeometry args={[2.1, 1.7]} /><meshStandardMaterial color="#ddd" /></mesh>
                </group>
            ))}
        </group>
    );
}

// --- 時計 ---
function WallClock() {
    const secRef = useRef<THREE.Mesh>(null!);
    const minRef = useRef<THREE.Mesh>(null!);
    useFrame((state) => {
        if (secRef.current) secRef.current.rotation.z = -state.clock.elapsedTime;
        if (minRef.current) minRef.current.rotation.z = -state.clock.elapsedTime * 0.02;
    });
    return (
        <group position={[-6, 3.2, -6.85]}>
            <mesh><circleGeometry args={[0.35, 32]} /><meshStandardMaterial color="#fff" /></mesh>
            <mesh position={[0, 0, 0.01]}><ringGeometry args={[0.33, 0.35, 32]} /><meshStandardMaterial color="#333" /></mesh>
            <group ref={minRef} position={[0, 0, 0.02]}><mesh position={[0, 0.1, 0]}><boxGeometry args={[0.02, 0.2, 0.01]} /><meshStandardMaterial color="#333" /></mesh></group>
            <group ref={secRef} position={[0, 0, 0.03]}><mesh position={[0, 0.12, 0]}><boxGeometry args={[0.01, 0.24, 0.01]} /><meshStandardMaterial color="red" /></mesh></group>
        </group>
    );
}

// --- 光の粒 ---
function DustParticles() {
    const ref = useRef<THREE.Points>(null!);
    const positions = useMemo(() => {
        const arr = new Float32Array(80 * 3);
        for (let i = 0; i < 80; i++) { arr[i * 3] = (Math.random() - 0.5) * 14; arr[i * 3 + 1] = Math.random() * 3 + 0.5; arr[i * 3 + 2] = (Math.random() - 0.5) * 12; }
        return arr;
    }, []);
    useFrame((state) => { if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.008; });
    return (
        <points ref={ref}>
            <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
            <pointsMaterial size={0.02} color="#ffe4a8" transparent opacity={0.3} sizeAttenuation />
        </points>
    );
}

// --- カメラ ---
function CameraRig() {
    const { camera } = useThree();
    useFrame((state) => {
        camera.position.x = Math.sin(state.clock.elapsedTime * 0.06) * 0.4;
        camera.position.y = 3.5 + Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
        camera.position.z = 7.5; // 少し遠ざけて端の机が切れないようにする
        camera.lookAt(0, 1.2, -2);
    });
    return null;
}

// --- 着席ユーザーの型（avatarId追加）---
export interface SeatedUser {
    seatIndex: number;
    name: string;
    role: 'teacher' | 'student' | 'ai' | 'admin-teacher';
    avatarId: string;
}

// --- メインシーン ---
export default function MetaverseScene({ seatedUsers, onSeatClick, onStudentClick }: {
    seatedUsers: SeatedUser[];
    onSeatClick: (seatIndex: number) => void;
    onStudentClick?: (name: string) => void;
}) {
    const cols = [-5.2, -2.6, 0, 2.6, 5.2]; // 少し広げる
    const rows = [-3.5, -1.8, 0, 1.8];
    const studentDesks: [number, number, number][] = [];
    for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < cols.length; c++) {
            studentDesks.push([cols[c], 0, rows[r]]);
        }
    }

    const aiAvatar = getAvatarById('ai');

    return (
        <Canvas camera={{ position: [0, 3.5, 7.5], fov: 60 }} style={{ width: '100%', height: '100%' }} gl={{ antialias: true }} shadows>
            <ambientLight intensity={0.4} color="#fff5e6" />
            <directionalLight position={[5, 4, 3]} intensity={0.6} color="#ffe8c0" castShadow />
            <pointLight position={[0, 3.8, -4]} intensity={0.4} color="#fff" />
            <pointLight position={[7, 2.5, 0]} intensity={0.3} color="#87ceeb" />
            <color attach="background" args={['#e8ddd0']} />

            <Floor /><Walls /><Windows /><WallClock /><Blackboard seatedUsers={seatedUsers} /><DustParticles />

            {/* 教壇エリア: 先生は生徒の方（+Z）を向くので、机の奥（-Z側）に座る */}
            <Desk position={[-2, 0, -5]} color="#8B6914" scale={1.1} />
            <Chair position={[-2, 0, -5.6]} color="#d4a574" /> {/* 座席位置修正 */}
            <Desk position={[2, 0, -5]} color="#8B6914" scale={1.1} />
            <Chair position={[2, 0, -5.6]} color="#d4a574" />

            {/* AI先生（生徒の方を向く = Y軸180度回転） */}
            <Avatar3D position={[2, 0, -5.6]} rotation={[0, Math.PI, 0]} avatar={aiAvatar} displayName="AI先生" />

            {/* 着席中の先生 */}
            {seatedUsers.filter(u => u.role === 'teacher' || u.role === 'admin-teacher').map((u, i) => (
                <Avatar3D key={`t-${i}`} position={[-2, 0, -5.6]} rotation={[0, Math.PI, 0]} avatar={getAvatarById(u.avatarId)} displayName={u.name} />
            ))}

            {/* 生徒机20席 */}
            {studentDesks.map((pos, i) => {
                const seated = seatedUsers.find(u => u.seatIndex === i && u.role === 'student');
                return (
                    <group key={i}>
                        <Desk position={pos} color="#d4a574" />
                        <Chair position={[pos[0], pos[1], pos[2] + 0.7]} color="#6b8cad" />
                        <mesh position={[pos[0], 0.8, pos[2]]}
                            onClick={() => {
                                if (seated) {
                                    if (onStudentClick) onStudentClick(seated.name);
                                } else {
                                    onSeatClick(i);
                                }
                            }}
                            onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
                            onPointerOut={() => { document.body.style.cursor = 'default'; }}>
                            <boxGeometry args={[1.2, 0.8, 1.2]} />
                            <meshStandardMaterial transparent opacity={0} />
                        </mesh>
                        {seated && <Avatar3D position={[pos[0], pos[1], pos[2] + 0.6]} avatar={getAvatarById(seated.avatarId)} displayName={seated.name} />}
                    </group>
                );
            })}

            <CameraRig />
        </Canvas>
    );
}
