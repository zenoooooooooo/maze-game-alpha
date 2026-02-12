import { Schema, models, model } from "mongoose";
import ScoreType from "@/types/Score";

const ScoreModel = new Schema<ScoreType>(
  {
    username: { type: String, required: true },
  },
  { timestamps: true },
);

const Score = models.Score || model("Score", ScoreModel);
export default Score;
