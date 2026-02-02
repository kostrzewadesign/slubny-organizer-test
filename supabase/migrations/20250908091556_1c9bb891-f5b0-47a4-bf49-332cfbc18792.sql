-- Remove current simple expense templates and add comprehensive wedding budget categories
DELETE FROM public.wedding_templates WHERE template_type = 'expense';

-- Add comprehensive expense categories based on user's detailed list
INSERT INTO public.wedding_templates (template_type, category, title, description, amount, payment_status, order_index) VALUES
-- 1. Formalności i dokumenty
('expense', 'Dokumenty', 'Opłaty USC', 'Opłaty w Urzędzie Stanu Cywilnego', 0, 'planned', 1),
('expense', 'Dokumenty', 'Opłaty kościelne', 'Opłaty za ślub kościelny (jeśli dotyczy)', 0, 'planned', 2),
('expense', 'Dokumenty', 'Kurs przedmałżeński', 'Obowiązkowy kurs dla ślubu kościelnego', 0, 'planned', 3),
('expense', 'Dokumenty', 'Spotkania w poradni rodzinnej', 'Wymagane spotkania przed ślubem kościelnym', 0, 'planned', 4),
('expense', 'Dokumenty', 'Licencje i pozwolenia', 'Np. zgoda na fotografowanie w kościele', 0, 'planned', 5),
('expense', 'Dokumenty', 'Tłumaczenia dokumentów', 'Jeśli potrzebne dla zagranicznego partnera', 0, 'planned', 6),
('expense', 'Dokumenty', 'Ubezpieczenie OC organizatora', 'Ubezpieczenie wedding plannera/organizatora', 0, 'planned', 7),

-- 2. Strój Panny Młodej
('expense', 'Strój', 'Suknia ślubna', 'Zakup lub wypożyczenie sukni z przeróbkami', 0, 'planned', 8),
('expense', 'Strój', 'Obuwie Panny Młodej', 'Buty na ślub i wesele', 0, 'planned', 9),
('expense', 'Biżuteria', 'Biżuteria i dodatki PM', 'Kolczyki, naszyjnik, bransoletka', 0, 'planned', 10),
('expense', 'Strój', 'Welon i ozdoby do włosów', 'Welon, diadem, spinki do włosów', 0, 'planned', 11),
('expense', 'Uroda', 'Fryzura Panny Młodej', 'Ślubna fryzura', 0, 'planned', 12),
('expense', 'Uroda', 'Makijaż Panny Młodej', 'Makijaż ślubny i poprawki', 0, 'planned', 13),
('expense', 'Strój', 'Bielizna ślubna PM', 'Bielizna i dodatki ślubne', 0, 'planned', 14),
('expense', 'Uroda', 'Spa i pielęgnacja PM', 'Manicure, pedicure, spa przed ślubem', 0, 'planned', 15),
('expense', 'Strój', 'Suknia na poprawiny', 'Druga suknia na poprawiny (opcjonalnie)', 0, 'planned', 16),

-- 3. Strój Pana Młodego
('expense', 'Strój', 'Garnitur/smoking Pana Młodego', 'Zakup lub wypożyczenie z poprawkami', 0, 'planned', 17),
('expense', 'Strój', 'Obuwie Pana Młodego', 'Eleganckie buty', 0, 'planned', 18),
('expense', 'Strój', 'Mucha/krawat Pana Młodego', 'Mucha, krawat, spinki do mankietów', 0, 'planned', 19),
('expense', 'Strój', 'Kamizelka/pas', 'Kamizelka lub pas do garnituru', 0, 'planned', 20),
('expense', 'Uroda', 'Fryzura i pielęgnacja PM', 'Strzyżenie, golenie, pielęgnacja', 0, 'planned', 21),
('expense', 'Strój', 'Bielizna i dodatki PM', 'Bielizna i akcesoria męskie', 0, 'planned', 22),
('expense', 'Strój', 'Strój na poprawiny PM', 'Drugi strój na poprawiny (opcjonalnie)', 0, 'planned', 23),

-- 4. Ceremonia
('expense', 'Dekoracje', 'Dekoracje USC', 'Ozdoby w Urzędzie Stanu Cywilnego', 0, 'planned', 24),
('expense', 'Dekoracje', 'Dekoracje kościoła', 'Ozdoby kościoła (jeśli ślub kościelny)', 0, 'planned', 25),
('expense', 'Rozrywka', 'Muzyka w USC', 'Oprawa muzyczna ceremonii cywilnej', 0, 'planned', 26),
('expense', 'Rozrywka', 'Muzyka w kościele', 'Organista, schola, solista', 0, 'planned', 27),
('expense', 'Dokumenty', 'Ofiara dla księdza', 'Datki dla księdza, kościelnego, ministrantów', 0, 'planned', 28),
('expense', 'Usługi', 'Foto/video ceremonii', 'Dokumentacja ślubnej ceremonii', 0, 'planned', 29),

-- 5. Wesele – lokal i obsługa
('expense', 'Miejsce', 'Wynajem sali weselnej', 'Koszt wynajmu lokalu na wesele', 0, 'planned', 30),
('expense', 'Jedzenie', 'Menu weselne', 'Catering i dania główne', 0, 'planned', 31),
('expense', 'Jedzenie', 'Napoje i alkohol', 'Wszystkie napoje na weselu', 0, 'planned', 32),
('expense', 'Jedzenie', 'Ciasta i słodki stół', 'Dodatkowe desery i słodycze', 0, 'planned', 33),
('expense', 'Jedzenie', 'Tort weselny', 'Główny tort weselny', 0, 'planned', 34),
('expense', 'Usługi', 'Obsługa kelnerska', 'Dodatkowa obsługa kelnerska', 0, 'planned', 35),
('expense', 'Miejsce', 'Przedłużenie godzin sali', 'Nadgodziny za przedłużenie zabawy', 0, 'planned', 36),
('expense', 'Jedzenie', 'Opłata korkowa', 'Za wnoszenie własnego alkoholu', 0, 'planned', 37),

-- 6. Dekoracje i florystyka
('expense', 'Dekoracje', 'Bukiet Panny Młodej', 'Główny bukiet ślubny', 0, 'planned', 38),
('expense', 'Dekoracje', 'Butonierki i korsarze', 'Kwiaty dla świadków i rodziców', 0, 'planned', 39),
('expense', 'Dekoracje', 'Dekoracje sali weselnej', 'Kwiaty, oświetlenie, dodatki', 0, 'planned', 40),
('expense', 'Dekoracje', 'Dekoracje stołów', 'Obrusy, serwetki, świece, kompozycje', 0, 'planned', 41),
('expense', 'Dekoracje', 'Tablica powitalna', 'Plan stołów i tablice informacyjne', 0, 'planned', 42),
('expense', 'Dekoracje', 'Dywan do kościoła', 'Dekoracja ołtarza (jeśli ślub kościelny)', 0, 'planned', 43),
('expense', 'Transport', 'Dekoracje samochodu', 'Ozdoby auta Pary Młodej', 0, 'planned', 44),
('expense', 'Prezenty', 'Prezenty powitalne', 'Upominki w pokojach hotelowych (opcjonalnie)', 0, 'planned', 45),

-- 7. Oprawa artystyczna
('expense', 'Rozrywka', 'Zespół muzyczny/DJ', 'Główna oprawa muzyczna wesela', 0, 'planned', 46),
('expense', 'Rozrywka', 'Konferansjer/wodzirej', 'Prowadzący zabawę (jeśli oddzielny)', 0, 'planned', 47),
('expense', 'Rozrywka', 'Atrakcje dodatkowe', 'Fotobudka, animator, pokazy, fajerwerki', 0, 'planned', 48),
('expense', 'Rozrywka', 'Oprawa multimedialna', 'Oświetlenie, efekty specjalne', 0, 'planned', 49),

-- 8. Foto & Video
('expense', 'Usługi', 'Fotograf ślubny', 'Dokumentacja fotograficzna', 0, 'planned', 50),
('expense', 'Usługi', 'Kamerzysta', 'Film ze ślubu i wesela', 0, 'planned', 51),
('expense', 'Usługi', 'Sesja narzeczeńska', 'Sesja plenerowa przed ślubem', 0, 'planned', 52),
('expense', 'Usługi', 'Albumy i odbitki', 'Drukowane zdjęcia i albumy', 0, 'planned', 53),
('expense', 'Usługi', 'Dron', 'Nagrania z drona (opcjonalnie)', 0, 'planned', 54),

-- 9. Transport i logistyka
('expense', 'Transport', 'Transport Pary Młodej', 'Samochód/limuzyna dla nowożeńców', 0, 'planned', 55),
('expense', 'Transport', 'Transport gości', 'Autokar lub organizacja przewozu', 0, 'planned', 56),
('expense', 'Transport', 'Noclegi dla gości', 'Hotele dla gości spoza miasta', 0, 'planned', 57),
('expense', 'Podróż', 'Nocleg dla Pary Młodej', 'Hotel w noc ślubną', 0, 'planned', 58),
('expense', 'Transport', 'Parking dla gości', 'Opłaty parkingowe (jeśli płatny)', 0, 'planned', 59),

-- 10. Papeteria i dodatki
('expense', 'Zaproszenia', 'Save the date', 'Wczesne ogłoszenie terminu', 0, 'planned', 60),
('expense', 'Zaproszenia', 'Zaproszenia ślubne', 'Główne zaproszenia na ślub', 0, 'planned', 61),
('expense', 'Zaproszenia', 'Winietki i menu', 'Karty na stoły i menu weselne', 0, 'planned', 62),
('expense', 'Dodatki', 'Księga gości', 'Pamiątkowa księga do podpisów', 0, 'planned', 63),
('expense', 'Prezenty', 'Upominki dla gości', 'Podziękowania dla wszystkich gości', 0, 'planned', 64),
('expense', 'Prezenty', 'Podziękowania dla rodziców', 'Kosze, albumy, vouchery', 0, 'planned', 65),
('expense', 'Prezenty', 'Podziękowania dla świadków', 'Specjalne prezenty dla świadków', 0, 'planned', 66),
('expense', 'Dodatki', 'Gadżety weselne', 'Bańki, zimne ognie, konfetti, wachlarze', 0, 'planned', 67),

-- 11. Podróż poślubna
('expense', 'Podróż', 'Transport na miesiąc miodowy', 'Loty, pociąg, samochód', 0, 'planned', 68),
('expense', 'Podróż', 'Zakwaterowanie miesiąc miodowy', 'Hotele, noclegi', 0, 'planned', 69),
('expense', 'Podróż', 'Ubezpieczenie podróży', 'Ochrona na czas wyjazdu', 0, 'planned', 70),
('expense', 'Podróż', 'Atrakcje miesiąc miodowy', 'Wycieczki, bilety wstępu', 0, 'planned', 71),
('expense', 'Dokumenty', 'Wiza', 'Jeśli wymagana do kraju docelowego', 0, 'planned', 72),
('expense', 'Dokumenty', 'Szczepienia', 'Dla egzotycznych kierunków', 0, 'planned', 73),

-- 12. Rezerwa / nieprzewidziane wydatki
('expense', 'Inne', 'Zapas na poprawki', 'Dodatkowe zakupy i poprawki', 0, 'planned', 74),
('expense', 'Inne', 'Napiwki', 'Dla DJ, kelnerów, kierowców, obsługi', 0, 'planned', 75);