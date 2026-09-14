import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ReportsHierarchy } from './ReportsHierarchy'
import type { ReportSupervisor } from './types'

const supervisors: ReportSupervisor[] = [{
  id: 'supervisor-1',
  name: 'Supervisora',
  workedMinutes: 480,
  extraMinutes: 60,
  nightMinutes: 0,
  bankMinutes: 30,
  collaborators: [],
}]

describe('ReportsHierarchy', () => {
  it('usa a mesma grade para títulos e dados do supervisor', () => {
    const markup = renderToStaticMarkup(<ReportsHierarchy supervisors={supervisors} />)
    const grid = 'grid-cols-[minmax(220px,1fr)_120px_110px_100px_80px]'

    expect(markup).toContain('Horas trabalhadas')
    expect(markup.split(grid)).toHaveLength(3)
  })
})
