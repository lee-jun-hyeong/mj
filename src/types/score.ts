export interface Score {
  id: string;
  userId: string;
  title: string;
  musicXml: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScoreMetadata {
  title?: string;
  composer?: string;
  key?: string;
  timeSignature?: string;
  tempo?: number;
}

