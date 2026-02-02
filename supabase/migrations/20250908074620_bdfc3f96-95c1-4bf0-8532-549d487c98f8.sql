-- Clear existing templates and add comprehensive wedding planning templates
DELETE FROM public.wedding_templates;

-- Insert comprehensive task templates (126 tasks total)
INSERT INTO public.wedding_templates (title, description, category, template_type, is_priority, order_index) VALUES
-- Podstawy (Priority tasks first)
('Ustal datę ślubu', 'Wybierz datę ceremonii ślubnej i przyjęcia', 'Podstawy', 'task', true, 1),
('Wybierz miejsce ceremonii', 'Znajdź i zarezerwuj miejsce ceremonii ślubnej', 'Podstawy', 'task', true, 2),
('Ustal budżet ślubu', 'Określ całkowity budżet na organizację ślubu', 'Finanse', 'task', true, 3),
('Lista gości', 'Stwórz listę osób zaproszonych na ślub', 'Goście', 'task', true, 4),
('Wybierz miejsce przyjęcia', 'Znajdź i zarezerwuj salę weselną', 'Podstawy', 'task', true, 5),
('Zarezerwuj fotografa', 'Znajdź i zarezerwuj fotografa ślubnego', 'Usługi', 'task', true, 6),
('Wybierz suknię ślubną', 'Poszukaj i zamów suknię ślubną', 'Strój', 'task', true, 7),
('Wybierz garnitur', 'Poszukaj i zamów garnitur dla pana młodego', 'Strój', 'task', true, 8),
('Zarezerwuj księdza/urzędnika', 'Umów się z osobą prowadzącą ceremonię', 'Podstawy', 'task', true, 9),
('Zamów obrączki', 'Wybierz i zamów obrączki ślubne', 'Biżuteria', 'task', true, 10),

-- Miejsce i Catering
('Zwiedzenie miejsc przyjęć', 'Obejrzyj kilka sal weselnych', 'Miejsce', 'task', false, 11),
('Degustacja menu', 'Spróbuj menu w wybranej sali', 'Jedzenie', 'task', false, 12),
('Ustal menu weselne', 'Wybierz dania na przyjęcie', 'Jedzenie', 'task', false, 13),
('Zamów tort weselny', 'Wybierz i zamów tort', 'Jedzenie', 'task', false, 14),
('Alkohol na wesele', 'Ustal jakie alkohole będą podawane', 'Jedzenie', 'task', false, 15),
('Podpisanie umowy z salą', 'Finalizuj umowę z miejscem przyjęcia', 'Miejsce', 'task', false, 16),
('Plan stołów', 'Zaplanuj rozsadzenie gości', 'Miejsce', 'task', false, 17),
('Dekoracja sali', 'Ustał dekorację miejsca przyjęcia', 'Dekoracje', 'task', false, 18),

-- Dokumenty i formalities
('Zapowiedzi ślubne', 'Złóż zapowiedzi w urzędzie stanu cywilnego', 'Dokumenty', 'task', false, 19),
('Badania przedślubne', 'Wykonaj wymagane badania medyczne', 'Dokumenty', 'task', false, 20),
('Świadectwo chrztu', 'Zdobądź aktualne świadectwo chrztu', 'Dokumenty', 'task', false, 21),
('Dowody osobiste', 'Sprawdź ważność dowodów osobistych', 'Dokumenty', 'task', false, 22),
('Kurs przedmałżeński', 'Ukończ kurs przedmałżeński (jeśli wymagany)', 'Dokumenty', 'task', false, 23),

-- Zaproszenia
('Projekt zaproszeń', 'Stwórz projekt zaproszeń ślubnych', 'Zaproszenia', 'task', false, 24),
('Druk zaproszeń', 'Wydrukuj zaproszenia ślubne', 'Zaproszenia', 'task', false, 25),
('Adresowanie zaproszeń', 'Napisz adresy na kopertach', 'Zaproszenia', 'task', false, 26),
('Wysłanie zaproszeń', 'Wyślij zaproszenia do gości', 'Zaproszenia', 'task', false, 27),
('Śledzenie odpowiedzi', 'Zbieraj potwierdzenia od gości', 'Zaproszenia', 'task', false, 28),

-- Muzyka i rozrywka
('Wybór zespołu/DJ', 'Znajdź zespół lub DJ na wesele', 'Rozrywka', 'task', false, 29),
('Lista utworów', 'Stwórz playlistę na wesele', 'Rozrywka', 'task', false, 30),
('Pierwszy taniec', 'Przygotuj choreografię pierwszego tańca', 'Rozrywka', 'task', false, 31),
('Animacje dla dzieci', 'Zaplanuj rozrywkę dla najmłodszych', 'Rozrywka', 'task', false, 32),
('Nagłośnienie', 'Sprawdź nagłośnienie w sali', 'Rozrywka', 'task', false, 33),

-- Kwiaty i dekoracje
('Bukiet ślubny', 'Wybierz i zamów bukiet panny młodej', 'Dekoracje', 'task', false, 34),
('Butonierka', 'Zamów butonierkę dla pana młodego', 'Dekoracje', 'task', false, 35),
('Dekoracje stołów', 'Zaplanuj dekorację stołów weselnych', 'Dekoracje', 'task', false, 36),
('Dekoracje kościoła', 'Ustał dekorację miejsca ceremonii', 'Dekoracje', 'task', false, 37),
('Kwiaty dla mam', 'Zamów kwiaty dla mam', 'Dekoracje', 'task', false, 38),
('Płatki róż', 'Kup płatki róż do posypania', 'Dekoracje', 'task', false, 39),

-- Transport
('Auto do ślubu', 'Zarezerwuj samochód dla pary młodej', 'Transport', 'task', false, 40),
('Transport dla gości', 'Zorganizuj transport dla gości', 'Transport', 'task', false, 41),
('Parking dla gości', 'Sprawdź dostępność parkingu', 'Transport', 'task', false, 42),

-- Uroda i wellness
('Termin u fryzjera', 'Umów wizytę u fryzjera na dzień ślubu', 'Uroda', 'task', false, 43),
('Makijaż ślubny', 'Zarezerwuj makijażystkę', 'Uroda', 'task', false, 44),
('Manicure i pedicure', 'Umów wizytę na manicure', 'Uroda', 'task', false, 45),
('Próba makijażu', 'Zrób próbę makijażu ślubnego', 'Uroda', 'task', false, 46),
('Próba fryzury', 'Przetestuj fryzurę ślubną', 'Uroda', 'task', false, 47),
('Zabieg na twarz', 'Umów zabieg oczyszczający przed ślubem', 'Uroda', 'task', false, 48),

-- Akcesoria i dodatki
('Buty ślubne', 'Kup buty do ślubu', 'Strój', 'task', false, 49),
('Bielizna ślubna', 'Wybierz bieliznę pod suknię', 'Strój', 'task', false, 50),
('Welon lub fascynator', 'Wybierz dodatek do włosów', 'Strój', 'task', false, 51),
('Biżuteria ślubna', 'Wybierz biżuterię na ślub', 'Biżuteria', 'task', false, 52),
('Torebka na ślub', 'Kup torebkę dla panny młodej', 'Strój', 'task', false, 53),
('Dodatki dla pana młodego', 'Kup spinki, muchy, poszetkę', 'Strój', 'task', false, 54),

-- Prezenty i pamiątki
('Lista prezentów', 'Stwórz listę prezentów ślubnych', 'Prezenty', 'task', false, 55),
('Prezenty dla rodziców', 'Wybierz prezenty dla rodziców', 'Prezenty', 'task', false, 56),
('Prezenty dla świadków', 'Kup prezenty dla świadków', 'Prezenty', 'task', false, 57),
('Upominki dla gości', 'Przygotuj upominki dla gości', 'Prezenty', 'task', false, 58),

-- Noc poślubna i podróż
('Rezerwacja hotelu', 'Zarezerwuj hotel na noc poślubną', 'Podróż', 'task', false, 59),
('Planowanie miesiąca miodowego', 'Zaplanuj podróż poślubną', 'Podróż', 'task', false, 60),
('Dokumenty do podróży', 'Sprawdź paszporty i wizy', 'Podróż', 'task', false, 61),

-- Próby i spotkania
('Próba generalna', 'Umów próbę w kościele/urzędzie', 'Podstawy', 'task', false, 62),
('Próba sukni', 'Umów przymiarki sukni ślubnej', 'Strój', 'task', false, 63),
('Próba garnituru', 'Umów przymiarki garnituru', 'Strój', 'task', false, 64),
('Spotkanie z fotografem', 'Przedyskutuj plan zdjęć', 'Usługi', 'task', false, 65),

-- Ważne szczegóły
('Poduszeczka na obrączki', 'Kup lub uszyj poduszeczkę', 'Dodatki', 'task', false, 66),
('Księga gości', 'Kup księgę dla gości', 'Dodatki', 'task', false, 67),
('Konfetti lub ryż', 'Przygotuj konfetti na obsypanie', 'Dodatki', 'task', false, 68),
('Świece do ceremonii', 'Kup świece ślubne', 'Dodatki', 'task', false, 69),
('Koszyk na płatki', 'Przygotuj koszyk dla dzieci', 'Dodatki', 'task', false, 70),

-- Finanse i ubezpieczenia
('Ubezpieczenie ślubu', 'Rozważ ubezpieczenie imprezy', 'Finanse', 'task', false, 71),
('Rachunek bankowy', 'Załóż wspólne konto', 'Finanse', 'task', false, 72),
('Planowanie budżetu', 'Śledź wydatki ślubne', 'Finanse', 'task', false, 73),

-- Social media i pamiątki
('Plan fotografii', 'Ustal plan sesji zdjęciowej', 'Usługi', 'task', false, 74),
('Hashtag ślubu', 'Stwórz hashtag na social media', 'Inne', 'task', false, 75),
('Album ślubny', 'Zaplanuj album ze zdjęciami', 'Usługi', 'task', false, 76),
('Film ze ślubu', 'Rozważ nagranie filmu', 'Usługi', 'task', false, 77),

-- Przygotowania na ostatnie dni
('Pakowanie na podróż poślubną', 'Spakuj walizki', 'Podróż', 'task', false, 78),
('Przygotowanie toasty', 'Napisz przemówienia', 'Inne', 'task', false, 79),
('Sprawdzenie pogody', 'Sprawdź prognozę na dzień ślubu', 'Inne', 'task', false, 80),
('Plan B na pogodę', 'Przygotuj plan na deszcz', 'Inne', 'task', false, 81),

-- Dodatkowe zadania organizacyjne
('Wynajęcie namiotów', 'Rozważ namioty w razie deszczu', 'Miejsce', 'task', false, 82),
('Ochrona na weselu', 'Zatrudnij ochronę jeśli potrzeba', 'Inne', 'task', false, 83),
('Cleaning po weselu', 'Zaplanuj sprzątanie po imprezie', 'Inne', 'task', false, 84),
('Przechowanie sukni', 'Zaplanuj czyszczenie sukni po ślubie', 'Strój', 'task', false, 85),

-- Więcej szczegółów ceremonii
('Wybór pieśni na ślub', 'Wybierz muzykę do kościoła', 'Rozrywka', 'task', false, 86),
('Lektor na ślub', 'Znajdź osobę do czytań', 'Podstawy', 'task', false, 87),
('Ceremonia symboliczna', 'Zaplanuj dodatkowe rytuały', 'Podstawy', 'task', false, 88),
('Dekoracja samochodu', 'Udekoruj auto do ślubu', 'Dekoracje', 'task', false, 89),

-- Więcej zadań dla gości
('Noclegi dla gości', 'Zarezerwuj hotele dla gości', 'Goście', 'task', false, 90),
('Informator dla gości', 'Przygotuj przewodnik po okolicy', 'Goście', 'task', false, 91),
('Powitanie gości', 'Zaplanuj powitanie w hotelu', 'Goście', 'task', false, 92),
('Menu dla dzieci', 'Ustał specjalne menu dla dzieci', 'Jedzenie', 'task', false, 93),

-- Ostatnie przygotowania
('Generalne sprzątanie', 'Posprzątaj dom przed ślubem', 'Inne', 'task', false, 94),
('Przygotowanie planu dnia', 'Napisz harmonogram dnia ślubu', 'Inne', 'task', false, 95),
('Sprawdzenie dekoracji', 'Ostatnie sprawdzenie wszystkich dekoracji', 'Dekoracje', 'task', false, 96),
('Przygotowanie zestawu awaryjnego', 'Przygotuj apteczkę na dzień ślubu', 'Inne', 'task', false, 97),

-- Finalne zadania
('Odebranie sukni', 'Odbierz suknię z pralni/sklepu', 'Strój', 'task', false, 98),
('Odebranie garnituru', 'Odbierz garnitur', 'Strój', 'task', false, 99),
('Odebranie kwiatów', 'Odbierz bukiet i dekoracje', 'Dekoracje', 'task', false, 100),
('Przygotowanie akt ślubu', 'Przygotuj wszystkie dokumenty', 'Dokumenty', 'task', false, 101),

-- Dodatkowe szczegóły
('Podziękowania po ślubie', 'Napisz podziękowania dla gości', 'Inne', 'task', false, 102),
('Zwrot wypożyczonych rzeczy', 'Zaplanuj zwrot wypożyczeń', 'Inne', 'task', false, 103),
('Przygotowanie bon-bonierkek', 'Kup słodycze dla gości', 'Prezenty', 'task', false, 104),
('Sprawdzenie stanu technicznego sali', 'Sprawdź oświetlenie i nagłośnienie', 'Miejsce', 'task', false, 105),

-- Jeszcze więcej szczegółów
('Zabezpieczenie cennych przedmiotów', 'Zabezpiecz biżuterię i dokumenty', 'Inne', 'task', false, 106),
('Plan komunikacji w dniu ślubu', 'Ustal kto i kiedy komu dzwoni', 'Inne', 'task', false, 107),
('Przygotowanie pakietu dla fotografa', 'Przygotuj listę ważnych zdjęć', 'Usługi', 'task', false, 108),
('Sprawdzenie wag', 'Ostateczne sprawdzenie wagi przed ślubem', 'Uroda', 'task', false, 109),
('Przygotowanie słów ślubowania', 'Napisz personalne śluby', 'Podstawy', 'task', false, 110),

-- Finalnie
('Relaks przed ślubem', 'Zaplanuj relaks dzień przed ślubem', 'Inne', 'task', false, 111),
('Sprawdzenie prognoz ruchu', 'Sprawdź korki na trasie', 'Transport', 'task', false, 112),
('Przygotowanie zapasowych rajstop', 'Kup zapasowe rajstopy', 'Strój', 'task', false, 113),
('Sprawdzenie butów', 'Upewnij się że buty są wygodne', 'Strój', 'task', false, 114),
('Przygotowanie chusteczek', 'Kup chusteczki na łzy radości', 'Inne', 'task', false, 115),

-- Ostatnie 11 zadań
('Sprawdzenie kamery', 'Test aparatu/kamery gości', 'Inne', 'task', false, 116),
('Przygotowanie adresy na dziękczynienia', 'Zbierz adresy do podziękowań', 'Inne', 'task', false, 117),
('Plan na dzień po ślubie', 'Zaplanuj dzień po weselu', 'Inne', 'task', false, 118),
('Sprawdzenie ostatnich szczegółów catering', 'Potwierdź menu i ilości', 'Jedzenie', 'task', false, 119),
('Przygotowanie kartek z nazwiskami stołów', 'Oznacz stoły nazwami', 'Miejsce', 'task', false, 120),
('Sprawdzenie ostatnie - dekoracji samochodu', 'Sprawdź ozdoby na aucie', 'Transport', 'task', false, 121),
('Przygotowanie listy telefonów awaryjnych', 'Zbierz numery na dzień ślubu', 'Inne', 'task', false, 122),
('Ostatnie sprawdzenie wystroju sali', 'Sprawdź finalne dekoracje', 'Dekoracje', 'task', false, 123),
('Przygotowanie zapasowej odzieży', 'Przygotuj ubranie na zmianę', 'Strój', 'task', false, 124),
('Ostateczne sprawdzenie dokumentów', 'Sprawdź czy wszystko masz', 'Dokumenty', 'task', false, 125),
('Pakowanie rzeczy na noc poślubną', 'Spakuj na pierwsze nocy', 'Podróż', 'task', false, 126);

-- Insert expense templates with 0 amounts
INSERT INTO public.wedding_templates (title, category, template_type, amount, payment_status, order_index) VALUES
('Sala weselna', 'Miejsce', 'expense', 0, 'planned', 1),
('Catering', 'Jedzenie', 'expense', 0, 'planned', 2),
('Fotograf', 'Usługi', 'expense', 0, 'planned', 3),
('Muzyka/DJ', 'Rozrywka', 'expense', 0, 'planned', 4),
('Kwiaty i dekoracje', 'Dekoracje', 'expense', 0, 'planned', 5),
('Suknia ślubna', 'Strój', 'expense', 0, 'planned', 6),
('Garnitur', 'Strój', 'expense', 0, 'planned', 7),
('Obrączki', 'Biżuteria', 'expense', 0, 'planned', 8),
('Transport', 'Transport', 'expense', 0, 'planned', 9),
('Zaproszenia', 'Zaproszenia', 'expense', 0, 'planned', 10),
('Alkohol', 'Jedzenie', 'expense', 0, 'planned', 11),
('Tort weselny', 'Jedzenie', 'expense', 0, 'planned', 12),
('Fryzjer i makijaż', 'Uroda', 'expense', 0, 'planned', 13),
('Hotel na noc poślubną', 'Podróż', 'expense', 0, 'planned', 14),
('Prezenty dla gości', 'Prezenty', 'expense', 0, 'planned', 15),
('Inne wydatki', 'Inne', 'expense', 0, 'planned', 16);