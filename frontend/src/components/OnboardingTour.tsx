import { useEffect, useState } from 'react'
import { Joyride, STATUS, type EventData, type Step } from 'react-joyride'
import { useLocation } from 'react-router-dom'

const TOUR_STORAGE_KEY = '@sma-banco:hasSeenTour'

const steps: Step[] = [
  { target: '.tour-menu', title: 'Navegação principal', content: 'Use este menu para alternar entre a Visão geral, Novo apontamento, Histórico, Ausências, Quadro de Avisos e Meu perfil.', placement: 'right' },
  { target: '.tour-calendario', title: 'Seu calendário', content: 'Consulte o mês, acompanhe a situação de cada dia e interaja com as datas para abrir seus lançamentos ou iniciar um novo apontamento.', placement: 'bottom' },
  { target: '.tour-btn-apontar', title: 'Novo apontamento', content: 'Acesse aqui o formulário para registrar suas horas, projeto, atividade e detalhamento do trabalho realizado.', placement: 'bottom' },
  { target: '.tour-saldo', title: 'Acompanhe seu saldo', content: 'Nestes cards você acompanha as horas previstas, trabalhadas, extras e o saldo acumulado no mês.', placement: 'top' },
]

export function OnboardingTour() {
  const location = useLocation()
  const [run, setRun] = useState(false)

  useEffect(() => {
    if (location.pathname !== '/colaborador' || localStorage.getItem(TOUR_STORAGE_KEY)) return
    const timer = window.setTimeout(() => setRun(true), 700)
    return () => window.clearTimeout(timer)
  }, [location.pathname])

  function handleCallback({ status }: EventData) {
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true')
      setRun(false)
    }
  }

  return <Joyride steps={steps} run={run} continuous onEvent={handleCallback} locale={{ back: 'Voltar', close: 'Fechar', last: 'Concluir', next: 'Próximo', skip: 'Pular' }} options={{ showProgress: true, buttons: ['back', 'primary', 'skip'], overlayClickAction: false, spotlightPadding: 8, spotlightRadius: 16, arrowColor: '#132532', backgroundColor: '#132532', overlayColor: 'rgba(3, 10, 16, 0.78)', primaryColor: '#77C2A4', textColor: '#F8FAFC', zIndex: 10000 }} styles={{ tooltip: { border: '1px solid #1F3B4D', borderRadius: 16, boxShadow: '0 16px 40px rgba(0, 0, 0, 0.28)' }, buttonPrimary: { borderRadius: 10, color: '#0A161E', fontWeight: 800 }, buttonBack: { color: '#94A3B8', fontWeight: 700 }, buttonSkip: { color: '#94A3B8', fontWeight: 700 } }} />
}
