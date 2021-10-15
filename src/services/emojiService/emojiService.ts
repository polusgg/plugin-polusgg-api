const staticEmojiNames = <const>[
  "crewmate",
  "crewalign",
  "neutalign",
  "impoalign",
  "impostor",
  "grenadier",
  "jester",
  "engineer",
  "oracle",
  "phantom",
  "serialkiller",
  "snitch",
  "sheriff",
  "impervious",
  "locksmith",
  "swooper",
  "partner",
  "skeld",
  "mira",
  "polus",
  "submerged",
  "morphling",
  "airship",
  "poisoner",
  "platItch",
  "platGoogle",
  "platSteam",
  "platEpic",
  "platIOS", // it's platPlaceholder ingame
  "platUnknown",
  "mentor",
  "identitythief"
];

type StaticEmojiName = (typeof staticEmojiNames)[number];

export class EmojiService {
  static static(staticEmoji: StaticEmojiName): `<sprite index=${number}>` | "" {
    const c = staticEmojiNames.indexOf(staticEmoji);

    if (c === -1) {
      console.warn(`Invalid emoji: ${staticEmoji}`);

      return "";
    }

    return <const>`<sprite index=${c}>`;
  }
}
