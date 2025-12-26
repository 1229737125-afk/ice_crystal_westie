
export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export type HandData = HandLandmark[];

export interface AppState {
  isWakingUp: boolean;
  isFormed: boolean;
  isFist: boolean;
  cameraActive: boolean;
}
