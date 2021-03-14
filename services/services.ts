import { ServiceType } from "../types/enums";
import { ResourceService } from "./resource";

const RESOURCE_SERVICE = new ResourceService();

type ServiceFromType<T extends ServiceType> =
  T extends ServiceType.Resource ? ResourceService : undefined;

export class Services {
  static get<T extends ServiceType>(serviceType: T): ServiceFromType<T> {
    let service;

    switch (serviceType) {
      case ServiceType.Resource:
        service = RESOURCE_SERVICE;
        break;
    }

    return service as ServiceFromType<T>;
  }
}
