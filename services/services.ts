import { ServiceType } from "../types/enums";
import { ResourceService } from "./resource";
import { ServiceInstance } from ".";

const RESOURCE_SERVICE = new ResourceService();

type ServiceFromType<T extends ServiceType> =
  T extends ServiceType.Resource ? ResourceService
  : void;

export class Services {
  static get<T extends ServiceType>(serviceType: T): ServiceFromType<T> {
    let service: ServiceInstance | undefined;

    switch (serviceType) {
      case ServiceType.Resource:
        service = RESOURCE_SERVICE;
        break;
    }

    return service as ServiceFromType<T>;
  }
}
