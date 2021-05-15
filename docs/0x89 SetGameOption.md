# `0x90` Root - SetGameOption

```ts
enum GameOptionType {
  Number,
  Boolean,
  Enum,
}
```

## S2C2S (Request)
| Type | Name | Description |
| --- | --- | --- |
| `UInt16` | SequenceID | Sequence ID sent to the client for packet ordering |
| `String` | OptionCategory | The category of the option stylized as its header |
| `UInt16` | OptionPriority | Priority level used to sort game options |
| `String` | OptionName | The name of the option |
| `JSValue` | OptionValue | The value of the option |

## Type JSValue
| Type | Name | Description |
| ---- | ---- | ----------- |
| `OptionType.Number` | Type | GameOptionType as a byte |
| `Float32` | Value | Option Value |
| `Float32` | Step | Step | 
| `Float32` | Lower | Lower Bound | 
| `Float32` | Upper | Upper Bound | 
| `Boolean` | ZeroIsInfinity | If a value of zero is treated as infinity | 
| `String` | FormatString | The FormatString used when rendering the value | 

<!-- OR -->
| Type | Name | Description |
| ---- | ---- | ----------- |
| `OptionType.Boolean` | Type | GameOptionType as a byte |
| `Boolean` | Value | Option Value |

<!-- OR -->
| Type | Name | Description |
| ---- | ---- | ----------- |
| `OptionType.Enum` | Type | GameOptionType as a byte |
| `PackedUInt32` | Index | Option Index |
| `String[]` | Values | Option Values |
