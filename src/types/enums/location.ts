export enum Location {
  GameCode,        // e.g. Code\nXADFJK
  GamePlayerCount, // e.g. 8 / 10
  TaskText,
  RoomTracker,
  PingTracker,     // NOTE: setting this prevents the ping from updating until it's set to the string "__unset" at which point it will go back to default behaviour. Strings can also be sent with %s, like "Your ping is: %s" which would update live w/ your ping
  TaskCompletion,  // e.g. "TOTAL TASKS COMPLETED"
  GameOptions
}
