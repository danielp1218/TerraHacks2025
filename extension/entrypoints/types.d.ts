
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