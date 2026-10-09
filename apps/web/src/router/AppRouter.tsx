import { Route, Switch } from 'wouter'

import { HomePage } from '@/pages/HomePage'
import { RoomPage } from '@/pages/RoomPage'

export const AppRouter = () => (
  <Switch>
    <Route path="/r/:roomId">{({ roomId }) => <RoomPage roomId={roomId.toUpperCase()} />}</Route>
    <Route component={HomePage} />
  </Switch>
)
