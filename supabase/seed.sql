-- Seed 40 mock players (10 per position) + 20 ranking clubs

-- Players: 24 bronce, 12 plata, 4 oro, 1 leyenda across all positions
-- Per position: 6 bronce, 3 plata, 1 oro (leyenda on one DEL)

insert into players_master (id, nombre, equipo_real, posicion, rareza, costo_base) values
-- GK (10)
('11111111-1111-1111-1111-111111110001', 'Guardián Andino', 'Bogotá FC', 'GK', 'bronce', 2500000),
('11111111-1111-1111-1111-111111110002', 'Portero del Pacífico', 'Cali Sur', 'GK', 'bronce', 2800000),
('11111111-1111-1111-1111-111111110003', 'Muralla Caribe', 'Barranquilla U', 'GK', 'bronce', 3000000),
('11111111-1111-1111-1111-111111110004', 'Vigía Cafetero', 'Manizales CF', 'GK', 'bronce', 3200000),
('11111111-1111-1111-1111-111111110005', 'Custodio Orinoquía', 'Villavicencio SC', 'GK', 'bronce', 3500000),
('11111111-1111-1111-1111-111111110006', 'Arquero Sabana', 'Tunja United', 'GK', 'bronce', 3800000),
('11111111-1111-1111-1111-111111110007', 'Portero Esmeralda', 'Bogotá FC', 'GK', 'plata', 5500000),
('11111111-1111-1111-1111-111111110008', 'Guardameta Dorado', 'Medellín Stars', 'GK', 'plata', 6500000),
('11111111-1111-1111-1111-111111110009', 'Titán de Arco', 'Cali Sur', 'GK', 'plata', 7500000),
('11111111-1111-1111-1111-111111110010', 'Ídolo Bajo Palos', 'Barranquilla U', 'GK', 'oro', 12000000),
-- DEF (10)
('22222222-2222-2222-2222-222222220001', 'Muro Antioqueño', 'Medellín Stars', 'DEF', 'bronce', 2500000),
('22222222-2222-2222-2222-222222220002', 'Defensa Sabana', 'Tunja United', 'DEF', 'bronce', 2800000),
('22222222-2222-2222-2222-222222220003', 'Capitán Andino', 'Bogotá FC', 'DEF', 'bronce', 3000000),
('22222222-2222-2222-2222-222222220004', 'Zaguero Pacífico', 'Cali Sur', 'DEF', 'bronce', 3200000),
('22222222-2222-2222-2222-222222220005', 'Roca Caribe', 'Barranquilla U', 'DEF', 'bronce', 3500000),
('22222222-2222-2222-2222-222222220006', 'Baluarte Cafetero', 'Manizales CF', 'DEF', 'bronce', 3800000),
('22222222-2222-2222-2222-222222220007', 'Central Esmeralda', 'Bogotá FC', 'DEF', 'plata', 5500000),
('22222222-2222-2222-2222-222222220008', 'Líbero Dorado', 'Medellín Stars', 'DEF', 'plata', 6500000),
('22222222-2222-2222-2222-222222220009', 'Muralla Legendaria', 'Cali Sur', 'DEF', 'plata', 7500000),
('22222222-2222-2222-2222-222222220010', 'Titán Defensivo', 'Barranquilla U', 'DEF', 'oro', 13000000),
-- MED (10)
('33333333-3333-3333-3333-333333330001', 'Volante Andino', 'Bogotá FC', 'MED', 'bronce', 2500000),
('33333333-3333-3333-3333-333333330002', 'Creador Pacífico', 'Cali Sur', 'MED', 'bronce', 2800000),
('33333333-3333-3333-3333-333333330003', 'Maestro Caribe', 'Barranquilla U', 'MED', 'bronce', 3000000),
('33333333-3333-3333-3333-333333330004', 'Pivote Cafetero', 'Manizales CF', 'MED', 'bronce', 3200000),
('33333333-3333-3333-3333-333333330005', 'Enganche Sabana', 'Tunja United', 'MED', 'bronce', 3500000),
('33333333-3333-3333-3333-333333330006', 'Motor Orinoquía', 'Villavicencio SC', 'MED', 'bronce', 3800000),
('33333333-3333-3333-3333-333333330007', 'Cerebro Esmeralda', 'Bogotá FC', 'MED', 'plata', 5500000),
('33333333-3333-3333-3333-333333330008', 'Conductor Dorado', 'Medellín Stars', 'MED', 'plata', 6500000),
('33333333-3333-3333-3333-333333330009', 'Genio del Medio', 'Cali Sur', 'MED', 'plata', 7500000),
('33333333-3333-3333-3333-333333330010', 'Maestro Legendario', 'Barranquilla U', 'MED', 'oro', 14000000),
-- DEL (10) — includes the only leyenda
('44444444-4444-4444-4444-444444440001', 'Goleador Andino', 'Bogotá FC', 'DEL', 'bronce', 2500000),
('44444444-4444-4444-4444-444444440002', 'Artillero Pacífico', 'Cali Sur', 'DEL', 'bronce', 2800000),
('44444444-4444-4444-4444-444444440003', 'Cazagoles Caribe', 'Barranquilla U', 'DEL', 'bronce', 3000000),
('44444444-4444-4444-4444-444444440004', 'Delantero Cafetero', 'Manizales CF', 'DEL', 'bronce', 3200000),
('44444444-4444-4444-4444-444444440005', 'Rompe Redes Sabana', 'Tunja United', 'DEL', 'bronce', 3500000),
('44444444-4444-4444-4444-444444440006', 'Asesino Orinoquía', 'Villavicencio SC', 'DEL', 'bronce', 3800000),
('44444444-4444-4444-4444-444444440007', 'Francotirador Esmeralda', 'Bogotá FC', 'DEL', 'plata', 5500000),
('44444444-4444-4444-4444-444444440008', 'Depredador Dorado', 'Medellín Stars', 'DEL', 'plata', 6500000),
('44444444-4444-4444-4444-444444440009', 'Ídolo del Área', 'Cali Sur', 'DEL', 'oro', 15000000),
('44444444-4444-4444-4444-444444440010', 'Leyenda del Gol', 'Barranquilla U', 'DEL', 'leyenda', 25000000);

-- Global league
insert into leagues (id, nombre, tipo, codigo_invitacion, created_by)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Liga Global PRESI',
  'global',
  null,
  null
);

-- Mock ranking (20 clubs)
insert into ranking_mock (club_nombre, escudo_config, puntos, posicion) values
('Atlético Cumbre', '{"templateId":1,"primaryColor":"#1B2A4A","secondaryColor":"#C9A227"}', 2840, 1),
('Real Sabana FC', '{"templateId":2,"primaryColor":"#2E86AB","secondaryColor":"#F4EFE4"}', 2715, 2),
('Deportivo Pacífico', '{"templateId":3,"primaryColor":"#1B2A4A","secondaryColor":"#2E86AB"}', 2650, 3),
('Unión Caribe', '{"templateId":4,"primaryColor":"#C9A227","secondaryColor":"#1B2A4A"}', 2580, 4),
('Bogotá Stars', '{"templateId":5,"primaryColor":"#1B2A4A","secondaryColor":"#C9A227"}', 2490, 5),
('Cafeteros FC', '{"templateId":6,"primaryColor":"#2E86AB","secondaryColor":"#F4EFE4"}', 2410, 6),
('Orinoquía United', '{"templateId":7,"primaryColor":"#1B2A4A","secondaryColor":"#2E86AB"}', 2355, 7),
('Esmeralda Athletic', '{"templateId":8,"primaryColor":"#C9A227","secondaryColor":"#1B2A4A"}', 2280, 8),
('Antioquia City', '{"templateId":1,"primaryColor":"#2E86AB","secondaryColor":"#C9A227"}', 2210, 9),
('Valle Dorado', '{"templateId":2,"primaryColor":"#1B2A4A","secondaryColor":"#F4EFE4"}', 2150, 10),
('Cordillera FC', '{"templateId":3,"primaryColor":"#C9A227","secondaryColor":"#2E86AB"}', 2080, 11),
('Magdalena Rovers', '{"templateId":4,"primaryColor":"#1B2A4A","secondaryColor":"#C9A227"}', 1995, 12),
('Santander Lions', '{"templateId":5,"primaryColor":"#2E86AB","secondaryColor":"#1B2A4A"}', 1920, 13),
('Tolima Warriors', '{"templateId":6,"primaryColor":"#1B2A4A","secondaryColor":"#F4EFE4"}', 1850, 14),
('Huila Phoenix', '{"templateId":7,"primaryColor":"#C9A227","secondaryColor":"#2E86AB"}', 1780, 15),
('Nariño FC', '{"templateId":8,"primaryColor":"#1B2A4A","secondaryColor":"#C9A227"}', 1710, 16),
('Meta Rangers', '{"templateId":1,"primaryColor":"#2E86AB","secondaryColor":"#F4EFE4"}', 1640, 17),
('Boyacá Chiefs', '{"templateId":2,"primaryColor":"#1B2A4A","secondaryColor":"#C9A227"}', 1575, 18),
('Cauca Eagles', '{"templateId":3,"primaryColor":"#C9A227","secondaryColor":"#1B2A4A"}', 1500, 19),
('Amazonas FC', '{"templateId":4,"primaryColor":"#2E86AB","secondaryColor":"#C9A227"}', 1420, 20);
