-- Clear existing expense templates
DELETE FROM public.wedding_templates WHERE template_type = 'expense';

-- Insert new expense templates with the detailed budget categories
INSERT INTO public.wedding_templates (template_type, title, category, amount, payment_status, order_index) VALUES

-- 1. Formalności i dokumenty
('expense', 'Opłaty USC', 'Formalności i dokumenty', 0, 'planned', 1),
('expense', 'Opłaty kościelne (jeśli ślub kościelny)', 'Formalności i dokumenty', 0, 'planned', 2),
('expense', 'Kurs przedmałżeński (jeśli ślub kościelny)', 'Formalności i dokumenty', 0, 'planned', 3),
('expense', 'Spotkania w poradni rodzinnej (jeśli ślub kościelny)', 'Formalności i dokumenty', 0, 'planned', 4),
('expense', 'Licencje, pozwolenia (np. fotograf w kościele)', 'Formalności i dokumenty', 0, 'planned', 5),
('expense', 'Tłumaczenia dokumentów (jeśli potrzebne)', 'Formalności i dokumenty', 0, 'planned', 6),
('expense', 'Ubezpieczenie OC organizatora/wedding plannera', 'Formalności i dokumenty', 0, 'planned', 7),

-- 2. Strój Panny Młodej
('expense', 'Suknia ślubna (zakup/wypożyczenie, przeróbki)', 'Strój Panny Młodej', 0, 'planned', 8),
('expense', 'Obuwie', 'Strój Panny Młodej', 0, 'planned', 9),
('expense', 'Biżuteria i dodatki', 'Strój Panny Młodej', 0, 'planned', 10),
('expense', 'Welon, ozdoby do włosów', 'Strój Panny Młodej', 0, 'planned', 11),
('expense', 'Fryzura', 'Strój Panny Młodej', 0, 'planned', 12),
('expense', 'Makijaż', 'Strój Panny Młodej', 0, 'planned', 13),
('expense', 'Bielizna i dodatki ślubne', 'Strój Panny Młodej', 0, 'planned', 14),
('expense', 'Manicure, pedicure, spa/relaks', 'Strój Panny Młodej', 0, 'planned', 15),
('expense', 'Suknia na poprawiny / zmiana sukni (opcjonalnie)', 'Strój Panny Młodej', 0, 'planned', 16),

-- 3. Strój Pana Młodego
('expense', 'Garnitur/smoking/frak (zakup/wypożyczenie, poprawki)', 'Strój Pana Młodego', 0, 'planned', 17),
('expense', 'Obuwie', 'Strój Pana Młodego', 0, 'planned', 18),
('expense', 'Mucha/krawat/spinki', 'Strój Pana Młodego', 0, 'planned', 19),
('expense', 'Kamizelka/pas', 'Strój Pana Młodego', 0, 'planned', 20),
('expense', 'Fryzura i pielęgnacja', 'Strój Pana Młodego', 0, 'planned', 21),
('expense', 'Bielizna i dodatki', 'Strój Pana Młodego', 0, 'planned', 22),
('expense', 'Strój na poprawiny (opcjonalnie)', 'Strój Pana Młodego', 0, 'planned', 23),

-- 4. Ceremonia
('expense', 'Dekoracje USC', 'Ceremonia', 0, 'planned', 24),
('expense', 'Dekoracje kościoła (jeśli ślub kościelny)', 'Ceremonia', 0, 'planned', 25),
('expense', 'Muzyka w USC', 'Ceremonia', 0, 'planned', 26),
('expense', 'Muzyka w kościele (organista, schola, solista – jeśli ślub kościelny)', 'Ceremonia', 0, 'planned', 27),
('expense', 'Ofiara dla księdza, kościelnego, ministrantów (jeśli ślub kościelny)', 'Ceremonia', 0, 'planned', 28),
('expense', 'Oprawa fotograficzna i video ceremonii', 'Ceremonia', 0, 'planned', 29),

-- 5. Wesele – lokal i obsługa
('expense', 'Wynajem sali / restauracji', 'Wesele – lokal i obsługa', 0, 'planned', 30),
('expense', 'Menu weselne (catering)', 'Wesele – lokal i obsługa', 0, 'planned', 31),
('expense', 'Napoje i alkohol', 'Wesele – lokal i obsługa', 0, 'planned', 32),
('expense', 'Ciasta, słodki stół', 'Wesele – lokal i obsługa', 0, 'planned', 33),
('expense', 'Tort weselny', 'Wesele – lokal i obsługa', 0, 'planned', 34),
('expense', 'Obsługa kelnerska', 'Wesele – lokal i obsługa', 0, 'planned', 35),
('expense', 'Opłaty za przedłużenie godzin sali / nadgodziny obsługi', 'Wesele – lokal i obsługa', 0, 'planned', 36),
('expense', 'Opłata korkowa (jeśli sala wymaga przy własnym alkoholu)', 'Wesele – lokal i obsługa', 0, 'planned', 37),

-- 6. Dekoracje i florystyka
('expense', 'Bukiet Panny Młodej', 'Dekoracje i florystyka', 0, 'planned', 38),
('expense', 'Butonierki, korsarze, kwiaty dla rodziców', 'Dekoracje i florystyka', 0, 'planned', 39),
('expense', 'Dekoracje sali (kwiaty, oświetlenie, dodatki)', 'Dekoracje i florystyka', 0, 'planned', 40),
('expense', 'Dekoracje stołów (obrusy, serwetki, świece)', 'Dekoracje i florystyka', 0, 'planned', 41),
('expense', 'Tablica powitalna, plan stołów', 'Dekoracje i florystyka', 0, 'planned', 42),
('expense', 'Dywan, dekoracja ołtarza (jeśli ślub kościelny)', 'Dekoracje i florystyka', 0, 'planned', 43),
('expense', 'Dekoracje samochodu Pary Młodej', 'Dekoracje i florystyka', 0, 'planned', 44),
('expense', 'Prezenty powitalne w pokojach hotelowych gości (opcjonalnie)', 'Dekoracje i florystyka', 0, 'planned', 45),

-- 7. Oprawa artystyczna
('expense', 'Zespół muzyczny / DJ', 'Oprawa artystyczna', 0, 'planned', 46),
('expense', 'Konferansjer / wodzirej (jeśli oddzielny)', 'Oprawa artystyczna', 0, 'planned', 47),
('expense', 'Atrakcje dodatkowe (fotobudka, animator dla dzieci, pokaz artystyczny, fajerwerki)', 'Oprawa artystyczna', 0, 'planned', 48),
('expense', 'Oprawa multimedialna (oświetlenie, efekty specjalne)', 'Oprawa artystyczna', 0, 'planned', 49),

-- 8. Foto & Video
('expense', 'Fotograf', 'Foto & Video', 0, 'planned', 50),
('expense', 'Kamerzysta', 'Foto & Video', 0, 'planned', 51),
('expense', 'Sesja narzeczeńska / plenerowa', 'Foto & Video', 0, 'planned', 52),
('expense', 'Albumy, odbitki', 'Foto & Video', 0, 'planned', 53),
('expense', 'Dron (opcjonalnie)', 'Foto & Video', 0, 'planned', 54),

-- 9. Transport i logistyka
('expense', 'Transport Pary Młodej', 'Transport i logistyka', 0, 'planned', 55),
('expense', 'Transport gości', 'Transport i logistyka', 0, 'planned', 56),
('expense', 'Noclegi dla gości', 'Transport i logistyka', 0, 'planned', 57),
('expense', 'Nocleg dla Pary Młodej', 'Transport i logistyka', 0, 'planned', 58),
('expense', 'Parking dla gości (jeśli płatny)', 'Transport i logistyka', 0, 'planned', 59),

-- 10. Papeteria i dodatki
('expense', 'Save the date (drukowane lub elektroniczne)', 'Papeteria i dodatki', 0, 'planned', 60),
('expense', 'Zaproszenia', 'Papeteria i dodatki', 0, 'planned', 61),
('expense', 'Winietki, menu, plan stołów', 'Papeteria i dodatki', 0, 'planned', 62),
('expense', 'Księga gości', 'Papeteria i dodatki', 0, 'planned', 63),
('expense', 'Upominki/podziękowania dla gości', 'Papeteria i dodatki', 0, 'planned', 64),
('expense', 'Podziękowania dla rodziców (np. kosze, albumy, vouchery)', 'Papeteria i dodatki', 0, 'planned', 65),
('expense', 'Podziękowania dla świadków', 'Papeteria i dodatki', 0, 'planned', 66),
('expense', 'Gadżety weselne (bańki, zimne ognie, konfetti, wachlarze, parasole)', 'Papeteria i dodatki', 0, 'planned', 67),

-- 11. Podróż poślubna
('expense', 'Transport (loty, pociąg, samochód)', 'Podróż poślubna', 0, 'planned', 68),
('expense', 'Zakwaterowanie', 'Podróż poślubna', 0, 'planned', 69),
('expense', 'Ubezpieczenie podróży', 'Podróż poślubna', 0, 'planned', 70),
('expense', 'Atrakcje dodatkowe', 'Podróż poślubna', 0, 'planned', 71),
('expense', 'Wiza (jeśli wymagane)', 'Podróż poślubna', 0, 'planned', 72),
('expense', 'Szczepienia (jeśli egzotyczny kierunek)', 'Podróż poślubna', 0, 'planned', 73),

-- 12. Rezerwa / nieprzewidziane wydatki
('expense', 'Zapas na poprawki, dodatkowe zakupy', 'Rezerwa / nieprzewidziane wydatki', 0, 'planned', 74),
('expense', 'Napiwki (DJ, kelnerzy, kierowcy, obsługa hotelu, itp.)', 'Rezerwa / nieprzewidziane wydatki', 0, 'planned', 75);