type Category = {
  id: number;
  title: string;
};

enum MemberType {
  Enum,
  Number,
  Boolean,
}

type BaseMember = {
  memberId: number;
  categoryId: number;
  title: string;
};

type Member = BaseMember & (
  {
    type: MemberType.Enum;
    values: string[];
  } |
  {
    type: MemberType.Number;
    range: [number, number];
    step: number;
  } |
  {
    type: MemberType.Boolean;
  }
);

type Schema = {
  version: number;
  categories: Category[];
  members: Member[];
};
