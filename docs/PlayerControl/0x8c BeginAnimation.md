# `0x8c` PlayerControl - BeginAnimation
## Types
- AnimationKeyframe (Message [Tag=0x00])
|      Type      |      Name      |              Description              |
|----------------|----------------|---------------------------------------|
| `PackedUInt32` | Offset         | Millisecond offset into the animation |
| `PackedUInt32` | Duration       | Millisecond animation duration        |
| `Float32`      | PlayerOpacity  | The Player Opacity at this point      |
| `Float32`      | HatOpacity     | The Hat Opacity at this point         |
| `Float32`      | PetOpacity     | The Pet Opacity at this point         |
| `Float32`      | SkinOpacity    | The Skin Opacity at this point        |
| `Byte[4]`      | PrimaryColor   | The Primary Color at this point       |
| `Byte[4]`      | SecondaryColor | The Secondary Color at this point     |
| `Byte[4]`      | TertiaryColor  | The Tertiary Color at this point      |
| `Vector2`      | Scale          | Player's Scale Modifier               |
| `Vector2`      | Position       | Player's Position Offset              |
| `Float32`      | Angle          | Player's Angle                        |

## S2C (Request)
| Type | Name | Description |
| --- | --- | --- |
| `AnimationKeyframe[]` | Keyframes | The keyframes of the animation |
| `Boolean`             | Reset     | Should the animation reset to default state once complete |
