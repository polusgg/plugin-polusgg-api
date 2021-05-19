import { ServiceType } from "../types/enums";
import { RoleManagerService } from "./roleManager";
import { ResourceService } from "./resource";
import { ButtonManagerService } from "./buttonManager";
import { CameraManagerService } from "./cameraManager";
import { PointOfInterestManagerService } from "./pointOfInterestManager";
import { LightManagerService } from "./lightManager";
import { SoundManagerService } from "./soundManager";
import { GameOptionsService } from "./gameOptions/gameOptionsService";
import { AnimationService } from "./animation/animationService";
import { NameService } from "./name";
import { DeadBodyService } from "./deadBody/deadBodyService";
import { CoroutineManagerService } from "./coroutineManager/coroutineManagerService";
import { VentService } from "./vent";

const serviceFromType = {
  [ServiceType.Resource]: new ResourceService(),
  [ServiceType.RoleManager]: new RoleManagerService(),
  [ServiceType.Button]: new ButtonManagerService(),
  [ServiceType.CameraManager]: new CameraManagerService(),
  [ServiceType.PointOfInterestManager]: new PointOfInterestManagerService(),
  [ServiceType.LightManager]: new LightManagerService(),
  [ServiceType.SoundManager]: new SoundManagerService(),
  [ServiceType.GameOptions]: new GameOptionsService(),
  [ServiceType.Animation]: new AnimationService(),
  [ServiceType.Name]: new NameService(),
  [ServiceType.DeadBody]: new DeadBodyService(),
  [ServiceType.CoroutineManager]: new CoroutineManagerService(),
  [ServiceType.Vent]: new VentService(),
};

export class Services {
  static get<T extends ServiceType>(serviceType: T): (typeof serviceFromType)[T] {
    return serviceFromType[serviceType];
  }
}
