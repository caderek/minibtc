export type IconsId =
  | "fullscreen-off"
  | "fullscreen"
  | "github"
  | "install"
  | "mode-dark"
  | "mode-light"
  | "wait";

export type IconsKey =
  | "FullscreenOff"
  | "Fullscreen"
  | "Github"
  | "Install"
  | "ModeDark"
  | "ModeLight"
  | "Wait";

export enum Icons {
  FullscreenOff = "fullscreen-off",
  Fullscreen = "fullscreen",
  Github = "github",
  Install = "install",
  ModeDark = "mode-dark",
  ModeLight = "mode-light",
  Wait = "wait",
}

export const ICONS_CODEPOINTS: { [key in Icons]: string } = {
  [Icons.FullscreenOff]: "61697",
  [Icons.Fullscreen]: "61698",
  [Icons.Github]: "61699",
  [Icons.Install]: "61700",
  [Icons.ModeDark]: "61701",
  [Icons.ModeLight]: "61702",
  [Icons.Wait]: "61703",
};
