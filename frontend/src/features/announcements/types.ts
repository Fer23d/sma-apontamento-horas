export type ComunicadoTipo = 'info' | 'alerta' | 'urgente'
export type ComunicadoDestinatario = 'all' | 'team' | 'individual'

export interface Comunicado {
  id: string
  titulo: string
  mensagem: string
  dataPublicacao: string
  timestamp: string
  autor: string
  tipo: ComunicadoTipo
  urgencia: ComunicadoTipo
  tipo_destinatario: ComunicadoDestinatario
  alvo_referencia: string | null
}
