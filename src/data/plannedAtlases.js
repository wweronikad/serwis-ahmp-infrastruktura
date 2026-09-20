const TILES_BASE = 'https://wweronikad.github.io/serwis-ahmp'

export const plannedAtlases = [
  {
    id: 'wawolnica',
    name: 'Wąwolnica',
    region: 'Lubelszczyzna',
    team: 'UMCS w Lublinie',
    coordinates: [22.1596, 51.2916],
    map: {
      tiles: `${TILES_BASE}/wawolnica-2025/{z}/{x}/{y}.png`,
      minzoom: 13,
      maxzoom: 18,
      bounds: [22.1288, 51.2788, 22.1904, 51.3045],
      title: 'Plan miasta Wąwolnicy',
      author: 'Jan Kierłowicz',
      year: 1820,
    },
    intro: [
      'Wąwolnica jest pierwszym z trzech miast Lubelszczyzny, dla których zespół z Uniwersytetu Marii Curie-Skłodowskiej przygotowuje zeszyty Atlasu Historycznego Miast Polskich, i na razie jedynym, dla którego w serwisie jest zgeoreferencjonowana mapa. Jest nią plan miasta sporządzony przez Jana Kierłowicza w 1820 roku, gdy Wąwolnica liczyła 1034 mieszkańców, czyli pół wieku przed utratą praw miejskich. Nałożony na współczesny podkład pozwala odczytać, jak wyglądał układ miasta, którego historię opisuje książka Sławomira Partyckiego „Dzieje Wąwolnicy”.',
      'Wybór tego miasta nie jest przypadkowy. Wąwolnica jest dziś niewielką miejscowością, ale przez wieki znaczyła więcej, niż wynikałoby z jej wielkości. Leżała na szlaku od przeprawy przez Wisłę w rejonie Kazimierza Dolnego do przeprawy przez Bystrzycę pod Lublinem, od 1381 roku była siedzibą sądów kasztelańskich, a jej dzieje, zamknięte między średniowieczną lokacją, odebraniem praw miejskich w 1870 roku i ich odzyskaniem 1 stycznia 2025 roku, dobrze pokazują, jak zmienia się los małego ośrodka miejskiego w ciągu wieków.',
    ],
    photo: {
      src: '/wawolnica/rynek-1941.jpg',
      alt: 'Targ konny w Wąwolnicy w 1941 roku, na wzgórzu w głębi kościół',
      caption: 'Targ w Wąwolnicy w 1941 roku; na wzgórzu w głębi widoczny kościół. Fot. Hermann Lemme, 4 lipca 1941, Deutsche Fotothek (za pośrednictwem serwisu fotopolska.eu).',
    },
    mapCaption: 'Plan miasta Wąwolnicy z 1820 roku na tle współczesnej mapy. Suwakiem można zmieniać przezroczystość planu, a przyciskiem w rogu powiększyć okno mapy.',
    historyTitle: 'Z dziejów miasta',
    history: [
      'Nazwa miejscowości pochodzi od określenia wzniesienia wśród podmokłych terenów (wąwel), na którym w X wieku prawdopodobnie znajdował się gródek pełniący funkcje administracyjne na Lubelszczyźnie. Przed 1325 rokiem Wąwolnica była już miastem, o czym świadczą zapiski w rejestrze dziesięcin oddawanych Papiestwu, a za panowania Kazimierza Wielkiego otrzymała przywileje, które zwalniały jej mieszczan z ceł i myt na obszarze całego państwa. W 1381 roku miasto zostało siedzibą sądów kasztelańskich dla drobnej szlachty i wtedy przeżywało swój największy rozkwit. Z Wąwolnicy pochodził też Eliasz, syn Marcina, który w 1409 roku został rektorem Uniwersytetu Krakowskiego i był zaufanym doradcą Władysława Jagiełły.',
      'Od drugiej połowy XV wieku miasto stopniowo traciło znaczenie. Złożył się na to wzrost roli Lublina po unii polsko-litewskiej, przeniesienie dóbr królewskich do rozwijającego się Kazimierza Dolnego i zmiana siedziby sądu kasztelana. W 1567 roku wielki pożar zniszczył zabudowę, a Zygmunt August polecił przenieść ją w nowe miejsce, w 1657 roku zaś najazd wojsk siedmiogrodzkich Rakoczego dotkliwie dotknął miasto: zniszczono budynki, a dokumenty miejskie przepadły. Odbudowa była powolna, jednak w 1820 roku, z którego pochodzi prezentowany plan, Wąwolnica liczyła już 1034 mieszkańców.',
      'Po rozbiorach miasto znalazło się kolejno pod zaborem austriackim, w Księstwie Warszawskim i, od 1815 roku, pod panowaniem rosyjskim. W 1870 roku, w ramach represji po powstaniu styczniowym, car pozbawił Wąwolnicę praw miejskich i przez następne 155 lat była ona osadą. Status miasta odzyskała 1 stycznia 2025 roku na mocy rozporządzenia Rady Ministrów z lipca 2024 roku, razem z Końskowolą i Kurowem.',
    ],
    sources: [
      { label: 'S. Partycki, „Dzieje Wąwolnicy”' },
      { label: 'Wąwolnica – Wikipedia', href: 'https://pl.wikipedia.org/wiki/Wąwolnica' },
      { label: 'Wąwolnica znów Królewskim Miastem – pulawy.24wspolnota.pl', href: 'https://pulawy.24wspolnota.pl/informacje-pulawskie/wawolnica-znow-krolewskim-miastem-dziejowa-sprawiedliwosc-przywrocona-zdjecia/YnknocxjHImaBvBLFhlf' },
    ],
  },
  {
    id: 'pulawy',
    name: 'Puławy',
    region: 'Lubelszczyzna',
    team: 'UMCS w Lublinie',
    coordinates: [21.9686, 51.4164],
    map: {
      "image": "/pulawy/plan-zespol-palacowo-parkowy-1997.webp",
      "coordinates": [
        [
          21.964276,
          51.40521
        ],
        [
          21.951992,
          51.414541
        ],
        [
          21.962242,
          51.419787
        ],
        [
          21.974525,
          51.410454
        ]
      ],
      "title": "Puławy. Zespół pałacowo-parkowy",
      "author": "Towarzystwo Przyjaciół Puław",
      "year": 1997,
      "places": [
        {
          "id": "palac",
          "name": "Pałac Czartoryskich",
          "lngLat": [
            21.959016,
            51.412175
          ],
          "photos": [
            {
              "file": "pulawy_palac_canvas12.webp",
              "title": "Pałac Czartoryskich od strony parku"
            },
            {
              "file": "pulawy_palac_canvas13.webp",
              "title": "Pałac w Puławach od strony Wisły"
            },
            {
              "file": "pulawy_palac_canvas14.webp",
              "title": "Dziedziniec pałacu Czartoryskich"
            }
          ]
        },
        {
          "id": "sybilla",
          "name": "Świątynia Sybilli",
          "lngLat": [
            21.962706,
            51.410592
          ],
          "photos": [
            {
              "file": "pulawy_sybilla_11.webp",
              "title": "Świątynia Sybilli (rycina)"
            },
            {
              "file": "pulawy_sybilla_canvas9.webp",
              "title": "Świątynia Sybilli (sepia)"
            },
            {
              "file": "pulawy_sybilla_canvas4.webp",
              "title": "Świątynia Sybilli (pocztówka)"
            },
            {
              "file": "pulawy_sybilla_canvas5.webp",
              "title": "Świątynia Sybilli (fotografia)"
            }
          ]
        },
        {
          "id": "domek_gotycki",
          "name": "Domek Gotycki",
          "lngLat": [
            21.962932,
            51.411315
          ],
          "photos": [
            {
              "file": "pulawy_domek_gotycki_canvas6.webp",
              "title": "Domek Gotycki (fotografia)"
            },
            {
              "file": "pulawy_domek_gotycki_canvas7.webp",
              "title": "Domek Gotycki (pocztówka)"
            }
          ]
        },
        {
          "id": "kosciol",
          "name": "Kościół Wniebowzięcia NMP",
          "lngLat": [
            21.955424,
            51.415039
          ],
          "photos": [
            {
              "file": "pulawy_kosciol_2.webp",
              "title": "Kościół Wniebowzięcia NMP (rycina)"
            },
            {
              "file": "pulawy_kosciol_canvas0.webp",
              "title": "Kościół Wniebowzięcia NMP z tłumem wiernych"
            }
          ]
        },
        {
          "id": "bursa",
          "name": "Dawna bursa studencka",
          "lngLat": [
            21.963074,
            51.413618
          ],
          "photos": [
            {
              "file": "pulawy_bursa_canvas1.webp",
              "title": "Internat (pocztówka kolorowa)"
            },
            {
              "file": "pulawy_bursa_canvas2.webp",
              "title": "Internat studencki (pocztówka)"
            }
          ]
        },
        {
          "id": "marynki",
          "name": "Pałac Marynki",
          "lngLat": [
            21.96727,
            51.408503
          ],
          "photos": [
            {
              "file": "pulawy_marynki_canvas.webp",
              "title": "Pałac Marynki"
            }
          ]
        }
      ]
    },
    text: null,
  },
  {
    id: 'kazimierz-dolny',
    name: 'Kazimierz Dolny',
    region: 'Lubelszczyzna',
    team: 'UMCS w Lublinie',
    coordinates: [21.9506, 51.3197],
    map: null,
    text: null,
  },
]
