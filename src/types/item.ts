export type Item = {
  id: string;
  name: string;
  amongUsId: number;
  thumbnail: string;
  resource: {
    path: string;
    url: string;
    id: number;
  };
  author: string;
} & (
  {
    type: "HAT";
  } | {
    type: "PET";
  } | {
    type: "SKIN";
  } | {
    type: "MODEL";
  }
);
