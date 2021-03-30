import { ResourceState } from "./enums";

export type Resource = {
  location: string;
  state: ResourceState;
  hash: Buffer;
};
