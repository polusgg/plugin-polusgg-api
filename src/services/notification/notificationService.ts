import { DisplaySystemAlertPacket } from "@polusgg/plugin-polusgg-api/src/packets/root/displaySystemAlert";
import { Server } from "@polusgg/plugin-polusgg-api/node_modules/@nodepolus/framework/src/server"

declare const server: Server;

export class NotificationService {
  async displayNotification(notification: string): Promise<void> {
    await Promise.allSettled([...server.getConnections().values()].map(connection => connection.writeReliable(new DisplaySystemAlertPacket(notification))));
  }
}
