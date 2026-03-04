export interface Team {
  id: string;
  name: string;
  score: number;
  color: string;
}

export interface Student {
  id: string;
  name: string;
  score: number;
}

export interface ClassGroup {
  id: string;
  name: string;
  students: string[]; // Danh sách tên học sinh gốc
  
  // Dữ liệu lưu trữ riêng cho từng lớp
  studentScores?: Student[]; // Dữ liệu cho StudentLeaderboard
  teams?: Team[]; // Dữ liệu cho Scoreboard
}

export interface ScoreboardSettings {
  targetScore: number;
  autoSort: boolean;
}

export const TEAM_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-green-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-sky-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-purple-500',
  'bg-fuchsia-500',
  'bg-pink-500',
  'bg-rose-500',
];

export const PRESET_MESSAGES = [
  "Giữ trật tự 🤫",
  "Thảo luận nhóm 👥",
  "Hết giờ 🛑",
  "Làm tốt lắm! 🌟",
  "Giải lao ☕",
  "Tập trung nào 👀"
];