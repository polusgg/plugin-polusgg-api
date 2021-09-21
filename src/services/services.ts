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
import { CosmeticService } from "./cosmetics/cosmeticService";
import { EndGameService } from "./endGame/endGameService";
import { HudService } from "./hud/hudService";
import { EmojiService } from "./emojiService/emojiService";
import { DiscordService } from "./discord/discordService";
import { ColliderService } from "./colliderService/colliderService";
import { ChatService } from "./chat/chatService";

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
  [ServiceType.Cosmetic]: new CosmeticService(),
  [ServiceType.EndGame]: new EndGameService(),
  [ServiceType.Hud]: new HudService(),
  [ServiceType.Emoji]: new EmojiService(),
  [ServiceType.Discord]: new DiscordService(),
  [ServiceType.Colliders]: new ColliderService(),
  [ServiceType.Chat]: new ChatService()
};

export class Services {
  static get<T extends ServiceType>(serviceType: T): (typeof serviceFromType)[T] {
    return serviceFromType[serviceType];
  }
}
