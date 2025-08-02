
interface EyeFeature {
  patch: object;
  imagex: number;
  imagey: number;
  width: number;
  height: number;
}

interface EyeFeatures {
  left: EyeFeature;
  right: EyeFeature;
}

interface GazeCoordinate {
  x: number;
  y: number;
}

interface GazeData {
  x: number;
  y: number;
  eyeFeatures: EyeFeatures;
  all: GazeCoordinate[];
}

interface GazeDataEvent extends CustomEvent {
  detail: GazeData;
}

// WebGazer type definitions for global window object
interface Window {
  webgazer?: {
    setRegression: (regressionType: string) => any;
    setGazeListener: (listener: (data: GazeData, clock: number) => void) => any;
    begin: () => any;
  };
}