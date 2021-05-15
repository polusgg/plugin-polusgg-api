A dead body stores 6 bytes of information:

```ts
enum BodyDirection {
  FacingLeft  = False,
  FacingRight = True,
}
```

|Type|Reason|Description|
|-|-|-|
|`boolean`|Fallen|Whether the body has already fallen|
|`BodyDirection<boolean>`|BodyDirection|The direction of the body|
|`Byte[4]`|Color|The color of the body in RGBA|
|`Byte[4]`|ShadowColor|The shadow color of the body in RGBA|

Dead bodies have no RPCs.
