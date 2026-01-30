interface ScoreType {
  username: string;
  difficulty: "Easy" | "Medium" | "Hard";
  score: number;
  time: number;
  character: string;
  createdAt: Date;
}

export default ScoreType;
