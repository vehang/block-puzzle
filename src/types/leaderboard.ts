// 排行榜类型定义

export interface ScoreRecord {
  id: string;           // 唯一ID
  score: number;        // 分数
  date: string;         // 日期 (YYYY-MM-DD HH:mm)
  rank: number;         // 排名
}

export interface LeaderboardState {
  scores: ScoreRecord[];  // 最多10条记录
  maxRecords: 10;         // 最大记录数
}
