import { ServiceType } from "../types/enums";
import { EndGameService } from "./endGame";
import { ResourceService } from "./resource";

const RESOURCE_SERVICE = new ResourceService();
const END_GAME_SERVICE = new EndGameService();

type ServiceFromType<T extends ServiceType> =
  T extends ServiceType.Resource ? ResourceService :
    T extends ServiceType.EndGame ? EndGameService : undefined;

export class Services {
  static get<T extends ServiceType>(serviceType: T): ServiceFromType<T> {
    let service;

    switch (serviceType) {
      case ServiceType.Resource:
        service = RESOURCE_SERVICE;
        break;
      case ServiceType.EndGame:
        service = END_GAME_SERVICE;
    }

    return service as ServiceFromType<T>;
  }
}
