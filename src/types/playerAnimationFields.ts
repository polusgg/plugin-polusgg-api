export type PlayerAnimationFields = Partial<{
  opacity: boolean;
  hatOpacity: boolean;
  petOpacity: boolean;
  skinOpacity: boolean;
  primaryColor: boolean;
  secondaryColor: boolean;
  tertiaryColor: boolean;
  scale: boolean;
  position: boolean;
  angle: boolean;
}>;

export enum PlayerAnimationField {
  Opacity,
  HatOpacity,
  PetOpacity,
  SkinOpacity,
  PrimaryColor,
  SecondaryColor,
  TertiaryColor,
  Scale,
  Position,
  Angle,
}
