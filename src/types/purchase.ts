export type Purchase = {
  id: string;
  bundleId: string;
  cost: number;
  purchaser: string;
  timeCreated: number;
  timeFinalized: number;
  finalized: boolean;
  vendorData: {
    name: "STEAM";
    orderId: string;
    userId: number;
  } | {
    name: "PLAY_STORE";
    transactionId: string;
  } | {
    name: "FREE";
    // a note for the reason an item was given out freely
    note: string;
  };
};
