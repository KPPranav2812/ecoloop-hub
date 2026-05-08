export type Role =
  | "admin"
  | "contributor"
  | "agent"
  | "compost"
  | "farmer";

export interface User {
  id: string;
  name: string;
  organization: string;
  role: Role;
  location?: string;
  capacity?: number;
  credits: number;
  xp: number;
  badges: string[];
  createdAt: number;
}

export type WasteCategory = "Organic" | "Recyclable" | "Contaminated";
export type Urgency = "Low" | "Medium" | "High";

export type WasteStatus =
  | "Pending Pickup"
  | "Picked Up"
  | "Delivered"
  | "Processed";

export interface AIResult {
  category: WasteCategory;
  confidence: number;
  contamination: number;
}

export interface WasteBatch {
  id: string;
  contributorId: string;
  contributorName: string;
  category: WasteCategory;
  weightKg: number;
  notes?: string;
  imageDataUrl?: string;
  urgency: Urgency;
  status: WasteStatus;
  ai?: AIResult;
  agentId?: string;
  createdAt: number;
  pickedUpAt?: number;
  deliveredAt?: number;
}

export type CompostStage =
  | "Received"
  | "Processing"
  | "Drying"
  | "Ready"
  | "Distributed";

export interface CompostBatch {
  id: string;
  sourceWasteIds: string[];
  weightKg: number;
  stage: CompostStage;
  quality: number; // 0-100
  operatorId?: string;
  createdAt: number;
  readyAt?: number;
}

export type RequestStatus = "Pending" | "Approved" | "Delivered";

export interface FarmerRequest {
  id: string;
  farmerId: string;
  farmerName: string;
  compostBatchId: string;
  quantityKg: number;
  status: RequestStatus;
  createdAt: number;
}

export interface ActivityItem {
  id: string;
  message: string;
  createdAt: number;
  kind: "waste" | "pickup" | "compost" | "farmer" | "system";
}

export interface AppState {
  users: User[];
  currentUserId: string | null;
  wasteBatches: WasteBatch[];
  compostBatches: CompostBatch[];
  farmerRequests: FarmerRequest[];
  activity: ActivityItem[];
}
