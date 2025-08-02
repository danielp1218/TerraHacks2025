
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

// types for configs
interface ElementStyle {
  fontSize?: number; // in pixels
  color?: string; // CSS color value
  fontFamily?: string; // CSS font family
  fontWeight?: string; // CSS font weight
  textDecoration?: string; // CSS text decoration
  backgroundSize?: string; // CSS background size
  border?: string; // CSS border style
  boxShadow?: string; // CSS box shadow
  padding?: string; // CSS padding
  margin?: string; // CSS margin
  textColor?: string; // CSS text color
  scale?: number; // CSS transform scale
  opacity?: number; // CSS opacity
  backgroundColor?: string; // CSS background color
  borderRadius?: string; // CSS border radius

}

interface ConfigElement {
  activationTime: number;
  style: ElementStyle;
}

interface ExtensionConfig {
  [tagName: string]: ConfigElement;
}

// WebGazer type definitions for global window object
interface Window {
  webgazer?: {
    setRegression: (regressionType: string) => any;
    setGazeListener: (listener: (data: GazeData, clock: number) => void) => any;
    begin: () => any;
  };
}

