-- =============================================================================
-- CSG-OITS  |  Seed Data
-- Run this after applying all migrations (001 → 002 → 003).
-- Safe to re-run — all inserts use ON CONFLICT DO NOTHING.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Default system settings row
-- ---------------------------------------------------------------------------
INSERT INTO settings (system_name, logo_url, access_paused)
VALUES ('CSG-OITS', null, false)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- CSG committees (2025-2026)
-- ---------------------------------------------------------------------------
INSERT INTO committees (name) VALUES
  ('Rules and Internal Affairs Committee'),
  ('Committee on External Affairs'),
  ('Secretariat Committee'),
  ('Committee on Finance'),
  ('Committee on Audit'),
  ('Committee on Culture, Athletics, and Arts'),
  ('Social and Environmental Awareness Committee'),
  ('Committee on Creatives'),
  ('Committee on Student Affairs and Concern'),
  ('Committee on Web Development')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Officers (2025-2026)
-- committee_name drives a LEFT JOIN to committees so integer FK references
-- in the original data are resolved to UUIDs automatically.
-- position is stored as jsonb (array of role strings per officer).
-- Names with apostrophes are escaped ('' in SQL).
-- Duplicate name in source data noted below with a comment.
-- ---------------------------------------------------------------------------
INSERT INTO officers
  (full_name, position, avatar, type, socials, year_serving, student_number, committee, is_committee_official)
SELECT
  d.full_name,
  d.pos::jsonb,
  d.avatar,
  d.type,
  NULLIF(d.socials, ''),
  d.year_serving,
  NULLIF(d.student_number, ''),
  c.id,
  d.is_official
FROM (VALUES
  -- Executive officers
  ('Zoe R. Gil',                    '["President"]',                                                                         '2025-2026/pres.png',         'executive', 'https://www.facebook.com/profile.php?id=61575036856303', '2025-2026', '',          '',                                                  false),
  ('Ken B. Lentejas',               '["Vice President of Internal Affairs","RIAC Chairperson"]',                             '2025-2026/vpi.png',          'executive', 'https://www.facebook.com/keyihen.el',                   '2025-2026', '',          'Rules and Internal Affairs Committee',              true),
  ('John Jefferson M. De Leon',     '["Vice President of External Affairs","COEXA Chairperson"]',                            '2025-2026/vpe.png',          'executive', 'https://www.facebook.com/jphcrpdm',                     '2025-2026', '',          'Committee on External Affairs',                     true),
  ('Daniel D. Camaclang',           '["Secretary General","Secretariat Chairperson"]',                                      '2025-2026/sec.png',          'executive', 'https://www.facebook.com/Daniel.Camaclang0213',         '2025-2026', '',          'Secretariat Committee',                             true),
  ('Samantha Natalie Fattalo',      '["Treasurer","Finance Chairperson"]',                                                   '2025-2026/treasurer.png',    'executive', 'https://www.facebook.com/hubbyyyyy',                    '2025-2026', '',          'Committee on Finance',                              true),
  ('Cristina V. Domingo',           '["Auditor","Committee on Audit Chairperson"]',                                         '2025-2026/auditor.png',      'executive', 'https://www.facebook.com/profile.php?id=100094032691673','2025-2026','',           'Committee on Audit',                                true),
  ('Kenn Harvey F. Brocoy',         '["Public Relations Officer","Creatives Head"]',                                        '2025-2026/pro.png',          'executive', 'https://www.facebook.com/eli.chikenn',                  '2025-2026', '',          'Committee on Creatives',                            true),

  -- Board members (SAP representatives)
  ('Angela C. Regidor',             '["SAP Business Administration"]',                                                      '2025-2026/ba.png',           'board',     'https://www.facebook.com/share/1BPRgFhHEU/',            '2025-2026', '',          '',                                                  false),
  ('Charles Derrick A. Garcia',     '["SAP Computer Science","Creatives Chairperson"]',                                     '2025-2026/cs.png',           'board',     'https://www.facebook.com/share/1BnreUAh5A/',            '2025-2026', '',          'Committee on Creatives',                            true),
  ('Juanita Anjela M. Rivas',       '["SAP Education","CSAC Chairperson"]',                                                 '2025-2026/educ.png',         'board',     'https://www.facebook.com/share/16ySQteSWw/',            '2025-2026', '',          'Committee on Student Affairs and Concern',          true),
  ('Mikaella Kathe Palileo',        '["SAP Entrepreneurship","RIAC Circulation Officer"]',                                  '2025-2026/entrep.png',       'board',     'https://www.facebook.com/share/1Cv4q431YZ/',            '2025-2026', '',          '',                                                  false),
  ('Misael A. Ponferrada',          '["SAP Hospitality Management","Liason Officer"]',                                      '2025-2026/hm.png',           'board',     'https://www.facebook.com/share/14Pcg263Z2i/',           '2025-2026', '',          'Secretariat Committee',                             false),
  ('Ivan P. Duran',                 '["SAP Information Technology","WebDev Chairperson","Records and Documentations Officer"]','2025-2026/it.png',         'board',     'https://www.facebook.com/infectious.ivan/',             '2025-2026', '',          'Committee on Web Development',                      true),
  ('Chris John Labalan',            '["SAP Journalism","Assistant Treasurer"]',                                              '2025-2026/journ.png',        'board',     'https://www.facebook.com/share/1N69TcWjQk/',            '2025-2026', '',          'Committee on Finance',                              true),
  ('Lorie P. Salude',               '["SAP Office Administration","Assistant Secretary","SocEnvi Chairperson"]',            '2025-2026/ofad.png',         'board',     'https://www.facebook.com/share/17XB2CYAQp/',            '2025-2026', '',          'Social and Environmental Awareness Committee',       true),
  ('Mary Eunice D. Ramos',          '["SAP Psychology","CCAA Chairperson"]',                                                '2025-2026/psych.png',        'board',     'https://www.facebook.com/merie.ramos.9',                '2025-2026', '',          'Committee on Culture, Athletics, and Arts',         true),
  ('John Harold R. Magma',          '["GAD Representative","WebDev Vice Chairperson"]',                                     'CSG_logo.svg',               'board',     '',                                                      '2025-2026', '',          'Committee on Web Development',                      true),

  -- Advisers
  ('Jenny Danica P. Abayari, MAEd', '["Adviser"]',                                                                          '2025-2026/adviser-jen.png',  'adviser',   '',                                                      '2025-2026', '',          '',                                                  false),
  ('Alfe M. Solina, DBA',           '["Adviser"]',                                                                          'CSG_logo.svg',               'adviser',   '',                                                      '2025-2026', '',          '',                                                  false),

  -- Former officers
  ('Jimmuel D. Palma',              '["GAD Representative"]',                                                               '2025-2026/gad.png',          'former',    'https://www.facebook.com/jimmuelpalma',                 '2025-2026', '',          '',                                                  false),

  -- Members — Committee on Web Development
  ('Lorenz E. Tuboro',              '["Back-End Developer"]',                                                               'CSG_logo.svg',               'member',    'https://facebook.com/herelieszee3',                     '2025-2026', '251080225', 'Committee on Web Development',                      false),
  ('Ralph Kenneth B. Perez',        '["UI/UX Designer"]',                                                                   'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Web Development',                      false),
  ('Jerald D. Estrella',            '["Front-End Developer"]',                                                              'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Web Development',                      false),
  ('Taisei Domingo',                '["Front-End Developer"]',                                                              'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Web Development',                      false),
  ('Gerald D. Alansalon',           '["Documentation Officer"]',                                                            'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Web Development',                      false),

  -- Members — Rules and Internal Affairs Committee (RIAC)
  ('Rica Babes B. Delos Reyes',     '["RIAC Vice Chairperson"]',                                                            'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Rules and Internal Affairs Committee',              true),
  ('Craven Mish Lorraine L. Norbe', '["Secretary"]',                                                                        'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Rules and Internal Affairs Committee',              false),
  ('Chieko M. Lantajo',             '["Assistant Secretary"]',                                                              'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Rules and Internal Affairs Committee',              false),
  ('Ivan Reniel H. Amangca',        '["Member"]',                                                                           'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Rules and Internal Affairs Committee',              false),
  ('Loubert L. Apin',               '["Member"]',                                                                           'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Rules and Internal Affairs Committee',              false),
  ('Carmella P. Cayetano',          '["Member"]',                                                                           'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Rules and Internal Affairs Committee',              false),
  ('Marvilyn G. Frias',             '["Member"]',                                                                           'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Rules and Internal Affairs Committee',              false),
  ('Kimverly S. Mina',              '["Member"]',                                                                           'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Rules and Internal Affairs Committee',              false),

  -- Members — Committee on External Affairs (COEXA)
  ('Dean Levi''s G. Aquino',        '["COEXA Vice Chairperson"]',                                                           'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on External Affairs',                     true),
  ('Allexzeus Marvel C. Padilla',   '["COEXA Secretary"]',                                                                  'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on External Affairs',                     false),
  ('Juria Mae N. Dela Cerna',       '["Member"]',                                                                           'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on External Affairs',                     false),
  ('Ryren Hagos',                   '["Member"]',                                                                           'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on External Affairs',                     false),
  ('Juvert V. Vista',               '["Member"]',                                                                           'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on External Affairs',                     false),

  -- Members — Secretariat Committee
  ('Zachariah Sydney U. Babon',     '["Undersecretary"]',                                                                   'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Secretariat Committee',                             false),
  ('Ishra Firreli B. Fernando',     '["Undersecretary"]',                                                                   'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Secretariat Committee',                             false),
  ('Ma. Cristina Hernandez',        '["Undersecretary"]',                                                                   'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Secretariat Committee',                             false),
  ('Minea Sabina M. Feliciano',     '["Undersecretary"]',                                                                   'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Secretariat Committee',                             false),
  ('Jose Angelo Bitanga',           '["Undersecretary"]',                                                                   'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Secretariat Committee',                             false),
  ('Gwen Marinie Paciente',         '["Undersecretary"]',                                                                   'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Secretariat Committee',                             false),
  ('Ariane Nicole D. Comedia',      '["Undersecretary"]',                                                                   'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Secretariat Committee',                             false),

  -- Members — Committee on Finance
  ('Arjeff Tejero',                 '["Associate"]',                                                                         'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Finance',                              false),
  ('Jasmine Ramos',                 '["Associate"]',                                                                         'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Finance',                              false),
  ('Vhilroi Allyza T. Pader',       '["Associate"]',                                                                        'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Finance',                              false),
  ('Arriane Joy H. Alburo',         '["Associate"]',                                                                         'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Finance',                              false),
  ('Krisha Lauren L. Genido',       '["Associate"]',                                                                         'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Finance',                              false),
  ('Danica Mae C. Viray',           '["Associate"]',                                                                         'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Finance',                              false),

  -- Members — Committee on Audit
  ('Ma. Shammel G. Layba',          '["Assistant Auditor"]',                                                                'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Audit',                                true),
  ('Jason T. Pagal',                '["Commissioner"]',                                                                     'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Audit',                                false),
  ('Raine Kristea Candiz Maxine M. Cerro', '["Commissioner"]',                                                              'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Audit',                                false),
  ('Matt Froy Davis C. Parilla',    '["Commissioner"]',                                                                     'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Audit',                                false),
  ('Jhomari Kenshin P. Sarte',      '["Commissioner"]',                                                                     'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Audit',                                false),
  ('Ericka Ann P. Palatino',        '["Commissioner"]',                                                                     'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Audit',                                false),

  -- Members — Committee on Culture, Athletics, and Arts (CCAA)
  ('Hans Christian O. Ancierto',    '["CCAA Vice Chairperson"]',                                                            'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Culture, Athletics, and Arts',         true),
  ('Anjon-Lores E. Cañares',        '["Secretary"]',                                                                        'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Culture, Athletics, and Arts',         false),
  ('Jay Ar V. Rondina',             '["Member"]',                                                                           'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Culture, Athletics, and Arts',         false),
  ('Georgie May G. Tunay',          '["Member"]',                                                                           'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Culture, Athletics, and Arts',         false),
  ('Keith Owen B. Silva',           '["Member"]',                                                                           'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Culture, Athletics, and Arts',         false),

  -- Members — Social and Environmental Awareness Committee (SocEnvi)
  ('Jennifer Nazareno',             '["Member"]',                                                                           'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Social and Environmental Awareness Committee',       false),
  ('Ralfh Dharren Molina',          '["SocEnvi Vice Chairperson"]',                                                         'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Social and Environmental Awareness Committee',       true),

  -- Members — Committee on Creatives
  ('Zhiro Francisco',               '["Layout Artist"]',                                                                    'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Creatives',                            false),
  ('Princess Ugerio',               '["Layout Artist"]',                                                                    'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Creatives',                            false),
  ('Abegail Dizon',                 '["Layout Artist"]',                                                                    'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Creatives',                            false),
  ('Shaine Apin',                   '["Layout Artist"]',                                                                    'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Creatives',                            false),
  ('Kristian Elmer Dela Torre',     '["Video Editor"]',                                                                     'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Creatives',                            false),
  ('Dominic Loreno',                '["Photographer"]',                                                                     'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Creatives',                            false),
  ('Reniel Azores',                 '["Photographer"]',                                                                     'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Creatives',                            false),
  ('Samantha Eiriel Ocampo',        '["Event Organizer"]',                                                                  'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Creatives',                            false),
  ('Reign Jairus Liwanag',          '["Event Organizer"]',                                                                  'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Creatives',                            false),
  ('Sandara Torres',                '["Event Host"]',                                                                       'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Creatives',                            false),
  ('Christine Joy Malabanan',       '["Event Host"]',                                                                       'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Creatives',                            false),
  ('Isaac Yzrayelle Sarmiento',     '["Technical Coordinator"]',                                                            'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Creatives',                            false),
  ('Shaun Russelle Obsenares',      '["Technical Coordinator"]',                                                            'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Creatives',                            false),
  ('Liam Arrel Libid',              '["Technical Coordinator"]',                                                            'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Creatives',                            false),

  -- Members — Committee on Student Affairs and Concern (CSAC)
  ('Athena Contrivida',             '["CSAC Vice Chairperson"]',                                                            'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Student Affairs and Concern',          true),
  ('Rhian Llaneza',                 '["Member"]',                                                                           'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Student Affairs and Concern',          false),
  ('Angel Sasis',                   '["Member"]',                                                                           'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Student Affairs and Concern',          false),
  ('Warren Reyes',                  '["Member"]',                                                                           'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Student Affairs and Concern',          false),
  ('Julia Consular',                '["Secretary"]',                                                                        'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Student Affairs and Concern',          false),
  ('Joshua Jabas',                  '["Member"]',                                                                           'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Student Affairs and Concern',          false),
  ('Michaela Miel R. Siapno',       '["Member"]',                                                                           'CSG_logo.svg',               'member',    '',                                                      '2025-2026', '',          'Committee on Student Affairs and Concern',          false)
) AS d(full_name, pos, avatar, type, socials, year_serving, student_number, committee_name, is_official)
LEFT JOIN committees c ON c.name = d.committee_name AND d.committee_name <> ''
ON CONFLICT (full_name, year_serving) DO NOTHING;

-- NOTE: 'Craven Mish Norbe' (row 155 in source CSV) appears to be a duplicate
-- of 'Craven Mish Lorraine L. Norbe' (row 89) with a shortened name. Only the
-- complete name is included above. Verify with the CSG records office.
