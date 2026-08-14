import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import EstoqueList from './pages/estoque/EstoqueList'
import NovaCompra from './pages/estoque/NovaCompra'
import DetalheCompra from './pages/estoque/DetalheCompra'
import EstoqueConfiguracoes from './pages/estoque/EstoqueConfiguracoes'
import VendasList from './pages/vendas/VendasList'
import NovaVenda from './pages/vendas/NovaVenda'
import PedidoDetalhe from './pages/vendas/PedidoDetalhe'
import ClientesList from './pages/clientes/ClientesList'
import NovoCliente from './pages/clientes/NovoCliente'
import ClienteDetalhe from './pages/clientes/ClienteDetalhe'
import Mapa from './pages/mapa/Mapa'
import ProducaoDiaria from './pages/producao/ProducaoDiaria'
import NovaProducao from './pages/producao/NovaProducao'
import DetalheProducao from './pages/producao/DetalheProducao'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/estoque" element={<ProtectedRoute><EstoqueList /></ProtectedRoute>} />
      <Route path="/estoque/nova" element={<ProtectedRoute><NovaCompra /></ProtectedRoute>} />
      <Route path="/estoque/configuracoes" element={<ProtectedRoute><EstoqueConfiguracoes /></ProtectedRoute>} />
      <Route path="/estoque/:id" element={<ProtectedRoute><DetalheCompra /></ProtectedRoute>} />
      <Route path="/vendas" element={<ProtectedRoute><VendasList /></ProtectedRoute>} />
      <Route path="/vendas/nova" element={<ProtectedRoute><NovaVenda /></ProtectedRoute>} />
      <Route path="/vendas/:id" element={<ProtectedRoute><PedidoDetalhe /></ProtectedRoute>} />
      <Route path="/clientes" element={<ProtectedRoute><ClientesList /></ProtectedRoute>} />
      <Route path="/clientes/novo" element={<ProtectedRoute><NovoCliente /></ProtectedRoute>} />
      <Route path="/clientes/:id" element={<ProtectedRoute><ClienteDetalhe /></ProtectedRoute>} />
      <Route path="/mapa" element={<ProtectedRoute><Mapa /></ProtectedRoute>} />
      <Route path="/producao" element={<ProtectedRoute><ProducaoDiaria /></ProtectedRoute>} />
      <Route path="/producao/nova" element={<ProtectedRoute><NovaProducao /></ProtectedRoute>} />
      <Route path="/producao/:id" element={<ProtectedRoute><DetalheProducao /></ProtectedRoute>} />
    </Routes>
  )
}
