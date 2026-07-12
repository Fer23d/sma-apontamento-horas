import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { ColaboradorPage } from '../pages/ColaboradorPage'
import { HistoricoPage } from '../pages/HistoricoPage'
import { LoginPage } from '../pages/LoginPage'
import { NovoApontamentoPage } from '../pages/NovoApontamentoPage'
import { PerfilPage } from '../pages/PerfilPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/colaborador" element={<AppLayout />}>
        <Route index element={<ColaboradorPage />} />
        <Route path="apontamentos/novo" element={<NovoApontamentoPage />} />
        <Route path="historico" element={<HistoricoPage />} />
        <Route path="perfil" element={<PerfilPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
