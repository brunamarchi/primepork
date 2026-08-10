-- Prime Pork — dados de demonstração (FICTÍCIOS)
-- 20 clientes em SP (Mooca, Bela Vista/Bexiga e Centro perto do Mercadão),
-- 3 compras de matéria-prima e ~26 pedidos com datas variadas para exercitar
-- o mapa (cores de recompra) e o dashboard (estoque x pedidos pendentes).
--
-- Todos os registros têm "[DEMO]" nas observações — para apagar tudo depois,
-- veja o bloco de limpeza comentado no final do arquivo.

-- ============================================================
-- Compras de matéria-prima
-- ============================================================

insert into purchases (purchase_date, raw_weight_kg, yield_quantity, yield_weight_kg, notes) values
('2026-07-15', 300, 250, 210, '[DEMO] Peça grande fornecedor X'),
('2026-07-25', 200, 165, 140, '[DEMO] Compra semanal'),
('2026-08-05', 350, 290, 245, '[DEMO] Reposição de estoque');

-- ============================================================
-- Clientes
-- ============================================================

insert into clients (id, full_name, phone, address_zip, address_street, address_number, address_neighborhood, address_city, address_state, lat, lng, geocode_status, geocoded_at, notes) values
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001', 'Ana Beatriz Souza', '(11) 91234-5601', '01024-000', 'Rua Cantareira', '150', 'Centro', 'São Paulo', 'SP', -23.5405, -46.6301, 'success', now(), '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002', 'Carlos Eduardo Lima', '(11) 91234-5602', '03114-000', 'Rua da Mooca', '1200', 'Mooca', 'São Paulo', 'SP', -23.5590, -46.5960, 'success', now(), '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0003', 'Fernanda Oliveira Santos', '(11) 91234-5603', '01326-000', 'Rua Rui Barbosa', '340', 'Bela Vista', 'São Paulo', 'SP', -23.5558, -46.6435, 'success', now(), '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0004', 'Roberto Carlos Pereira', '(11) 91234-5604', '01021-000', 'Rua 25 de Março', '800', 'Centro', 'São Paulo', 'SP', -23.5430, -46.6275, 'success', now(), '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0005', 'Juliana Costa Almeida', '(11) 91234-5605', '03115-000', 'Rua Bresser', '450', 'Mooca', 'São Paulo', 'SP', -23.5620, -46.5990, 'success', now(), '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0006', 'Marcelo Henrique Rocha', '(11) 91234-5606', '01327-000', 'Rua Treze de Maio', '220', 'Bela Vista', 'São Paulo', 'SP', -23.5582, -46.6465, 'success', now(), '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0007', 'Patrícia Gomes Ferreira', '(11) 91234-5607', '01030-000', 'Rua Florêncio de Abreu', '90', 'Centro', 'São Paulo', 'SP', -23.5398, -46.6310, 'success', now(), '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0008', 'Diego Santos Ribeiro', '(11) 91234-5608', '03119-000', 'Rua Borges de Figueiredo', '610', 'Mooca', 'São Paulo', 'SP', -23.5598, -46.6005, 'success', now(), '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0009', 'Camila Rodrigues Dias', '(11) 91234-5609', '01324-000', 'Rua Major Diogo', '175', 'Bela Vista', 'São Paulo', 'SP', -23.5545, -46.6470, 'success', now(), '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0010', 'Bruno Alves Martins', '(11) 91234-5610', '01008-000', 'Rua Líbero Badaró', '300', 'Centro', 'São Paulo', 'SP', -23.5440, -46.6295, 'success', now(), '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0011', 'Larissa Fernandes Castro', '(11) 91234-5611', '03108-000', 'Avenida Paes de Barros', '980', 'Mooca', 'São Paulo', 'SP', -23.5635, -46.5955, 'success', now(), '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0012', 'Thiago Barbosa Nunes', '(11) 91234-5612', '01403-000', 'Alameda Joaquim Eugênio de Lima', '500', 'Bela Vista', 'São Paulo', 'SP', -23.5595, -46.6420, 'success', now(), '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0013', 'Renata Cardoso Teixeira', '(11) 91234-5613', '01029-000', 'Rua Senador Queirós', '60', 'Centro', 'São Paulo', 'SP', -23.5412, -46.6260, 'success', now(), '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0014', 'Rodrigo Mendes Araújo', '(11) 91234-5614', '03166-000', 'Rua Taquari', '700', 'Mooca', 'São Paulo', 'SP', -23.5580, -46.5940, 'success', now(), '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0015', 'Vanessa Pinto Correia', '(11) 91234-5615', '01333-000', 'Rua São Carlos do Pinhal', '410', 'Bela Vista', 'São Paulo', 'SP', -23.5560, -46.6485, 'success', now(), '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0016', 'Eduardo Lopes Batista', '(11) 91234-5616', '01002-000', 'Praça do Patriarca', '20', 'Centro', 'São Paulo', 'SP', -23.5385, -46.6288, 'success', now(), '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0017', 'Sabrina Moreira Cunha', '(11) 91234-5617', '03105-000', 'Rua Monsenhor Anacleto', '330', 'Mooca', 'São Paulo', 'SP', -23.5612, -46.5920, 'success', now(), '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0018', 'Felipe Duarte Ramos', '(11) 91234-5618', '01326-010', 'Rua Rui Barbosa', '88', 'Bela Vista', 'São Paulo', 'SP', -23.5605, -46.6440, 'success', now(), '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0019', 'Gabriela Nascimento Vieira', '(11) 91234-5619', '01014-000', 'Rua Boa Vista', '260', 'Centro', 'São Paulo', 'SP', -23.5425, -46.6320, 'success', now(), '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0020', 'Lucas Monteiro Azevedo', '(11) 91234-5620', '03120-000', 'Rua Piratininga', '540', 'Mooca', 'São Paulo', 'SP', -23.5645, -46.5985, 'success', now(), '[DEMO]');

-- ============================================================
-- Pedidos
-- Grupos: verde (recompra tranquila), amarelo (recompra próxima),
-- vermelho (atrasado), clientes com 1 pedido só, e 2 sem nenhum pedido.
-- ============================================================

insert into orders (client_id, order_date, quantity, weight_kg, total_price, status, delivered_at, notes) values
-- Verde
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001', '2026-07-17', 10.7, 9, 378.00, 'entregue', '2026-07-17', '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001', '2026-08-04', 13.0, 11, 462.00, 'entregue', '2026-08-04', '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002', '2026-07-18', 11.9, 10, 420.00, 'entregue', '2026-07-18', '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002', '2026-08-05', 14.2, 12, 504.00, 'entregue', '2026-08-05', '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0003', '2026-07-19', 9.5, 8, 336.00, 'entregue', '2026-07-19', '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0003', '2026-08-06', 11.9, 10, 420.00, 'entregue', '2026-08-06', '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0004', '2026-07-16', 13.0, 11, 462.00, 'entregue', '2026-07-16', '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0004', '2026-08-03', 15.4, 13, 546.00, 'entregue', '2026-08-03', '[DEMO]'),
-- Amarelo
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0005', '2026-07-13', 14.2, 12, 504.00, 'entregue', '2026-07-13', '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0005', '2026-07-28', 16.6, 14, 588.00, 'entregue', '2026-07-28', '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0006', '2026-07-15', 10.7, 9, 378.00, 'entregue', '2026-07-15', '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0006', '2026-07-30', 11.9, 10, 420.00, 'entregue', '2026-07-30', '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0007', '2026-07-11', 17.8, 15, 630.00, 'entregue', '2026-07-11', '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0007', '2026-07-26', 19.0, 16, 672.00, 'entregue', '2026-07-26', '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0008', '2026-07-17', 11.9, 10, 420.00, 'entregue', '2026-07-17', '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0008', '2026-08-01', 13.0, 11, 462.00, 'entregue', '2026-08-01', '[DEMO]'),
-- Vermelho
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0009', '2026-06-28', 23.7, 20, 840.00, 'entregue', '2026-06-28', '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0009', '2026-07-13', 21.3, 18, 756.00, 'entregue', '2026-07-13', '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0010', '2026-07-02', 16.6, 14, 588.00, 'entregue', '2026-07-02', '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0010', '2026-07-17', 17.8, 15, 630.00, 'entregue', '2026-07-17', '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0011', '2026-06-25', 11.9, 10, 420.00, 'entregue', '2026-06-25', '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0011', '2026-07-10', 10.7, 9, 378.00, 'entregue', '2026-07-10', '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0012', '2026-07-05', 19.0, 16, 672.00, 'entregue', '2026-07-05', '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0012', '2026-07-20', 16.6, 14, 588.00, 'entregue', '2026-07-20', '[DEMO]'),
-- Um pedido só (cinza no mapa)
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0013', '2026-08-07', 14.2, 12, 504.00, 'entregue', '2026-08-07', '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0014', '2026-08-08', 10.7, 9, 378.00, 'entregue', '2026-08-08', '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0015', '2026-08-09', 17.8, 15, 630.00, 'pendente', null, '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0016', '2026-08-06', 21.3, 18, 756.00, 'pendente', null, '[DEMO]'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0017', '2026-08-09', 177.8, 150, 6300.00, 'pendente', null, '[DEMO] Pedido grande para evento'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0018', '2026-08-08', 189.6, 160, 6720.00, 'pendente', null, '[DEMO] Pedido grande para evento');
-- Clientes 19 e 20 ficam propositalmente sem nenhum pedido (pin cinza / "sem histórico").

-- ============================================================
-- Para remover todos os dados de demonstração depois, rode:
--
-- delete from orders where notes like '[DEMO]%';
-- delete from clients where notes = '[DEMO]';
-- delete from purchases where notes like '[DEMO]%';
-- ============================================================
