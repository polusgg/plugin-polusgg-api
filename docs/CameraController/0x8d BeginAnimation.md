# `0x8d` CameraController - BeginAnimation
## Types
- AnimationKeyframe (Message [Tag=0x00])
|      Type      |      Name      |              Description              |
|----------------|----------------|---------------------------------------|
| `PackedUInt32` | Offset         | Millisecond offset into the animation |
| `Boolean`      | Duration       | Millisecond animation duration        |
| `Vector2`      | Position       | Position offset of camera             |            
| `Float32`      | Angle          | Camera's Angle                        |
| `Byte[4]`      | Overlay Color  | The overlay color                     |

## S2C (Request)
| Type | Name | Description |
| --- | --- | --- |
| `AnimationKeyframe[]` | Keyframes | The keyframes of the animation |
| `Boolean`             | Reset     | Should the animation reset to default state once complete |
