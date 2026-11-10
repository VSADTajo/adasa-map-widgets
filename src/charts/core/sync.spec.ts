import { describe, expect, it, vi } from 'vitest'
import { joinSyncGroup, syncGroupSize, type SyncMember } from './sync'

const member = (): SyncMember => ({ showCursor: vi.fn(), zoomTo: vi.fn() })

describe('joinSyncGroup', () => {
  it('reenvía cursor y zoom a los demás miembros, no al que avisa', () => {
    const a = member()
    const b = member()
    const syncA = joinSyncGroup('g1', a)
    const syncB = joinSyncGroup('g1', b)
    syncA.cursor(10)
    syncA.zoom({ start: 1, end: 5 })
    expect(b.showCursor).toHaveBeenCalledWith(10)
    expect(b.zoomTo).toHaveBeenCalledWith({ start: 1, end: 5 })
    expect(a.showCursor).not.toHaveBeenCalled()
    syncA.leave()
    syncB.leave()
  })

  it('los grupos son independientes y se borran al quedar vacíos', () => {
    const a = member()
    const other = member()
    const syncA = joinSyncGroup('g2', a)
    const syncOther = joinSyncGroup('otro', other)
    const source = joinSyncGroup('g2', member())
    source.cursor(null)
    expect(a.showCursor).toHaveBeenCalledWith(null)
    expect(other.showCursor).not.toHaveBeenCalled()
    for (const sync of [syncA, syncOther, source]) sync.leave()
    expect(syncGroupSize('g2')).toBe(0)
    expect(syncGroupSize('otro')).toBe(0)
  })

  it('un miembro que falla no impide avisar al resto', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const broken: SyncMember = {
      showCursor: () => {
        throw new Error('boom')
      },
      zoomTo: vi.fn(),
    }
    const ok = member()
    const syncs = [joinSyncGroup('g3', broken), joinSyncGroup('g3', ok)]
    const source = joinSyncGroup('g3', member())
    expect(() => source.cursor(3)).not.toThrow()
    expect(ok.showCursor).toHaveBeenCalledWith(3)
    for (const sync of [...syncs, source]) sync.leave()
  })
})
