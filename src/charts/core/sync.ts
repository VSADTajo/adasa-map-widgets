/**
 * Grupos de sincronización de gráficas (`syncGroup`): las gráficas de un
 * mismo grupo comparten cursor, tooltip y zoom, aunque usen motores
 * distintos. Los valores de X viajan normalizados (ms en ejes temporales).
 */

export type SyncRange = { start: number | string; end: number | string } | null

export interface SyncMember {
  showCursor: (x: number | string | null) => void
  zoomTo: (range: SyncRange) => void
}

const groups = new Map<string, Set<SyncMember>>()

/** Une `member` al grupo `group`. Devuelve cómo avisar al resto y cómo salir. */
export function joinSyncGroup(group: string, member: SyncMember) {
  const members = groups.get(group) ?? new Set<SyncMember>()
  members.add(member)
  groups.set(group, members)

  /**
   * Aplica `action` a los demás miembros. Un fallo en uno no puede romper al
   * que avisa (el aviso se hace dentro de su evento de ratón) ni a los demás.
   */
  const notifyOthers = (action: (other: SyncMember) => void) => {
    for (const other of members) {
      if (other === member) continue
      try {
        action(other)
      } catch (error) {
        console.error('[ASChart] syncGroup', error)
      }
    }
  }
  return {
    /** El cursor de este miembro está en `x` (o salió): moverlo en los demás. */
    cursor: (x: number | string | null) => notifyOthers((other) => other.showCursor(x)),
    /** Este miembro hizo zoom a `range` (o lo quitó): aplicarlo en los demás. */
    zoom: (range: SyncRange) => notifyOthers((other) => other.zoomTo(range)),
    leave: () => {
      members.delete(member)
      if (members.size === 0) groups.delete(group)
    },
  }
}

/** Miembros actuales de un grupo (para tests y depuración). */
export function syncGroupSize(group: string): number {
  return groups.get(group)?.size ?? 0
}
