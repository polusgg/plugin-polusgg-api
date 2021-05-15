Vents are the PNO equivalent of vents.

This component contains Data:

|Type|Name|Description|
|-|-|-|
|`PackedUInt32`|SpriteResourceID|The resource ID for the idle animation|
|`PackedUInt32`|EnterVentResourceID|The resource ID for the enter vent animation|
|`PackedUInt32`|ExitVentResourceID|The resource ID for the exit vent animation|
|`PackedUInt32`|ArrowResourceID|The resource ID for the vent arrow buttons|
|`Byte`|ID|This vent's ID|
|`Byte`|Left|Left vent's ID (0xFF if no connection)|
|`Byte`|Right|Right vent's ID (0xFF if no connection)|
|`Byte`|Center|Center vent's ID (0xFF if no connection)|
| | | Below, the data that will be sent once we have a proper console system |
|`Byte`|Size|How many people have access to the console at a time|
|`Byte[]`|Player IDs|Who has access to the console|

Sends the same rpcs as normal vents would.
