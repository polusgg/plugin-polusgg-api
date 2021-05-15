# `0x85` Root - DeclareHat

## S2C (Request)
|      Type      |      Name      |              Description              |
|----------------|----------------|---------------------------------------|
| `PackedUInt32` | HatID          | ID of the hat                         |
| `PackedUInt32` | FrontID        | ID of the hat's frontside sprite      |
| `PackedUInt32` | BackID         | ID of the hat's backside sprite       |
| `PackedUInt32` | FloorID        | ID of the hat's death sprite          |
| `PackedUInt32` | ClimbID        | ID of the hat's climbing sprite       |
| `PackedUInt32` | HatShader      | ID of the hat's shader                |
| `Vector2`      | Offset         | Hat's chip offset                     |
| `Boolean`      | Bounces        | Makes hat bounce                      |
| `Boolean`      | HasBack        | Whether the hat has a back image to use |
| `Boolean`      | Accessible     | Accessible in the hat selector        |
