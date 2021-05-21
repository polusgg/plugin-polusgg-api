import { Server } from "@nodepolus/framework/src/server";
import { DisplaySystemAlertPacket } from "../../packets/root/displaySystemAlert";

declare const server: Server;

export class NotificationService {
  async displayNotification(notification: string): Promise<void> {
    await Promise.allSettled([...server.getConnections().values()].map(async connection => connection.writeReliable(new DisplaySystemAlertPacket(notification))));
  }
}
