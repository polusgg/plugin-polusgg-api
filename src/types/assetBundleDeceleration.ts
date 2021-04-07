import { SoundType } from "./enums/soundType";

export enum AssetType {
  Other,
  Audio,
}

export type AudioAssetDetails = {
  audioType: SoundType;
  sampleRate: number;
  samples: number;
};

export type BaseAssetDeceleration = {
  id: number;
  path: string;
  type: AssetType;
};

export type AudioAssetDeceleration = BaseAssetDeceleration & {
  type: AssetType.Audio;
  details: AudioAssetDetails;
};

export type AssetDeceleration = BaseAssetDeceleration | AudioAssetDeceleration;

export type AssetBundleDeceleration = {
  assetBundleId: number;
  hash: number[];
  assets: AssetDeceleration[];
};
