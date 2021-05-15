CustomNetworkTransform which has ClientAspect boolean to determine whether AspectPosition or Absolute position should be used. Absolute position will always be used in world-space components.

|Type|Reason|Description|
|-|-|-|
|`Byte`|Alignment|Alignment from the screen|
|`Vector2`|Position|Position of the object|
|`Float32`|ZAxis|The Z component of the object's position|
|`PackedInt32`|Attached|NetId of the customNetworkTransform this is attached to (-1 represents no attachment)| 

```ts
enum EdgeAlignments {
  RightBottom = 6,
  LeftBottom = 5,
  RightTop = 10,
  Left = 1,
  Right,
  Top = 8,
  Bottom = 4,
  LeftTop = 9,
  None = 11
}
```

This component has only one RPC and shares a call ID with its base game counterpart.

# RpcSnapTo `(0x15) [ C => S ]`
|Type|Reason|Description
|-|-|-|
|`Vector2`|Position|Absolute/relative position of the object
