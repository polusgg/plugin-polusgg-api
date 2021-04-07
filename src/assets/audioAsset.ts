import { AudioAssetDeceleration } from "../types/assetBundleDeceleration";
import { Asset } from "./asset";
import { AssetBundle } from "./assetBundle";

export class AudioAsset extends Asset {
  constructor(protected readonly bundle: AssetBundle, protected readonly deceleration: AudioAssetDeceleration) {
    super(bundle, deceleration);
  }

  getSampleCount(): number {
    return this.deceleration.details.samples;
  }

  getSampleRate(): number {
    return this.deceleration.details.sampleRate;
  }

  getDurationSeconds(): number {
    return this.deceleration.details.sampleRate / this.deceleration.details.samples;
  }

  getDurationMs(): number {
    return this.getDurationSeconds() / 1000;
  }
}
