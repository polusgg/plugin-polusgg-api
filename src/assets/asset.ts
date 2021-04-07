import { AssetDeceleration, AssetType } from "../types/assetBundleDeceleration";
import { AssetBundle } from "./assetBundle";

export class Asset {
  constructor(protected readonly bundle: AssetBundle, protected readonly deceleration: AssetDeceleration) {}

  getBundle(): AssetBundle {
    return this.bundle;
  }

  getId(): number {
    return this.deceleration.id;
  }

  getPath(): string[] {
    return this.deceleration.path.split("/");
  }

  getType(): AssetType {
    return this.deceleration.type;
  }
}
