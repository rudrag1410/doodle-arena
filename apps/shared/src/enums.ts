export enum Phase {
  Lobby = 'lobby',
  Choosing = 'choosing',
  Drawing = 'drawing',
  TurnEnd = 'turnEnd',
  GameEnd = 'gameEnd',
}

export enum ChatKind {
  Chat = 'chat',
  System = 'system',
  Correct = 'correct',
  Close = 'close',
  Secret = 'secret',
}

export enum TurnEndReason {
  Time = 'time',
  AllGuessed = 'all-guessed',
  DrawerLeft = 'drawer-left',
}

export enum JoinErrorCode {
  RoomNotFound = 'ROOM_NOT_FOUND',
  RoomFull = 'ROOM_FULL',
  Invalid = 'INVALID',
  RateLimited = 'RATE_LIMITED',
  ServerBusy = 'SERVER_BUSY',
}

export enum CanvasRejectReason {
  Rate = 'rate',
  Invalid = 'invalid',
  TooLarge = 'too-large',
  NotDrawer = 'not-drawer',
}

export enum ToastKind {
  Error = 'error',
  Info = 'info',
}

export enum ClientEvent {
  RoomCreate = 'room:create',
  RoomJoin = 'room:join',
  RoomLeave = 'room:leave',
  RoomSettings = 'room:settings',
  GameStart = 'game:start',
  GameReset = 'game:reset',
  TurnPick = 'turn:pick',
  CanvasOps = 'canvas:ops',
  CanvasFull = 'canvas:full',
  Chat = 'chat',
  TimeSync = 'time:sync',
}

export enum ServerEvent {
  State = 'state',
  Chat = 'chat',
  CanvasOps = 'canvas:ops',
  CanvasFull = 'canvas:full',
  CanvasReject = 'canvas:reject',
  Replay = 'replay',
  Toast = 'toast',
  Kicked = 'kicked',
}

export enum SocketLifecycle {
  Connection = 'connection',
  Connect = 'connect',
  Disconnect = 'disconnect',
  ConnectError = 'connect_error',
  Reconnect = 'reconnect',
}

export enum TransportKind {
  WebSocket = 'websocket',
}

export enum RecordTypeName {
  Shape = 'shape',
}

export enum ShapeKind {
  Draw = 'draw',
}

export enum SegmentType {
  Free = 'free',
  Straight = 'straight',
}

export enum FillStyle {
  None = 'none',
  Semi = 'semi',
  Solid = 'solid',
  Fill = 'fill',
}

export enum DashStyle {
  Draw = 'draw',
  Solid = 'solid',
  Dashed = 'dashed',
  Dotted = 'dotted',
}

export enum BrushSize {
  Small = 's',
  Medium = 'm',
  Large = 'l',
  ExtraLarge = 'xl',
}

export enum PaletteColor {
  Black = 'black',
  Grey = 'grey',
  White = 'white',
  Red = 'red',
  LightRed = 'light-red',
  Orange = 'orange',
  Yellow = 'yellow',
  LightGreen = 'light-green',
  Green = 'green',
  LightBlue = 'light-blue',
  Blue = 'blue',
  Violet = 'violet',
  LightViolet = 'light-violet',
}

export enum PackId {
  Classic = 'classic',
  Animals = 'animals',
  Food = 'food',
  Things = 'things',
  Places = 'places',
  Tech = 'tech',
}
