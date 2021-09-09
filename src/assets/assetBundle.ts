import { AssetBundleDeclaration } from "../types/assetBundleDeclaration";
import { Asset } from "./asset";
import got from "got";

const defaultPrefixUrl = "https://client-assetbundles.polus.gg";

export class AssetBundle {
  protected static readonly cache: Map<string, AssetBundle> = new Map();
  protected readonly contents: Asset[] = [];

  protected constructor(protected declaration: AssetBundleDeclaration, protected readonly address: string) {
    this.loadDeclaration();
  }

  static async load(location: string, options?: { prefixUrl?: string, updateCache?: boolean }): Promise<AssetBundle> {
    if (this.cache.has(location)) {
      const cached = this.cache.get(location)!;

      if (options?.updateCache) {
        await cached.load();
      }

      return cached;
    }

    const prefixUrl = options?.prefixUrl ?? defaultPrefixUrl;

    const { body } = await got.extend({ prefixUrl })<string>(`${location}.json`);

    const bundle = new AssetBundle(JSON.parse(body) as AssetBundleDeclaration, `${prefixUrl}/${location}`);

    this.cache.set(location, bundle);

    return bundle;
  }

  static loadFromCache(fileName: string): AssetBundle | undefined {
    return this.cache.get(fileName);
  }

  static loadSafeFromCache(fileName: string): AssetBundle {
    const res = this.loadFromCache(fileName);

    if (res === undefined) {
      throw new Error("Attempted to load asset bundle from cache, that was not cached");
    }

    return res;
  }

  async load() {
    const { body } = await got<string>(this.address + ".json");

    const newDeclaration = JSON.parse(body) as AssetBundleDeclaration;

    if (newDeclaration.hash === this.declaration.hash) {
      // this should not be treated as an attack as the cdn may not be updated for this server (super unlikely bc unity invalidates cache when uploading any asset bundle)
      throw new Error("Loaded declaration had the same hash as current!");
    }

    this.loadDeclaration();
  }

  private loadDeclaration() {
    for (let i = 0; i < this.declaration.assets.length; i++) {
      const assetDeclaration = this.declaration.assets[i];

      assetDeclaration.id = this.declaration.assetBundleId + 1 + i;
      this.contents.push(new Asset(this, assetDeclaration));
    }
  }

  getId(): number {
    return this.declaration.assetBundleId;
  }

  getContents(): Asset[] {
    return this.contents;
  }

  getAsset(...path: string[]): Asset | undefined {
    const pathFormatted = path.join("/");

    for (let i = 0; i < this.contents.length; i++) {
      const asset = this.contents[i];

      if (asset.getPath().join("/") === pathFormatted) {
        return asset;
      }
    }
  }

  getSafeAsset(...path: string[]): Asset {
    const result = this.getAsset(...path);

    if (result !== undefined) {
      return result;
    }

    throw new Error(`Could not find asset: ${path.join("/")}`);
  }

  readDirectory(...path: string[]): string[] {
    const result: string[][] = [];

    for (let i = 0; i < this.contents.length; i++) {
      const asset = this.contents[i];
      const assetPath = asset.getPath();

      let thisAssetValid = true;

      for (let j = 0; j < assetPath.length; j++) {
        if (assetPath[j] !== path[j]) {
          thisAssetValid = false;
          break;
        }
      }

      if (thisAssetValid) {
        result.push(assetPath);
      }
    }

    return [...new Set(result.map(r => r[0]))];
  }

  getAddress(): string {
    return this.address;
  }

  getHash(): string {
    return this.declaration.hash;
  }
}
