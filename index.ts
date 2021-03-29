import { RootPacket } from "@nodepolus/framework/src/protocol/packets/hazel";
import { BasePlugin } from "@nodepolus/framework/src/api/plugin";
import { ResizePacket } from "./packets/root";
import { Services } from "./services";
import { ServiceType } from "./types/enums";
import { BaseMod } from "./baseMod/baseMod";
import { PlayerRole } from "@nodepolus/framework/src/types/enums";

RootPacket.registerPacket(0x81, ResizePacket.deserialize, (connection, packet) => {
  connection.setMeta({
    displaySize: {
      width: packet.width,
      height: packet.height,
    },
  });
});

export default class PolusGGApi extends BasePlugin {
  private readonly mods: BaseMod[] = [];

  constructor() {
    super({
      name: "Polus.gg API",
      version: [1, 0, 0],
    });

    BaseMod.owner = this;

    this.server.on("game.started", event => {
      event.getImpostors().forEach(p => p.setRole(PlayerRole.Impostor));
      Services.get(ServiceType.RoleManager).assignRoles(event.getGame(), this.mods.filter(mod => mod.getEnabled(event.getGame().getLobby())).map(e => e.getRoles(event.getGame().getLobby())).flat());
    });
  }

  registerMod(mod: BaseMod): void {
    this.mods.push(mod);
  }
}
