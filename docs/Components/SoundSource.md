SoundSources 

## Enums:
SoundType {
  None,
  SFX,
  Music,
}

The SoundType enum is intended to reflect base game's sound types.
if None then volume is locked at 100%
if SFX use the base game SFX slider
if Music use the base game Music slider

## Data:
|Type|Reason|Description|
|-|-|-|
|`PackedUInt32`|ResourceID|The ID of the sound resource used|
|`Float32`|Pitch|The pitch of the sound|
|`Float32`|VolumeModifier|A modifier for the base game volume (e.g. if modifier is 0.5 and base game vol is 0.5, final vol is 0.25)|
|`Boolean`|Looping|Whether the resource is currently looping|
|`SoundType`|SoundType|The type of the sound|
|`Float32`|SoundFalloffMultiplier|The multiplier for sound falloff|
|`Float32`|SoundFalloffStartingRadius|The radius where sound falloff begins|
|`Float32`|Seek|The seek into the sound|
|`Boolean`|Paused|True if paused|

SoundFalloff explanation:

1-|###############
  |               ##
  |                 #
  |                  ##
  |                    #
0-|------------------------------------
   |      |      |      |      |      |
   0      1      2      3      4      5

^ the above image shows a SoundFalloffMultiplier of 1 and a SoundFalloffStartingRadius of 2

1-|######################
  |                      ###
  |                         ####
  |                             ###
  |                                ###
0-|------------------------------------
   |      |      |      |      |      |
   0      1      2      3      4      5

^ the above image shows a SoundFalloffMultiplier of 2 and a SoundFalloffStartingRadius of 3

Sound falloff can be calculated with the following formulas:

![Imgur link to formulas](https://imgur.com/a/ELdbYra)

An example Desmos graph is linked [Here](https://www.desmos.com/calculator/dsqtn31em3)
