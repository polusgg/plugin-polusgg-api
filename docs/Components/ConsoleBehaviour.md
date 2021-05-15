ConsoleBehaviours are the world space equivalents ClickBehaviours, and are used to be used by player huds.

This component contains Data:

|Type|Name|Description|
|-|-|-|
|`Byte`|Size|How many people have access to the console at a time|
|`Byte[]`|Player Ids|Who has access to the console|

That data should be later replaced with can use boolean.

This component shares an RPC with ClickBehaviour.

# RpcUseConsole `(0x87) [ C => S ]`

RpcUseConsole has no arguments or data, and is intended to be fired when the behaviour has been activated.