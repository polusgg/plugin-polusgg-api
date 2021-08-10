export type PlayerAnimationFields = Partial<{
  opacity: boolean;
  hatOpacity: boolean;
  petOpacity: boolean;
  skinOpacity: boolean;
  nameOpacity: boolean;
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
  NameOpacity,
  PrimaryColor,
  SecondaryColor,
  TertiaryColor,
  Scale,
  Position,
  Angle,
}
