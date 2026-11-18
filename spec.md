# aB — założenia projektu

Status: dokument roboczy. Opisuje ustalone wymagania i pytania otwarte; nie oznacza, że wymienione funkcje są już wdrożone.

## Cel

Aplikacja do słuchania własnych audiobooków. Użytkownik importuje pliki, zarządza lokalną biblioteką i wraca do ostatniego miejsca odtwarzania. Punktem odniesienia dla funkcjonalności jest MP3 Audiobook Player autorstwa Olega Braileana. Wygląd aplikacji wynika z własnych projektów Figma.

Obecny etap obejmuje logikę importu MP3/ZIP i lokalnej biblioteki. Budowanie interfejsu oraz działającego odtwarzacza pozostaje na kolejne etapy. Istniejący ekran Library z przyciskiem Import jest punktem wejścia dla przyszłego podłączenia logiki.

## Stan obecny

- Projekt korzysta z Expo SDK 58, React Native, TypeScript i Expo Router.
- Istnieją przepływy uwierzytelniania z Firebase: rejestracja, logowanie, weryfikacja adresu email i reset hasła. Ich dalsza rozbudowa jest osobnym zadaniem.
- Istnieją system motywów i komponenty interfejsu.
- Ekran Library ma przycisk Import; nie jest jeszcze podłączony do importowania książek.
- Ekran odtwarzania jest szkieletem.
- W aktualnych zależnościach nie ma jeszcze modułów do wyboru dokumentów, rozpakowywania ZIP i odtwarzania audio.

## Ustalone wymagania

### Język kodu

- Cały nowy i modyfikowany kod zapisujemy po angielsku. Nie dodajemy polskich tekstów w kodzie: dotyczy to nazw zmiennych i funkcji, komentarzy, logów konsoli, komunikatów błędów oraz tekstów interfejsu.

### Błędy i logi

- Nie wpisujemy komunikatów błędów bezpośrednio jako stringów w komponentach, hookach ani serwisach. Definiujemy je w `src/constants/errors.ts`, w kategorii odpowiadającej funkcjonalności (np. uwierzytelnianie, błędy techniczne, audio, biblioteka).
- Zachowujemy rozdział między komunikatami dla użytkownika, technicznymi komunikatami wyjątków i kodami błędów. Kody własnych błędów wymagających rozpoznawania definiujemy w `APP_ERROR_CODES`; nie opieramy logiki na porównywaniu treści komunikatu.
- Wszystkie teksty dla `console.log`, `console.info`, `console.warn`, `console.error` i pozostałych metod konsoli definiujemy w `src/constants/log-messages.ts`, w kategoriach funkcjonalnych. Nie dodajemy stringów ani template literals bezpośrednio w wywołaniach konsoli.
- Logi korzystają z nazwanych komunikatów lub funkcji formatujących. Dane kontekstowe oraz oryginalny obiekt błędu przekazujemy osobno, aby zachować stack trace i przyczynę błędu.
- Komunikaty narzędzi uruchamianych przez Node.js i konfiguracji budowania definiujemy osobno w `tooling-messages.cjs`, bez zależności od kodu aplikacji. Dane i sygnały testowe pozostają w nazwanych stałych testów.

### Platforma i źródła

- Pierwsze wdrożenie importu dotyczy iPhone'a.
- Import rozpoczyna się od systemowego wyboru plików.
- Użytkownik może wybierać pliki z iCloud Drive, pamięci telefonu oraz usług dostępnych w systemowym wyborze plików, np. Dropbox po skonfigurowaniu jego aplikacji.
- Na tym etapie nie planujemy osobnych integracji z API chmur ani logowania do Dropbox wewnątrz aB.
- Nie umożliwiamy wybierania ani importowania całych katalogów.

### Pliki i przechowywanie

- Pierwszy zakres formatów: MP3 oraz archiwa ZIP zawierające pliki audio MP3.
- Import tworzy lokalną kopię audio należącą do biblioteki aplikacji.
- ZIP jest rozpakowywany. Po udanym imporcie usuwamy roboczą kopię ZIP należącą do aplikacji.
- Oryginalne pliki użytkownika pozostają w źródłowej lokalizacji.
- Zaimportowane audio ma być dostępne offline.
- Nie wysyłamy plików audio do Firebase ani na własny serwer.
- Biblioteka jest przypisana do konta użytkownika. Pliki i dane książek pozostają na urządzeniu po wylogowaniu; inne konto nie widzi tych książek.
- Po ponownym zalogowaniu na to samo konto na tym samym urządzeniu jego biblioteka jest ponownie dostępna.
- Izolacja kont dotyczy zarówno metadanych, jak i dostępu do plików przez logikę aplikacji. Zmiana konta nie może pozostawić książek poprzedniego użytkownika w stanie interfejsu ani przypisać trwającego importu nowemu kontu.
- WAV, FLAC i inne formaty są kierunkiem rozwoju, a nie zatwierdzonym zakresem pierwszej wersji. Każdy format wymaga osobnego sprawdzenia importu, metadanych i odtwarzania.

### Metadane, grupowanie i okładki

- Już pierwsza wersja odczytuje metadane z tagów MP3: dane potrzebne do ustalenia tytułu książki, autora, nazwy części, kolejności oraz osadzoną okładkę, jeśli występuje.
- Grupowanie plików w książki opiera się na metadanych. Nie przyjmujemy automatycznie zasady „jeden ZIP = jedna książka” ani „jeden import MP3 = jedna książka”.
- Kluczem grupowania jest album (tytuł książki) oraz album artist (autor); przy braku album artist korzystamy z artist.
- Tag title określa tytuł części. Części sortujemy według numeru dysku, następnie numeru ścieżki, a następnie naturalnej kolejności nazw plików (np. 1, 2, 10).
- Jeden ZIP może zawierać kilka książek. Pliki z podkatalogów podlegają tym samym regułom grupowania według tagów; nazwa ZIP ani podkatalogu nie jest kluczem książki.
- Odczyt okładki osadzonej w pliku jest w zakresie. Wyszukiwanie okładek w internecie nie jest zatwierdzone; na obecnym etapie korzystamy z tagów.
- Przy braku metadanych stosujemy `Unknown`, bez odgadywania albumu, autora czy tytułu z nazwy pliku, ZIP lub katalogu. Zakładamy, że użytkownicy importują przygotowane pliki z tagami.
- Każdy plik bez tagu album tworzy osobną książkę o tytule `Unknown`. Wartość zastępcza nie jest wspólnym kluczem grupowania: takich książek nie łączymy ze sobą ani przy kolejnych importach.
- Gdy album występuje, lecz brakuje autora, stosujemy autora `Unknown` i grupujemy według albumu i tej wartości zastępczej.
- Jeśli książka o tym samym albumie i autorze istnieje już w bibliotece aktualnego konta, anulujemy cały import. Nie dołączamy części, nie zastępujemy książki i nie tworzymy jej kopii. Ta zasada zastępuje wcześniejsze ustalenie o dołączaniu części.
- Odrzucenie importu nie modyfikuje żadnej istniejącej książki. Dotyczy to również importu kilku książek, gdy tylko jedna z nich już istnieje.
- Priorytet okładek przy wielu osadzonych obrazach i normalizacja wartości tagów wymagają doprecyzowania. Brak okładki nie jest wartością tekstową `Unknown`; biblioteka zapisuje brak obrazu.
- Nie dodajemy formularza edycji danych na obecnym etapie bez osobnego ustalenia.

### Operacje biblioteki

- Logika biblioteki obejmuje odczyt książek aktualnego konta, dodawanie kompletnych książek oraz usuwanie.
- Usunięcie książki obejmuje jej lokalne audio, okładkę i metadane oraz powiązany lokalny postęp, jeżeli zostanie wprowadzony w etapie odtwarzacza.
- Usuwanie dotyczy wyłącznie biblioteki aktualnego konta. Nie usuwa oryginałów w iCloud, Dropbox ani innych źródłach.
- Błąd odczytu lub kopiowania pojedynczego MP3 pomija ten plik i nie blokuje pozostałych części ani książek. Zapisujemy poprawne pliki; częściowo skopiowane pliki usuwamy. Jest to wyjątek od wcześniejszego wymagania całościowego zapisu importu.
- Książkę zapisujemy, jeśli udało się zachować co najmniej jedną poprawną część. Jeśli wszystkie jej pliki zostaną pominięte, usuwamy nowy katalog i pomijamy książkę. Błąd zapisu okładki pozwala zapisać książkę bez okładki.
- Każde pominięcie jest raportowane w konsoli nazwanym komunikatem i kontekstem pliku; wynik zapisu zawiera listę plików pominiętych podczas kopiowania. Błędy katalogu docelowego lub sprzątania są nadal błędami operacji, nie pominięciem pojedynczego MP3.

### Limity

- Wszystkie limity importu znajdują się w jednym łatwo dostępnym i edytowalnym pliku konfiguracyjnym. Proponowana lokalizacja: `src/constants/book-import-config.ts`. Moduły importu korzystają z tej konfiguracji zamiast własnych wartości liczbowych.
- Jednorazowo można wybrać jeden ZIP o rozmiarze maksymalnie 2 GB albo maksymalnie 300 plików MP3.
- Łączny rozmiar bezpośrednio wybranych plików MP3 wynosi maksymalnie 1 GB na import. Limit ten nie dotyczy ZIP ani danych po jego rozpakowaniu.
- Maksymalny rozmiar ZIP to 2 GB, a łączny rozmiar wszystkich danych po rozpakowaniu to 4 GB.
- ZIP może zawierać maksymalnie 300 MP3 oraz 1000 wszystkich elementów archiwum, wliczając katalogi i pliki inne niż audio. Limity obejmują również elementy w podkatalogach.
- GB oznacza 1 000 000 000 bajtów. W konfiguracji przechowujemy limity rozmiarów w bajtach.
- Typowy ZIP użytkownika ma około 300–600 MB; to informacja o spodziewanych danych, nie zatwierdzony limit.
- Przed zapisem należy uwzględnić wolne miejsce na pliki docelowe i dane robocze.
- Powyższe limity są wymaganiami produktu, a nie potwierdzeniem wydajności narzędzi; implementacja wymaga weryfikacji na iPhonie.

### Interfejs

- W obecnym etapie pomijamy budowanie UI. Ramka Library (`53:370`) z przyciskiem Import stanowi punkt odniesienia dla późniejszej integracji.
- W kolejnym etapie ekrany powstają zgodnie z aktualnymi ramkami Figma i istniejącym systemem motywów.
- Funkcjonalności referencyjnego playera nie oznaczają kopiowania jego wyglądu.
- Każdy komponent ma własny plik `styles.ts`. Nie importuje stylów innego komponentu.
- Nowe komunikaty korzystają z konwencji projektu; nie rozrzucamy tekstów błędów po logice importu.
- Propozycje nowych komunikatów i zmian istniejących treści wymagają zatwierdzenia przed implementacją.

## Proponowany przebieg importu — do zatwierdzenia

1. Użytkownik wybiera Import na ekranie biblioteki.
2. System pokazuje wybór plików. Anulowanie zamyka wybór bez komunikatu błędu.
3. Aplikacja sprawdza wybrane typy, rozmiary, liczbę plików i dostępne miejsce.
4. Dla ZIP sprawdza zawartość i limity rozpakowania; dla MP3 przygotowuje kopiowanie.
5. Kopiuje lub rozpakowuje audio do katalogu roboczego aplikacji, udostępniając aktualny etap dla przyszłego interfejsu.
6. Odczytuje tagi i osadzone okładki, pomija pliki z błędem odczytu i grupuje pozostałe części w książki według albumu i autora. Przy brakujących danych stosuje `Unknown`; każdy plik bez albumu tworzy osobną książkę. Jeśli rozpozna książkę istniejącą już w bibliotece konta, anuluje cały import i sprząta jego pliki robocze.
7. Po przygotowaniu plików oraz ponownym sprawdzeniu konta i braku istniejących książek zapisuje poprawne części. Błąd kopiowania MP3 pomija ten plik; książka bez żadnej zapisanej części zostaje pominięta.
8. Sprząta dane robocze i pokazuje książkę w bibliotece.

Powyższy przebieg opisuje docelowe użycie logiki. W obecnym etapie stan, postęp i wynik importu mają być dostępne dla przyszłego interfejsu, bez budowania nowych ekranów i formularzy. Dokładne ekrany, moment potwierdzenia danych i zachowanie po zakończeniu importu dopracujemy w etapie UI.

## Proponowana architektura — do zatwierdzenia

- Niewielka klasa `BookImporter` koordynuje pojedynczy import: etapy, postęp, anulowanie i sprzątanie.
- Osobne moduły odpowiadają za wybór źródła, operacje na plikach, ZIP, metadane i zapis biblioteki.
- Hook `useBookImport` łączy stan importu z interfejsem.
- Oddzielamy źródło pliku (np. wybór systemowy), opakowanie (ZIP albo plik) i format audio (MP3, w przyszłości inne).
- Nie tworzymy osobnej klasy dla każdego rozszerzenia ani hierarchii dziedziczenia na zapas.
- Audio przechowujemy jako pliki. Sposób trwałego zapisu metadanych biblioteki wybierzemy przed implementacją.
- Dobór bibliotek wymaga sprawdzenia zgodności z Expo SDK 58 i weryfikacji na rzeczywistym iPhonie, szczególnie dla dużych ZIP-ów.

## Niezawodność — proponowane wymagania

- Pierwsza wersja wykonuje jeden import naraz i udostępnia możliwość jego anulowania podczas przygotowania danych. Po zakończonym zatwierdzeniu importu książkę usuwa się operacją biblioteki.
- Duże pliki nie mogą wymagać wczytywania całego archiwum do pamięci JavaScript.
- Import nie może zapisywać elementów ZIP poza wyznaczonym katalogiem ani ufać wyłącznie deklaracjom rozmiarów w archiwum.
- Uszkodzone i zaszyfrowane archiwa oraz archiwa bez obsługiwanego audio mają kontrolowany wynik.
- Nie gwarantujemy kontynuowania importu w tle ani po zamknięciu aplikacji. Po przerwaniu procesu przez system sprzątamy jego dane robocze; użytkownik rozpoczyna import ponownie od początku. Nie implementujemy wznawiania.
- Wylogowanie lub zmiana konta anuluje import przed zatwierdzeniem biblioteki. Import jest związany z identyfikatorem konta, na którym został rozpoczęty; nie może zostać zapisany dla nowego konta.
- Po przerwanym lub nieudanym imporcie aplikacja sprząta własne pliki robocze, także przy kolejnym uruchomieniu.
- Książka może zawierać mniej części niż wybrano, jeśli błędne pliki zostały pominięte. Do odtwarzania udostępniamy wyłącznie części, których zapis zakończył się poprawnie, po zakończeniu próby zapisu książki.
- Błąd zapisu biblioteki po skopiowaniu audio nie może pozostawić niewidocznych, niezarządzanych plików.

## Szczegóły do dopracowania przed implementacją

### Organizacja książek

- Jak normalizujemy tagi (spacje, wielkość liter) i wybieramy okładkę, gdy pliki tej samej książki zawierają różne obrazy?
- Ponowny import książki z albumem jest odrzucany według albumu i autora; nie wymaga ustalania duplikatów jej części. Czy potrzebne jest dodatkowe wykrywanie identycznych plików bez albumu, które standardowo tworzą osobne książki `Unknown`?

### Ograniczenia i obsługa

- Jak raportujemy stan po powrocie z tła, gdy import nadal działa, zakończył się albo został przerwany? Dokładny interfejs jest poza obecnym etapem.
- Jak traktujemy pliki inne niż MP3 wewnątrz ZIP (np. obrazy i pliki systemowe), zagnieżdżone archiwa oraz nieczytelne tagi?
- Dobór trwałego zapisu biblioteki i mechanizmu odzyskiwania po przerwaniu zatwierdzania wymaga decyzji technicznej.

## Kryteria odbioru — wstępne

- Import MP3 i ZIP jest sprawdzony na rzeczywistym iPhonie, także dla archiwów o spodziewanym rozmiarze 300–600 MB mieszczących się w ustalonych limitach.
- Książka pozostaje w bibliotece po ponownym uruchomieniu aplikacji i jej audio jest dostępne offline.
- Wylogowanie zachowuje lokalną bibliotekę konta. Konto B nie widzi książek konta A; ponowne zalogowanie na konto A przywraca dostęp do jego biblioteki.
- Import nie zmienia i nie usuwa oryginałów użytkownika.
- Tagi są odczytywane już w pierwszej wersji; grupowanie i kolejność części odpowiadają zatwierdzonym regułom, a osadzona okładka zostaje zachowana w lokalnej bibliotece.
- Pliki bez albumu tworzą osobne książki `Unknown`. Wykrycie istniejącej książki według albumu i autora anuluje cały import bez zmian w bibliotece.
- Błąd pojedynczego MP3 nie usuwa poprawnie zapisanych części ani innych książek. Książka bez poprawnie zapisanych części jest pomijana, a jej katalog usuwany. Zmiana konta nadal anuluje import zgodnie z zasadą izolacji kont.
- Usunięcie książki usuwa jej lokalne audio, okładkę i metadane, nie zmieniając książek innych kont ani źródłowych plików użytkownika.
- Zmiana limitów wymaga edycji jednego pliku konfiguracyjnego; poszczególne moduły nie powielają wartości limitów.
- Limity, brak miejsca, błędy odczytu i zapisu oraz uszkodzony ZIP nie powodują zapisu książki jako gotowej.
- Przerwanie importu nie pozostawia trwałych plików roboczych bez mechanizmu sprzątania.
- Obecny etap nie wymaga nowych ekranów. Zgodność UI z Figmą oraz jasnym i ciemnym motywem będzie kryterium etapu budowania interfejsu.
- Po zmianach implementacyjnych przechodzą kontrola TypeScript i lint; pozostałe sprawdzenia wynikają z zakresu zmian.

## Poza obecnym zakresem

- Budowanie UI importu i biblioteki oraz implementacja odtwarzacza.
- Bezpośrednie integracje z API poszczególnych chmur i synchronizacja audio między urządzeniami.
- Import katalogów.
- CarPlay, Apple Watch, transfer przez Wi-Fi i WebDAV.
- Rozszerzenie obsługi formatów poza zatwierdzone MP3/ZIP.
- Backend do aktualizacji weryfikacji emaila w czasie rzeczywistym; przypomnienie o tym zadaniu pozostaje w `AGENTS.md`.

## Materiały

- Figma — Library i przycisk Import: https://www.figma.com/design/0xjivSija0SRgPEyXM14mQ/ab.?node-id=53-370 — punkt odniesienia na etap UI.
- Referencja funkcjonalna: https://mp3audiobookplayer.com/features/
- Dostawcy plików na iOS: https://support.apple.com/en-us/102238
