ClickBehaviours are attached to any entity who wants to recieve clicks, and have a cooldown.

This component contains the following data:

## Data:
|Type|Reason|Description|
|-|-|-|
|`Float32`|MaxTimer|The maximum time for this button|
|`Float32`|CurrentTime|The current timer state|
|`Boolean`|IsCountingDown|When true, the game will start counting the button down|
|`Byte[4]`|Color|The color of the timer in RGBA format|

If MaxTimer is zero, the server should not send any cooldown data (extend cooldown).

# RpcClickButton `(0x86) [ C => S ]`

RpcClickButton has no arguments or data, and is intended to be fired when the behaviour has been activated.

# RpcSetCountingDown `(0x90) [ C => S ]`

See ClickBehaviour/0x90 SetCountingDown.md