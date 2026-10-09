import { DrawShapeTool, DrawShapeUtil, EraserTool, SelectTool, type Editor, type TLRecord, type TLShapeId } from 'tldraw'
import { CANVAS_H, CANVAS_W, RecordTypeName, ShapeKind, type ShapeRecord } from '@doodle/shared'

import { CAMERA, CAMERA_Z } from '@/constants/board'

export const SHAPE_UTILS = [DrawShapeUtil]
export const TOOLS = [SelectTool, DrawShapeTool, EraserTool]

export const isDrawRecord = (r: unknown): r is ShapeRecord =>
  !!r && typeof r === 'object' && (r as ShapeRecord).typeName === RecordTypeName.Shape && (r as ShapeRecord).type === ShapeKind.Draw

const USER_PREFERENCES = { colorScheme: 'light', animationSpeed: 0, isSnapMode: false } as const

export function configureEditor(editor: Editor) {
  editor.user.updateUserPreferences(USER_PREFERENCES)

  editor.setCameraOptions({
    isLocked: false,
    wheelBehavior: 'none',
    panSpeed: 0,
    zoomSpeed: 0,
    zoomSteps: [CAMERA_Z],
    constraints: {
      bounds: { x: 0, y: 0, w: CANVAS_W, h: CANVAS_H },
      padding: { x: 0, y: 0 },
      origin: { x: 0.5, y: 0.5 },
      initialZoom: CAMERA.zoom,
      baseZoom: CAMERA.zoom,
      behavior: CAMERA.behavior,
    },
  })

  editor.setCamera({ x: 0, y: 0, z: CAMERA_Z }, { immediate: true, reset: true })
}

export function applyRemote(editor: Editor, puts: ShapeRecord[], removes: string[]) {
  editor.store.mergeRemoteChanges(() => {
    if (puts.length) {
      try {
        editor.store.put(puts as unknown as TLRecord[])
      } catch {
        for (const rec of puts) {
          try {
            editor.store.put([rec as unknown as TLRecord])
          } catch {
            continue
          }
        }
      }
    }

    const gone = removes.filter((id) => editor.store.has(id as TLShapeId)) as TLShapeId[]

    if (gone.length) editor.store.remove(gone)
  })
}

export function replaceAllRemote(editor: Editor, shapes: ShapeRecord[]) {
  const keep = new Set(shapes.map((s) => s.id))
  const stale = [...editor.getCurrentPageShapeIds()].filter((id) => !keep.has(id))

  applyRemote(editor, shapes, stale)
}

export function drawRecordsOf(editor: Editor): ShapeRecord[] {
  return [...editor.getCurrentPageShapeIds()].map((id) => editor.store.get(id as TLShapeId)).filter(isDrawRecord) as unknown as ShapeRecord[]
}

export function clearBoard(editor: Editor) {
  const ids = [...editor.getCurrentPageShapeIds()]

  editor.run(() => editor.deleteShapes(ids), { ignoreShapeLock: true })
}
