import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { DiscordPresence, UpdateRichPresence } from "../../packets/root/updateRichPresence";

export class DiscordService {
  async setRichPresence(connection: Connection, presence: DiscordPresence): Promise<void> {
    await connection.writeReliable(new UpdateRichPresence(presence));
  }
}
