import { ServiceType } from "../types/enums";
import { RoleManagerService } from "./roleManager";
import { ResourceService } from "./resource";
import { ButtonManagerService } from "./buttonManager";
import { CameraManagerService } from "./cameraManager";
import { PointOfInterestManagerService } from "./pointOfInterestManager";
import { LightManagerService } from "./lightManager";
import { SoundManagerService } from "./soundManager";

const RESOURCE_SERVICE = new ResourceService();
const ROLE_MANAGER_SERVICE = new RoleManagerService();
const BUTTON_MANAGER_SERVICE = new ButtonManagerService();
const CAMERA_MANAGER_SERVICE = new CameraManagerService();
const POINT_OF_INTEREST_MANAGER_SERVICE = new PointOfInterestManagerService();
const LIGHT_MANAGER_SERVICE = new LightManagerService();
const SOUND_MANAGER_SERVICE = new SoundManagerService();

/* eslint-disable @typescript-eslint/indent */
type ServiceFromType<T extends ServiceType> =
  T extends ServiceType.Resource ? ResourceService :
  T extends ServiceType.RoleManager ? RoleManagerService :
  T extends ServiceType.Button ? ButtonManagerService :
  T extends ServiceType.CameraManager ? CameraManagerService :
  T extends ServiceType.PointOfInterestManager ? PointOfInterestManagerService :
  T extends ServiceType.LightManager ? LightManagerService :
  T extends ServiceType.SoundManager ? SoundManagerService :
  undefined;
/* eslint-enable @typescript-eslint/indent */

export class Services {
  static get<T extends ServiceType>(serviceType: T): ServiceFromType<T> {
    let service;

    switch (serviceType) {
      case ServiceType.Resource:
        service = RESOURCE_SERVICE;
        break;
      case ServiceType.RoleManager:
        service = ROLE_MANAGER_SERVICE;
        break;
      case ServiceType.Button:
        service = BUTTON_MANAGER_SERVICE;
        break;
      case ServiceType.CameraManager:
        service = CAMERA_MANAGER_SERVICE;
        break;
      case ServiceType.PointOfInterestManager:
        service = POINT_OF_INTEREST_MANAGER_SERVICE;
        break;
      case ServiceType.LightManager:
        service = LIGHT_MANAGER_SERVICE;
        break;
      case ServiceType.SoundManager:
        service = SOUND_MANAGER_SERVICE;
        break;
    }

    return service as ServiceFromType<T>;
  }
}
