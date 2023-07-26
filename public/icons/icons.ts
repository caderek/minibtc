export type IconsId =
  | "fullscreen-off"
  | "fullscreen"
  | "install"
  | "mode-dark"
  | "mode-light"
  | "wait";

export type IconsKey =
  | "FullscreenOff"
  | "Fullscreen"
  | "Install"
  | "ModeDark"
  | "ModeLight"
  | "Wait";

export enum Icons {
  FullscreenOff = "fullscreen-off",
  Fullscreen = "fullscreen",
  Install = "install",
  ModeDark = "mode-dark",
  ModeLight = "mode-light",
  Wait = "wait",
}

export const ICONS_CODEPOINTS: { [key in Icons]: string } = {
  [Icons.FullscreenOff]: "61697",
  [Icons.Fullscreen]: "61698",
  [Icons.Install]: "61699",
  [Icons.ModeDark]: "61700",
  [Icons.ModeLight]: "61701",
  [Icons.Wait]: "61702",
};
