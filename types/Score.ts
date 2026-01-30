interface ScoreType {
  username: string;
  difficulty: "Easy" | "Medium" | "Hard";
  score: number;
  time: number;
  createdAt: Date;
}

export default ScoreType;
