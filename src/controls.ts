export interface ControlState {
  keyboardX: number;
  keyboardY: number;
  joystickX: number;
  joystickY: number;
  paused: boolean;
}

export interface CameraState {
  azimuth: number;
  pitch: number;
  smoothedAzimuth: number;
  inputLocked: boolean;
  suppressPhotoClickUntil: number;
}

export function createControlState(): ControlState {
  return { keyboardX: 0, keyboardY: 0, joystickX: 0, joystickY: 0, paused: false };
}

export function createCameraState(): CameraState {
  return { azimuth: 0, pitch: 0.42, smoothedAzimuth: 0, inputLocked: false, suppressPhotoClickUntil: 0 };
}
