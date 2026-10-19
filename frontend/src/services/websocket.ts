import type { TacticalState, Vector2D } from '../types/combat'

export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'

export interface ActionFeedbackMessage {
  type: 'ACTION_FEEDBACK'
  action: 'ATTACK' | 'COUNTERMEASURE' | 'MANEUVER'
  success: boolean
  message: string
  projectile_id?: string
}

export class CombatWebSocket {
  private ws: WebSocket | null = null
  private matchId: string
  private status: ConnectionStatus = 'DISCONNECTED'
  private reconnectTimer: number | null = null
  private shouldReconnect: boolean = true

  public onTacticalTick: ((state: TacticalState) => void) | null = null
  public onFeedback: ((feedback: ActionFeedbackMessage) => void) | null = null
  public onStatusChange: ((status: ConnectionStatus) => void) | null = null

  constructor(matchId: string) {
    this.matchId = matchId
  }

  public connect() {
    this.shouldReconnect = true
    this.cleanup()

    const wsUrl = `ws://127.0.0.1:8000/ws/combat/${this.matchId}`
    this.updateStatus('CONNECTING')

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        this.updateStatus('CONNECTED')
      }

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (payload.type === 'TACTICAL_TICK' && payload.state) {
            this.onTacticalTick?.(payload.state)
          } else if (payload.type === 'ACTION_FEEDBACK') {
            this.onFeedback?.(payload)
          }
        } catch (e) {
          console.error('[ARMAGEDDON WS] Failed to parse message', e)
        }
      }

      this.ws.onclose = () => {
        this.updateStatus('DISCONNECTED')
        if (this.shouldReconnect) {
          this.scheduleReconnect()
        }
      }

      this.ws.onerror = (err) => {
        console.error('[ARMAGEDDON WS] WebSocket error:', err)
        this.updateStatus('ERROR')
      }
    } catch (e) {
      console.error('[ARMAGEDDON WS] Connection instantiation error:', e)
      this.updateStatus('ERROR')
      this.scheduleReconnect()
    }
  }

  public updateMatchId(newMatchId: string) {
    if (this.matchId !== newMatchId) {
      this.matchId = newMatchId
      this.connect()
    }
  }

  public sendAttack(attackerId: string, weaponId: string, targetPos: Vector2D, targetShipId?: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'ATTACK',
        attacker_id: attackerId,
        weapon_id: weaponId,
        target_pos: targetPos,
        target_ship_id: targetShipId
      }))
    }
  }

  public sendCountermeasure(shipId: string, cmId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'COUNTERMEASURE',
        ship_id: shipId,
        cm_id: cmId
      }))
    }
  }

  public sendManeuver(shipId: string, heading?: number, speed?: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'MANEUVER',
        ship_id: shipId,
        heading: heading !== undefined ? Number(heading) : undefined,
        speed: speed !== undefined ? Number(speed) : undefined
      }))
    }
  }

  public disconnect() {
    this.shouldReconnect = false
    this.cleanup()
    this.updateStatus('DISCONNECTED')
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      if (this.shouldReconnect) {
        this.connect()
      }
    }, 2000)
  }

  private cleanup() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.onopen = null
      this.ws.onmessage = null
      this.ws.onclose = null
      this.ws.onerror = null
      try {
        this.ws.close()
      } catch {
        // Ignore close error
      }
      this.ws = null
    }
  }

  private updateStatus(status: ConnectionStatus) {
    this.status = status
    this.onStatusChange?.(status)
  }

  public getStatus(): ConnectionStatus {
    return this.status
  }
}
