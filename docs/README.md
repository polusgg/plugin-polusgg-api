# Polus.gg API implementation details

## List of Root packets to implement

- 0x80 FetchResource
- 0x81 Resize
- 0x82 DisplayStartGameScreen
- 0x83 OverwriteGameOver
- 0x84 SetString
- 0x85 DeclareHat
- 0x86 DeclarePet
- 0x87 DeclareSkin
- 0x88 DeclareKillAnim
- 0x89 SetGameOption
- 0x8A DeleteGameOption
- 0x8B LoadHat
- 0xFA DisplaySystemAlert

## List of RPCs to implement

- 0x80 ChatVisibility
- 0x81 SetString
- 0x82 SetRole
- 0x83 CloseHud
- 0x84 Revive
- 0x85 PlaySound
- 0x86 ClickButton
- 0x87 UseConsole
- 0x89 DespawnAllVents
- 0x8a SetOutline
- 0x8b SetOpacity
- 0x8c BeginAnimation (PlayerControl)
- 0x8d BeginAnimation (CameraController)
- 0x8e CustomEnterVent
- 0x8f CustomExitVent

## List of PNOs to implement

- 0x80 Image
- 0x81 Button
- 0x82 Console (post-release)
- 0x83 DeadBody
- 0x84 Vent
- 0x85 SoundSource
- 0x86 LightSource
- 0x87 PointOfInterest
- 0x88 CameraController

## Remarks

1. SetInfected shows the IntroCutscene from the data that has been sent over with DisplayStartGameScreen.md
2. Anticheat for MurderPlayer should be removed.
