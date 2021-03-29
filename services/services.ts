import { ServiceType } from "../types/enums";
import { RoleManagerService } from "./roleManager";
import { ResourceService } from "./resource";

const RESOURCE_SERVICE = new ResourceService();
const ROLE_MANAGER_SERVICE = new RoleManagerService();

type ServiceFromType<T extends ServiceType> =
  T extends ServiceType.Resource ? ResourceService :
    T extends ServiceType.RoleManager ? RoleManagerService : undefined;

export class Services {
  static get<T extends ServiceType>(serviceType: T): ServiceFromType<T> {
    let service;

    switch (serviceType) {
      case ServiceType.Resource:
        service = RESOURCE_SERVICE;
        break;
      case ServiceType.RoleManager:
        service = ROLE_MANAGER_SERVICE;
    }

    return service as ServiceFromType<T>;
  }
}
