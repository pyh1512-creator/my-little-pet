import React, { useRef, useState } from 'react';
import {
  Edit3,
  Check,
  Settings,
  Sofa,
  Calendar,
  Sparkles,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { useGameStore, getXpForNextLevel } from '../../store/useGameStore';
import { CHARACTERS, getEvolutionStage } from '../../data/characters';
import { uploadImageToCloudinary } from '../../lib/cloudinary';
import { soundEngine } from '../../utils/audio';

export const MyPageScreen: React.FC = () => {
  const characterId = useGameStore((s) => s.characterId);
  const petName = useGameStore((s) => s.petName);
  const level = useGameStore((s) => s.level);
  const xp = useGameStore((s) => s.xp);
  const adoptedAt = useGameStore((s) => s.adoptedAt);
  const totalClicks = useGameStore((s) => s.totalClicks);
  const totalFeeds = useGameStore((s) => s.totalFeeds);
  const totalPlays = useGameStore((s) => s.totalPlays);
  const totalWashes = useGameStore((s) => s.totalWashes);
  const totalSleeps = useGameStore((s) => s.totalSleeps);
  const totalEventsResolved = useGameStore((s) => s.totalEventsResolved);
  const totalMinigamesPlayed = useGameStore((s) => s.totalMinigamesPlayed);
  const growthLog = useGameStore((s) => s.growthLog);
  const profileImageUrl = useGameStore((s) => s.profileImageUrl);
  const photos = useGameStore((s) => s.photos ?? []);

  const renamePet = useGameStore((s) => s.renamePet);
  const setShowSettingsModal = useGameStore((s) => s.setShowSettingsModal);
  const setShowRoomModal = useGameStore((s) => s.setShowRoomModal);
  const setProfileImage = useGameStore((s) => s.setProfileImage);
  const addPhoto = useGameStore((s) => s.addPhoto);
  const removePhoto = useGameStore((s) => s.removePhoto);
  const pushToast = useGameStore((s) => s.pushToast);

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(petName);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);

  const char = CHARACTERS[characterId];
  const evo = getEvolutionStage(characterId, level);
  const daysTogether = Math.max(1, Math.floor((Date.now() - adoptedAt) / (1000 * 60 * 60 * 24)) + 1);
  const nextXp = getXpForNextLevel(level);

  const handleSaveName = () => {
    renamePet(nameInput);
    setEditing(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const res = await uploadImageToCloudinary(file, { folder: 'my-little-pet/avatars' });
      setProfileImage(res.secureUrl);
      pushToast({
        title: '프로필 이미지 저장 완료!',
        subtitle: 'Cloudinary에 안전하게 업로드되었습니다.',
        icon: '🖼️',
        tone: 'mint',
      });
    } catch (err) {
      soundEngine.play('angry');
      pushToast({
        title: '이미지 업로드 실패',
        subtitle: err instanceof Error ? err.message : '다시 시도해 주세요.',
        icon: '⚠️',
        tone: 'peach',
      });
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleAlbumUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const res = await uploadImageToCloudinary(file, { folder: 'my-little-pet/album' });
      addPhoto({
        url: res.secureUrl,
        caption: file.name.replace(/\.[^/.]+$/, '') || `${petName}의 추억`,
        source: 'upload',
      });
      pushToast({
        title: '추억 앨범에 사진 추가!',
        subtitle: 'Cloudinary에 저장 완료되었습니다.',
        icon: '📸',
        tone: 'mint',
      });
    } catch (err) {
      soundEngine.play('angry');
      pushToast({
        title: '사진 업로드 실패',
        subtitle: err instanceof Error ? err.message : '다시 시도해 주세요.',
        icon: '⚠️',
        tone: 'peach',
      });
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-4 overflow-y-auto px-3 pb-4 sm:px-6">
      {/* Top Profile Card */}
      <div className="glass-panel rounded-3xl p-5 shadow-soft">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            {/* Avatar with Cloudinary Upload */}
            <div className="relative">
              <div
                className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl text-3xl shadow-inner"
                style={{ backgroundColor: char.colors.bgTint }}
              >
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt="프로필"
                    className="h-full w-full object-cover"
                  />
                ) : characterId === 'corgi' ? (
                  '🐶'
                ) : characterId === 'cat' ? (
                  '🐱'
                ) : characterId === 'duck' ? (
                  '🦆'
                ) : characterId === 'rabbit' ? (
                  '🐰'
                ) : (
                  '🐻'
                )}
              </div>
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
                title="프로필 사진 업로드 (Cloudinary)"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-cocoa text-white shadow-pill transition hover:brightness-110 active:scale-95 disabled:opacity-60"
              >
                <Camera className={`h-3.5 w-3.5 ${uploadingAvatar ? 'animate-pulse' : ''}`} />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => void handleAvatarUpload(e)}
                className="hidden"
              />
            </div>

            <div>
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    maxLength={12}
                    className="w-36 rounded-xl border-2 border-peach-dark bg-white px-2.5 py-1 text-sm font-bold text-cocoa outline-none"
                  />
                  <button
                    onClick={handleSaveName}
                    className="rounded-xl bg-mint-dark p-1.5 text-white"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl font-bold text-cocoa">{petName}</h2>
                  <button
                    onClick={() => {
                      setNameInput(petName);
                      setEditing(true);
                    }}
                    className="rounded-full p-1 text-cocoa-muted hover:bg-white"
                    title="이름 변경"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-cocoa-light">
                <span className="rounded-full bg-peach-light px-2.5 py-0.5 text-cocoa">
                  {evo.title}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> 집사 취직 {daysTogether}일차
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowRoomModal(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-xs font-extrabold text-cocoa shadow-pill transition hover:bg-cream"
            >
              <Sofa className="h-4 w-4 text-mint-dark" /> 방 꾸미기
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-cocoa px-4 py-2.5 text-xs font-extrabold text-white shadow-pill transition hover:brightness-110"
            >
              <Settings className="h-4 w-4" /> 설정
            </button>
          </div>
        </div>

        {/* XP Progress */}
        <div className="mt-4 rounded-2xl bg-white/80 p-3.5">
          <div className="mb-1.5 flex items-center justify-between text-xs font-extrabold text-cocoa">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-lavender-dark" />
              Lv.{level} 경험치
            </span>
            <span className="text-cocoa-light">
              {xp} / {nextXp} XP
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-cream-dark">
            <div
              className="h-full rounded-full bg-gradient-to-r from-lavender to-peach-dark transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((xp / nextXp) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Cloudinary Photo Album */}
      <div className="glass-panel rounded-3xl p-5 shadow-soft">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-1.5 font-display text-lg text-cocoa">
              <ImageIcon className="h-5 w-5 text-peach-dark" />
              펫 추억 앨범
            </h3>
            <p className="text-[11px] text-cocoa-light">
              홈 화면의 3D 촬영 사진과 직접 올린 이미지가 Cloudinary에 저장됩니다.
            </p>
          </div>
          <button
            type="button"
            disabled={uploadingPhoto}
            onClick={() => albumInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-2xl bg-peach-dark px-4 py-2 text-xs font-extrabold text-white shadow-pill transition hover:brightness-105 active:scale-95 disabled:opacity-60"
          >
            <Upload className={`h-3.5 w-3.5 ${uploadingPhoto ? 'animate-bounce' : ''}`} />
            {uploadingPhoto ? '업로드 중...' : '사진 업로드'}
          </button>
          <input
            ref={albumInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => void handleAlbumUpload(e)}
            className="hidden"
          />
        </div>

        {photos.length === 0 ? (
          <div className="rounded-2xl bg-white/75 py-8 text-center text-xs text-cocoa-muted">
            아직 저장된 사진이 없어요. 홈에서 📷 촬영을 누르거나 위 버튼으로 사진을 올려보세요!
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-2xl border border-white bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setPreviewPhotoUrl(photo.url)}
                  className="block aspect-square w-full overflow-hidden bg-cream"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </button>
                <div className="flex items-center justify-between gap-1 px-2.5 py-1.5">
                  <span className="truncate text-[11px] font-bold text-cocoa">{photo.caption}</span>
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    title="앨범에서 삭제"
                    className="rounded-lg p-1 text-cocoa-muted transition hover:bg-rose-50 hover:text-rose-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
        {[
          { label: '밥 조공', val: totalFeeds, emoji: '🍖' },
          { label: '놀아주기', val: totalPlays, emoji: '🎾' },
          { label: '목욕 성공', val: totalWashes, emoji: '🫧' },
          { label: '낮잠 횟수', val: totalSleeps, emoji: '💤' },
          { label: '돌발 사건', val: totalEventsResolved, emoji: '⚡' },
          { label: '미니게임', val: totalMinigamesPlayed, emoji: '🎮' },
        ].map((st) => (
          <div key={st.label} className="glass-panel rounded-2xl p-3 text-center shadow-sm">
            <div className="text-xl">{st.emoji}</div>
            <div className="mt-1 font-display text-lg font-bold text-cocoa">{st.val}</div>
            <div className="text-[11px] font-bold text-cocoa-muted">{st.label}</div>
          </div>
        ))}
      </div>

      {/* Growth Log Timeline */}
      <div className="glass-panel rounded-3xl p-5 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg text-cocoa">성장 & 황당한 일지</h3>
          <span className="text-xs font-bold text-cocoa-muted">
            총 터치 {totalClicks}회 · 최근 {growthLog.length}건
          </span>
        </div>
        {growthLog.length === 0 ? (
          <p className="py-8 text-center text-xs text-cocoa-muted">아직 기록된 일지가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {growthLog.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white/85 px-4 py-2.5"
              >
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-cocoa">{entry.title}</div>
                  <div className="truncate text-[11px] text-cocoa-light">{entry.detail}</div>
                </div>
                <span className="shrink-0 text-[10px] font-semibold text-cocoa-muted">
                  {new Date(entry.timestamp).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Preview Modal */}
      {previewPhotoUrl && (
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/70 p-4 backdrop-blur-sm"
        >
          <div className="relative max-h-[85vh] max-w-2xl overflow-hidden rounded-3xl border-2 border-white bg-white shadow-card">
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 text-cocoa shadow-pill"
            >
              <X className="h-5 w-5" />
            </button>
            <img src={previewPhotoUrl} alt="확대 보기" className="max-h-[80vh] w-auto object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
