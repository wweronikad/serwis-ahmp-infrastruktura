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
    source: 'Sławomir Partycki, „Dzieje Wąwolnicy”',
    text: [
      'Podstawą odtworzenia dziejów Wąwolnicy była książka „Dzieje Wąwolnicy” Sławomira Partyckiego, która łączy aspekty archeologiczne, historyczne, administracyjne i biograficzne historii miasta począwszy od pierwszych osadników, aż po rok 1918. Jest to, między innymi, opowieść o odkrytych pozostałościach pierwszych kultur, które zamieszkiwały w okolicy, począwszy od pierwszych grup łowieckich (30 000 – 25 000 lat p.n.e.), przez pierwszych rolników neolitycznych, aż po kulturę wołyńsko-lubelską, w której nastąpiło zagęszczenie osadnictwa.',
      'W książce opisana została także rola administracyjna, religijna i komunikacyjna Wąwolnicy w średniowiecznej Polsce. Ze względu na swoje położenie – na szlaku od przeprawy na Wiśle w rejonie Kazimierza Dolnego do przeprawy przez Bystrzycę w pobliżu Lublina – wybudowano wzmocnienia i mury z gródkiem osadzonym umiejscowionym na wzniesieniu, który w X wieku prawdopodobnie służył jako centrum administracji na Lubelszczyźnie. Od określenia na wzniesienie wśród podmokłych terenów (wąwel) powstała nazwa miejscowości. W XI lub XII wieku powstała parafia pod wezwaniem św. Wojciecha oraz kościół, pierwotnie obsługiwany przez benedyktynów. Przed 1325 rokiem Wąwolnica była już miastem, o czym świadczą zachowane zapiski w rejestrze dziesięcin oddawanych Papiestwu. Następnie miasto trafiło pod opiekę Kazimierza Wielkiego, za czasów którego nie tylko powstał pierwszy kościół murowany, ale także nadano przywileje dla mieszczan, których Król zwolnił od ceł i myt na obszarze całego państwa. W zamian miasto miało spełniać cele koordynujące działania gospodarcze i polityczne na Lubelszczyźnie. Od 1381 roku Wąwolnica stała się siedzibą sądów kasztelańskich dla drobnej szlachty, co stało się podstawą dla terminu „powiat wąwolnicki”. Dzięki rozbudowie, inwestycjom oraz przybywającym na sądy okolicznym mieszkańcom miasto przeżyło swój największy rozkwit. Sąd przypuszczalnie przestał działać na początku XVI wieku, a z jego zniknięciem miasto zaczęło tracić na znaczeniu.',
      'Istotną postacią, której poświęcony jest rozdział książki, jest Eliasz, syn Marcina z Wąwolnicy, który w 1409 roku został rektorem Uniwersytetu Krakowskiego i był zaufanym doradcą Władysława Jagiełły. Prawdopodobnie przyczynił się on do wzrostu gospodarczego i politycznego znaczenia Wąwolnicy.',
      'Druga połowa XV wieku, mimo formalnego potwierdzenia prawa magdeburskiego przez Kazimierza Jagiellończyka w 1448 roku, przyniosła miastu stopniowy regres. Nałożyło się na to kilka czynników: wzrost znaczenia Lublina po unii polsko-litewskiej, przeniesienie dóbr królewskich do rozwijającego się Kazimierza Dolnego oraz zmiana siedziby sądu kasztelana. Z czasem Wąwolnica zaczęła tracić swoje funkcje, a zamek popadł w ruinę. Wtedy teren dóbr królewskich oddano w ręce benedyktynów. Coraz większa liczba mieszkańców pobliskich wsi trudniła się uprawą, dlatego miasto coraz bardziej nabierało charakteru ośrodka rolniczego. Dodatkowo Piotr Firlej, a później jego synowie dążyli do przekształcenia miasta w wieś dziedziczną, co nie spodobało się mieszkańcom Wąwolnicy — po swoich staraniach uzyskali oni poparcie na dworze królewskim i dostali potwierdzenie przywileju prawa miejskiego oraz nadanie prawa do odbywania targu tygodniowego, a także trzech jarmarków: na św. Wojciecha (23 IV), św. Marię Magdalenę (22 VII) i Narodzenie Najświętszej Marii Panny (8 IX). W 1567 roku Wąwolnicę zniszczył wielki pożar, po którym Zygmunt August polecił przeniesienie zabudowy miasta na inne miejsce. Zabudowa, koncentrująca się dotąd wokół dzisiejszego boiska, przekształciła się w nową strukturę — wytyczono około 120 działek siedliskowych. W centrum rynku stanął drewniany ratusz, notowany w źródłach od końca lat siedemdziesiątych XVI wieku, a także siedziba władz miejskich oraz punkty handlowe. Uszczupliło to stan majątkowy mieszkańców oraz pogorszyło pozycję miasta. Dodatkowo dążenia rodu Firlejów do podporządkowania sobie osady i przekształcenia jej w zaplecze folwarczne odbiły się na mieszkańcach przedmieść Góry, Charza i Bartłomiejowic, których Firlejowie próbowali zmusić do odrabiania pańszczyzny, odbierając im prawa miejskie. Spotkało się to z odzewem — zdesperowani mieszczanie pod wodzą rajcy Adama Podwałki udali się z delegacją do króla Stefana Batorego. Interwencja monarchy pozwoliła zahamować nadużycia, co w kolejnych stuleciach działało na korzyść mieszkańców.',
      'Najtragiczniejszy etap w dziejach dawnej Wąwolnicy nastąpił jednak w roku 1657, podczas najazdu wojsk siedmiogrodzkich Rakoczego, kiedy miasto dotkliwie ucierpiało. Nieprzyjaciel zniszczył budynki, przepadły dokumenty miejskie, kościół uległ rabunkowi, zginęły również akta parafialne. W pierwszej połowie XVII wieku Wąwolnica liczyła nie więcej niż 250–300 mieszkańców. Lustracja z 1653 roku opisywała 42 domy, a niegdyś było ich 122. Po 1661 roku było już tylko 10 domów zasiedlonych oraz 79 obywateli.',
      'Odbudowa demograficzna nastąpiła w XVIII wieku — w 1739 roku w Wąwolnicy mieszkało 250–270 osób, a do 1820 roku liczba ta wzrosła do 1034 mieszkańców. Jeżeli chodzi o narodowości i wyznania, obywatelami byli niemal wyłącznie Polacy i katolicy. W Wąwolnicy obowiązywał zakaz osiedlania się Żydów, który — mimo że nie był ściśle przestrzegany — uniemożliwił rozwój społeczności żydowskiej. Od końca XVIII wieku liczba ludności żydowskiej rosła, a w 1820 roku osiągnęła 20% mieszkańców.',
      'Wydarzenia polityczne i militarne sprawiły, że Wąwolnica w latach 1795–1918 zmieniała przynależność: 1795–1809 Austria, 1809–1815 Księstwo Warszawskie, 1815–1915 Rosja, 1915–1918 monarchia habsburska. Kres miejskiej historii Wąwolnicy położyły rządy zaborców — w 1870 roku, w ramach represji carskich po powstaniu styczniowym, miejscowość została pozbawiona praw miejskich i zdegradowana do rangi osady.',
    ],
    textNote: 'Powyższy fragment obejmuje dzieje Wąwolnicy do 1870 r. (na podstawie „Dziejów Wąwolnicy” S. Partyckiego, s. 94) — do uzupełnienia o dalszy ciąg opracowania.',
  },
  {
    id: 'pulawy',
    name: 'Puławy',
    region: 'Lubelszczyzna',
    team: 'UMCS w Lublinie',
    coordinates: [21.9686, 51.4164],
    map: null,
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
