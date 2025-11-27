export interface Conti {
  id: string;
  userId: string;
  title: string;
  description?: string;
  scoreIds: string[];
  order: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}
