# `0x80` Root - Fetch Resource 
## S2C (Request)
| Type | Name | Description |
| --- | --- | --- |
| `PackedUInt32` | ResourceID | The ID of the Resource |
| `Byte` | ResourceType | The type of the Resource being downloaded |
| `String` | ResourceLocation | The location of the Resource as a URL |
| `Byte[]` | hash | The MD5 hash of the resource |

## C2S (Response)
| Type | Name | Description |
| --- | --- | --- |
| `PackedUInt32` | ResourceID | The ID of the Resource |
| `Byte` | ResponseType | The type of the C2S Response |
| `Byte[]` | ResponseData | The data of the response |

```ts
enum ResourceType {
    AssetBundle,
    Assembly
}
```

### C2S (Response / DownloadEnded) ResponseType 0x01
| Type | Name | Description |
| --- | --- | --- |
| `Byte` | Reason | 0 if downloaded, 1 if cached |

### C2S (Response / DownloadFailed) ResponseType 0x02
| Type | Name | Description |
| --- | --- | --- |
| `PackedUInt32` | FailReason | The reason for the failure (enum) |

```ts
enum FailReason {
    BadLocation, // The resource was unable to be downloaded
    BadResource // The resource was unable to be loaded into the game
}
```

## Example Flow
```
S => C | 01 0000 // Reliable Packet Header
       | 200080  // FetchResource Message
       | 02      // Resource ID 0x02,
       | 01      // Resource Type 0x01,
       | 1E [ 68 74 74 70 3a 2f 2f 65 78 61 6d 70 6c 65 2e 63 6f 6d 2f 65 78 61 6d 70 6c 65 2e 70 6e 67 ]  // Resource Location "http://example.com/example.png"


C => S | 01 0002 // Reliable Packet Header
       | 02      // Resource ID 0x02
       | 01      // DownloadEnded 0x01
       | 00      // Download was from the internet

// The server can assume the client has recieved the resource and loaded it into memory. The server can now use Resource ID 0x02 to refrence this resource.
```
An error could occur any time in this flow, preventing future events from being emitted and cancelling the load of the resource.

Resources should be cached for 3 days
