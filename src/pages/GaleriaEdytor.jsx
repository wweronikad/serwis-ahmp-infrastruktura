import { useState, useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

// ── Cities config ─────────────────────────────────────────────────────────────

const CITIES = {
  biecz: {
    label: 'Biecz',
    center: [21.248, 49.731],
    basePath: '/galeria/biecz/',
    photos: [
      { id: 'panorama_1659',          file: 'biecz_panorama_od_poludnia_1659.webp',                                    title: 'Panorama od południa',             date: '1659' },
      { id: 'panorama_xvii_poczatek', file: 'biecz_panorama_od_poludnia_poczatek_xvii_w.webp',                        title: 'Panorama od południa',             date: 'pocz. XVII w.' },
      { id: 'od_poludnia_xvii',       file: 'biecz_od_poludnia_1_swierc_xvii_wieku.webp',                             title: 'Od południa, 1. ćwierć XVII w.',   date: '1. ćwierć XVII w.' },
      { id: 'widok_1880',             file: 'biecz_widok_od_poludniowego_zachodu_ok_1880.webp',                        title: 'Widok od płd.-zach.',              date: 'ok. 1880' },
      { id: 'widok_ogolny_1883',      file: 'biecz_widok_ogolny_miasta_od_poludniowego_zachodu_przed_1883.webp',       title: 'Widok ogólny od płd.-zach.',       date: 'przed 1883' },
      { id: 'widok_1894',             file: 'biecz_widok_miasta_od_poludniowego_zachodu_1894-1900.webp',               title: 'Widok od płd.-zach.',              date: '1894–1900' },
      { id: 'widok_1896',             file: 'biecz_widok_od_poludniowego_zachodu_1896.webp',                          title: 'Widok od płd.-zach.',              date: '1896' },
      { id: 'kolegiata_1865',         file: 'biecz_kolegiata_bozego_ciala_widok_od_poludniowego_zachodu_1865-1866.webp', title: 'Kolegiata Bożego Ciała',         date: '1865–1866' },
      { id: 'kolegiata_1892',         file: 'biecz_kolegiata_bozego_ciala_widok_od_poludniowego_zachodu_przed_1892.webp', title: 'Kolegiata Bożego Ciała',        date: 'przed 1892' },
      { id: 'kolegiata_1894',         file: 'biecz_kolegiata_bozego_ciala_widok_od_poludniowego_zachou_1894-1900.webp',  title: 'Kolegiata od płd.-zach.',        date: '1894–1900' },
      { id: 'kosciol_1920',           file: 'biecz_kosciol_bozego_ciala_ok_1920.webp',                                title: 'Kościół Bożego Ciała',             date: 'ok. 1920' },
      { id: 'kosciol_1930',           file: 'kosciol_parafialny_i_dzwonnica_w_bieczu_ok_1930.webp',                    title: 'Kościół parafialny i dzwonnica',   date: 'ok. 1930' },
      { id: 'ratusz_1894',            file: 'biecz_ratusz_1894-1900.webp',                                            title: 'Ratusz',                           date: '1894–1900' },
      { id: 'wieza_1895',             file: 'biecz_wieza_ratuszowa_przed_1895.webp',                                  title: 'Wieża ratuszowa',                  date: 'przed 1895' },
    ],
  },
  brzeg: {
    label: 'Brzeg',
    center: [17.472, 50.862],
    basePath: '/galeria/brzeg/',
    photos: [
      { id: 'widok_lotniczy_1925',       file: 'brzeg_pionowy_widok_z_lotu_ptaka_1925.webp',                        title: 'Widok lotniczy pionowy',            date: '1925' },
      { id: 'widok_ukosny_1925',         file: 'brzeg_widok_lotniczy_widok_ukosny_od_strony_poludniowej_1925.webp',  title: 'Widok lotniczy ukośny od południa', date: '1925' },
      { id: 'plan_widokowy_1758',        file: 'brzeg_plan_widokowy_miasta_1758.webp',                              title: 'Plan widokowy miasta',              date: '1758' },
      { id: 'przekroj_mlyna_1801',       file: 'brzeg_przekroj_mlyna_polskiego_z_palowaniem_1801.webp',              title: 'Przekrój młyna polskiego',          date: '1801' },
      { id: 'rzut_mlyna_1801',           file: 'brzeg_rzut_mlyna_polskiego_z_kolami_napedowymi_1801.webp',           title: 'Rzut młyna polskiego',              date: '1801' },
    ],
  },
  bydgoszcz: {
    label: 'Bydgoszcz',
    center: [18.009, 53.123],
    basePath: '/galeria/bydgoszcz/',
    photos: [
      { id: 'panorama_1657',             file: 'bydgoszcz_panorama_wraz_z_planem_miasta_1657.webp',                  title: 'Panorama wraz z planem miasta',     date: '1657' },
      { id: 'panorama_1830',             file: 'bydgoszcz_panorama_1830_od_strony_poludniowo_wschodniej.webp',        title: 'Panorama od płd.-wsch.',            date: '1830' },
      { id: 'panorama_1854',             file: 'bydgoszcz_panorama_1854_od_strony_poludniowo_wschodniej.webp',        title: 'Panorama od płd.-wsch.',            date: '1854' },
      { id: 'panorama_1860',             file: 'bydgoszcz_panorama_1860_od_strony_poludniowej.webp',                  title: 'Panorama od strony południowej',    date: '1860' },
      { id: 'tableau_1848_1853',         file: 'bydgoszcz_tableau_panorama_ok_1848_1853.webp',                        title: 'Tableau z panoramą i widokami',     date: 'ok. 1848–1853' },
      { id: 'stare_miasto',              file: 'bydgoszcz_stare_miasto_widok_ogolny_od_strony_poludniowej.webp',      title: 'Stare Miasto od południa',          date: 'b.d.' },
      { id: 'widok_polnocno_wschodni',   file: 'bydgoszcz_widok_od_strony_polnocno_wschodniej.webp',                  title: 'Widok od płn.-wsch.',               date: 'b.d.' },
      { id: 'widok_poludniowy_1997',     file: 'bydgoszcz_widok_ogolny_od_strony_poludniowej_1997.webp',              title: 'Widok od strony południowej',       date: '1997' },
      { id: 'widok_poludniowo_wschodni', file: 'bydgoszcz_widok_ogolny_od_strony_poludniowo_wschodniej.webp',         title: 'Widok od płd.-wsch.',               date: 'b.d.' },
    ],
  },
  chelmno: {
    label: 'Chełmno',
    center: [18.424, 53.349],
    basePath: '/galeria/chelmno/',
    photos: [
      { id: 'widok_wisla_1684',  file: 'chelmno_widok_od_strony_wisly_1684.webp',  title: 'Widok od strony Wisły',    date: '1684' },
      { id: 'widok_wisla_1745',  file: 'chelmno_widok_od_strony_wisly_1745.webp',  title: 'Widok od strony Wisły',    date: '1745' },
      { id: 'plan_1776_1779',    file: 'chelmno_plan_miasta_1776_1779.webp',        title: 'Plan miasta',              date: '1776–1779' },
      { id: 'z_lotu_ptaka_1995', file: 'chelmno_z_lotu_ptaka_1995.webp',            title: 'Chełmno z lotu ptaka',     date: '1995' },
    ],
  },
  chojnice: {
    label: 'Chojnice',
    center: [17.557, 53.696],
    basePath: '/galeria/chojnice/',
    photos: [
      { id: 'plan_widok_1724',                       file: 'chojnice_plan_miasta_i_widok_1724.webp',                   title: 'Plan miasta i widok',                              date: '1724' },
      { id: 'czesc_poludniowa',                      file: 'chojnice_czesc_poludniowa.webp',                           title: 'Część południowa Chojnic',                         date: 'b.d.' },
      { id: 'czesc_polnocna',                        file: 'chojnice_czesc_polnocna.webp',                             title: 'Część północna miasta',                            date: 'b.d.' },
      { id: 'widok_od_polnocy',                      file: 'chojnice_widok_od_polnocy.webp',                           title: 'Widok od strony północnej',                        date: 'b.d.' },
      { id: 'widok_od_wschodu',                      file: 'chojnice_widok_od_wschodu.webp',                           title: 'Widok na stare miasto od wschodu',                 date: 'b.d.' },
      { id: 'widok_od_zachodu_brama',                file: 'chojnice_widok_od_zachodu_brama.webp',                     title: 'Widok od zachodu — Brama Człuchowska',             date: 'b.d.' },
      { id: 'pierzeja_wschodnia_kosciol_gimnazjum',  file: 'chojnice_pierzeja_wschodnia_kosciol_gimnazjum.webp',       title: 'Pierzeja wschodnia rynku — kościoły i gimnazjum',  date: 'b.d.' },
      { id: 'pierzeja_wschodnia_kosciol',            file: 'chojnice_pierzeja_wschodnia_kosciol.webp',                 title: 'Pierzeja wschodnia rynku — kościół parafialny',    date: 'b.d.' },
      { id: 'widok_od_poludnia_augustianie_rynek',   file: 'chojnice_widok_od_poludnia_augustianie_rynek.webp',        title: 'Widok od południa — augustianie, rynek',           date: 'b.d.' },
      { id: 'widok_od_poludnia_augustianie',         file: 'chojnice_widok_od_poludnia_augustianie.webp',              title: 'Widok od południa — kościół augustianów',          date: 'b.d.' },
      { id: 'widok_od_zachodu_przedmiescie',         file: 'chojnice_widok_od_zachodu_przedmiescie.webp',              title: 'Widok od zachodu — Przedmieście Człuchowskie',     date: 'b.d.' },
    ],
  },
  grudziadz: {
    label: 'Grudziądz',
    center: [18.756, 53.484],
    basePath: '/galeria/grudziadz/',
    photos: [
      { id: 'widok_1656',                              file: 'grudziadz_widok_1656.webp',                                title: 'Widok Grudziądza',                                date: '1656' },
      { id: 'plan_miasta_1756',                        file: 'grudziadz_plan_miasta_1756.webp',                          title: 'Plan miasta',                                     date: '1756' },
      { id: 'plan_miasta_1772',                        file: 'grudziadz_plan_miasta_1772.webp',                          title: 'Plan miasta',                                     date: '1772' },
      { id: 'plan_miasta_ok_1800',                     file: 'grudziadz_plan_miasta_ok_1800.webp',                       title: 'Plan miasta',                                     date: 'ok. 1800' },
      { id: 'oblezenie_1807',                          file: 'grudziadz_oblezenie_1807.webp',                            title: 'Oblężenie Grudziądza, lipiec 1807 r.',             date: '1807' },
      { id: 'model_miasta_ok_2pol_xviii_w',            file: 'grudziadz_model_miasta_ok_2pol_xviii_w.webp',              title: 'Model miasta (ok. II poł. XVIII w.)',              date: 'ok. 2. poł. XVIII w.' },
      { id: 'widok_ok_1837',                           file: 'grudziadz_widok_ok_1837.webp',                             title: 'Widok na Grudziądz',                              date: 'ok. 1837' },
      { id: 'widok_z_kepy_strzemiecinskiej_1869',      file: 'grudziadz_widok_z_kepy_strzemiecinskiej_1869.webp',        title: 'Widok z Kępy Strzemięcińskiej',                   date: '1869' },
      { id: 'i_gora_zamkowa_od_zachodu',               file: 'grudziadz_i_gora_zamkowa_od_zachodu.webp',                 title: 'Grudziądz i Góra Zamkowa od zachodu',             date: 'b.d.' },
      { id: 'gora_zamkowa_od_polnocy',                 file: 'grudziadz_gora_zamkowa_od_polnocy.webp',                   title: 'Góra Zamkowa od strony północnej',                date: 'b.d.' },
      { id: 'od_poludniowego_wschodu',                 file: 'grudziadz_od_poludniowego_wschodu.webp',                   title: 'Grudziądz od strony płd.-wschodniej',             date: 'b.d.' },
      { id: 'widok_ogolny_od_poludniowego_zachodu',    file: 'grudziadz_widok_ogolny_od_poludniowego_zachodu.webp',      title: 'Widok ogólny od strony płd.-zachodniej',          date: 'b.d.' },
    ],
  },
  gizycko: {
    label: 'Giżycko',
    center: [21.764, 54.038],
    basePath: '/galeria/gizycko/',
    photos: [
      { id: 'widok_z_twierdzy_1859',               file: 'gizycko_widok_z_twierdzy_1859.webp',                         title: 'Widok miasta z twierdzy',                                      date: '1859' },
      { id: 'widok_z_wiezy_cisnier_ok_1920',        file: 'gizycko_widok_z_wiezy_cisnier_ok_1920.webp',                 title: 'Widok na miasto z wieży ciśnień',                              date: 'ok. 1920' },
      { id: 'widok_na_centrum_i_zamek_ok_1914',     file: 'gizycko_widok_na_centrum_i_zamek_ok_1914.webp',              title: 'Widok na centrum i zamek',                                     date: 'ok. 1914' },
      { id: 'widok_od_strony_niegocina',            file: 'gizycko_widok_od_strony_niegocina.webp',                     title: 'Widok od strony Niegocina',                                    date: 'b.d.' },
      { id: 'widok_od_strony_zamku',                file: 'gizycko_widok_od_strony_zamku.webp',                         title: 'Widok od strony zamku',                                        date: 'b.d.' },
      { id: 'widok_na_rynek_ul_krolewiecka_1930',   file: 'gizycko_widok_na_rynek_ul_krolewiecka_1930.webp',            title: 'Widok na dawny rynek i ul. Królewiecką',                       date: '1930' },
      { id: 'widok_na_ul_warszawska_1930',          file: 'gizycko_widok_na_ul_warszawska_1930.webp',                   title: 'Widok na ul. Warszawską (d. Lyckerstrasse)',                    date: '1930' },
      { id: 'widok_od_poludniowego_zachodu_ok_1930',file: 'gizycko_widok_od_poludniowego_zachodu_ok_1930.webp',         title: 'Widok od strony płd.-zachodniej',                              date: 'ok. 1930' },
      { id: 'widok_od_zachodu',                     file: 'gizycko_widok_od_zachodu.webp',                              title: 'Widok od strony zachodniej',                                   date: 'b.d.' },
      { id: 'widok_ze_wzgorza_brunona_ok_1914',     file: 'gizycko_widok_ze_wzgorza_brunona_ok_1914.webp',              title: 'Widok ze wzgórza Brunona',                                     date: 'ok. 1914' },
      { id: 'widok_na_wschodnia_czesc',             file: 'gizycko_widok_na_wschodnia_czesc.webp',                      title: 'Widok na wschodnią część miasta',                              date: 'b.d.' },
      { id: 'widok_na_wschodnia_strone_rynku_ok_1930', file: 'gizycko_widok_na_wschodnia_strone_rynku_ok_1930.webp',   title: 'Widok na wsch. stronę pl. Grunwaldzkiego',                     date: 'ok. 1930' },
      { id: 'widok_na_zachodnia_strone_rynku_przed_1914', file: 'gizycko_widok_na_zachodnia_strone_rynku_przed_1914.webp', title: 'Widok na zach. stronę pl. Grunwaldzkiego',                 date: 'przed 1914' },
    ],
  },
  kwidzyn: {
    label: 'Kwidzyn',
    center: [18.931, 53.737],
    basePath: '/galeria/kwidzyn/',
    photos: [
      { id: 'widok_centrum_od_se',                      file: 'kwidzyn_widok_centrum_od_se.webp',                      title: 'Widok na centrum od strony płd.-wschodniej',         date: 'b.d.' },
      { id: 'widok_dworzec',                             file: 'kwidzyn_widok_dworzec.webp',                             title: 'Widok na dworzec kolejowy',                          date: 'b.d.' },
      { id: 'widok_poludniowa_czesc',                    file: 'kwidzyn_widok_poludniowa_czesc.webp',                    title: 'Widok na południową część miasta',                   date: 'b.d.' },
      { id: 'widok_od_polnocy_przedmiescie_malborskie',  file: 'kwidzyn_widok_od_polnocy_przedmiescie_malborskie.webp',  title: 'Widok od północy na dawne przedmieście malborskie',  date: 'b.d.' },
      { id: 'widok_szkola_podoficerska',                 file: 'kwidzyn_widok_szkola_podoficerska.webp',                 title: 'Widok na zabudowania dawnej Szkoły Podoficerskiej',  date: 'b.d.' },
      { id: 'widok_od_wschodu_miasto_lokacyjne',         file: 'kwidzyn_widok_od_wschodu_miasto_lokacyjne.webp',         title: 'Widok od wschodu na średniowieczne miasto lokacyjne', date: 'b.d.' },
      { id: 'zdjecia_lotnicze_2023',                     file: 'kwidzyn_zdjecia_lotnicze_2023.webp',                     title: 'Zdjęcia lotnicze',                                   date: '2023' },
      { id: 'zdjecia_lotnicze_2023_2',                   file: 'kwidzyn_zdjecia_lotnicze_2023_2.webp',                   title: 'Zdjęcia lotnicze',                                   date: '2023' },
    ],
  },
  ketrzyn: {
    label: 'Kętrzyn',
    center: [21.373, 54.078],
    basePath: '/galeria/ketrzyn/',
    photos: [
      { id: 'miasto_i_okolice_1660_1678',    file: 'ketrzyn_miasto_i_okolice_1660_1678.webp',    title: 'Miasto i okolice, 1660–1678 (fragment)',           date: '1660–1678' },
      { id: 'widok_od_polnocy_1684',          file: 'ketrzyn_widok_od_polnocy_1684.webp',          title: 'Widok miasta od strony północnej',                 date: '1684' },
      { id: 'widok_od_poludnia',              file: 'ketrzyn_widok_od_poludnia.webp',              title: 'Widok od strony południowej (dawne Nowe Miasto)',  date: 'b.d.' },
      { id: 'widok_ogolny_od_polnocy',        file: 'ketrzyn_widok_ogolny_od_polnocy.webp',        title: 'Widok ogólny od strony północnej',                 date: 'b.d.' },
    ],
  },
  elblag: {
    label: 'Elbląg',
    center: [19.404, 54.156],
    basePath: '/galeria/elblag/',
    photos: [
      { id: 'widok_1554',         file: 'elblag_widok_miasta_1554.webp',           title: 'Widok miasta',          date: '1554' },
      { id: 'plan_widok_ok_1642', file: 'elblag_plan_i_widok_miasta_ok_1642.webp', title: 'Plan i widok miasta',   date: 'ok. 1642' },
    ],
  },
  legnica: {
    label: 'Legnica',
    center: [16.156, 51.207],
    basePath: '/galeria/legnica/',
    photos: [
      { id: 'zamek_sredniowieczny',  file: 'legnica_zamek_sredniowieczny.webp',  title: 'Zamek średniowieczny',                date: 'b.d.' },
      { id: 'relikty_drewniane',     file: 'legnica_relikty_drewniane.webp',     title: 'Relikty drewniane (zagroda, ulica)',   date: 'b.d.' },
      { id: 'relikty_zabudowy',      file: 'legnica_relikty_zabudowy.webp',      title: 'Relikty zabudowy w bloku śródmiejskim', date: 'b.d.' },
    ],
  },
  'lidzbark-warminski': {
    label: 'Lidzbark Warmiński',
    center: [20.579, 54.127],
    basePath: '/galeria/lidzbark_warminski/',
    photos: [
      { id: 'panorama_od_poludnia_1704',   file: 'lidzbark_panorama_od_poludnia_1704.webp',   title: 'Panorama miasta od południa',     date: '1704' },
      { id: 'widok_na_mlyny_1845',          file: 'lidzbark_widok_na_mlyny_1845.webp',          title: 'Widok na młyny nad Łysiną',       date: '1845' },
      { id: 'widok_na_ratusz_1845',         file: 'lidzbark_widok_na_ratusz_1845.webp',         title: 'Widok na ratusz',                 date: '1845' },
      { id: 'zdjecia_lotnicze_2019',        file: 'lidzbark_zdjecia_lotnicze_2019.webp',        title: 'Zdjęcia lotnicze',                date: '2019' },
      { id: 'zdjecia_lotnicze_2019_2',      file: 'lidzbark_zdjecia_lotnicze_2019_2.webp',      title: 'Zdjęcia lotnicze',                date: '2019' },
    ],
  },
  milicz: {
    label: 'Milicz',
    center: [17.277, 51.532],
    basePath: '/galeria/milicz/',
    photos: [
      { id: 'zamek', file: 'milicz_zamek.webp', title: 'Zamek', date: 'b.d.' },
    ],
  },
  namyslow: {
    label: 'Namysłów',
    center: [17.714, 51.075],
    basePath: '/galeria/namyslow/',
    photos: [
      { id: 'budownictwo_murowane',       file: 'namyslow_budownictwo_murowane.webp',       title: 'Budownictwo murowane (poł. XIII – XVI w.)', date: 'b.d.' },
      { id: 'chronologia_osadnictwa',     file: 'namyslow_chronologia_osadnictwa.webp',     title: 'Chronologia osadnictwa (XII–XIV w.)',        date: 'b.d.' },
      { id: 'osadnictwo',                 file: 'namyslow_osadnictwo.webp',                 title: 'Osadnictwo pradziejowe i średniowieczne',    date: 'b.d.' },
    ],
  },
  ostroda: {
    label: 'Ostróda',
    center: [19.959, 53.699],
    basePath: '/galeria/ostroda/',
    photos: [
      { id: 'zdjecia_lotnicze',   file: 'ostroda_zdjecia_lotnicze.webp',   title: 'Zdjęcia lotnicze', date: 'b.d.' },
      { id: 'zdjecia_lotnicze_2', file: 'ostroda_zdjecia_lotnicze_2.webp', title: 'Zdjęcia lotnicze', date: 'b.d.' },
    ],
  },
  puck: {
    label: 'Puck',
    center: [18.405, 54.719],
    basePath: '/galeria/puck/',
    photos: [
      { id: 'zdjecia_lotnicze', file: 'puck_zdjecia_lotnicze.webp', title: 'Zdjęcia lotnicze', date: 'b.d.' },
    ],
  },
  'sroda-slaska': {
    label: 'Środa Śląska',
    center: [16.594, 51.163],
    basePath: '/galeria/sroda_slaska/',
    photos: [
      { id: 'osadnictwo',                  file: 'sroda_slaska_osadnictwo.webp',                  title: 'Osadnictwo okolic (XII–XIV w.)',              date: 'b.d.' },
      { id: 'stanowiska_archeologiczne',   file: 'sroda_slaska_stanowiska_archeologiczne.webp',   title: 'Średniowieczne stanowiska archeologiczne',    date: 'b.d.' },
    ],
  },
  strzegom: {
    label: 'Strzegom',
    center: [16.35, 50.962],
    basePath: '/galeria/strzegom/',
    photos: [
      { id: 'osadnictwo',  file: 'strzegom_osadnictwo.webp',  title: 'Osadnictwo zaplecza (XII–XIII w.)',              date: 'b.d.' },
      { id: 'wsie_okrgu',  file: 'strzegom_wsie_okrgu.webp',  title: 'Wsie okręgu strzegomskiego do końca XV w.',      date: 'b.d.' },
    ],
  },
  swidnica: {
    label: 'Świdnica',
    center: [16.486, 50.848],
    basePath: '/galeria/swidnica/',
    photos: [
      { id: 'poczatki_kamienic',  file: 'swidnica_poczatki_kamienic.webp',  title: 'Początki kamienic — zachodnia pierzeja rynku', date: 'b.d.' },
      { id: 'rozwoj_zabudowy',    file: 'swidnica_rozwoj_zabudowy.webp',    title: 'Rozwój zabudowy bloku rynku (średniowiecze)',  date: 'b.d.' },
    ],
  },
  swiecie: {
    label: 'Świecie',
    center: [18.432, 53.414],
    basePath: '/galeria/swiecie/',
    photos: [
      { id: 'czesc_poludniowa',        file: 'swiecie_czesc_poludniowa.webp',        title: 'Część południowa miasta',                  date: 'b.d.' },
      { id: 'czesc_polnocna',          file: 'swiecie_czesc_polnocna.webp',          title: 'Część północna miasta',                    date: 'b.d.' },
      { id: 'panorama_nowego_miasta',  file: 'swiecie_panorama_nowego_miasta.webp',  title: 'Panorama Nowego Miasta od zachodu',        date: 'b.d.' },
      { id: 'kosciol_ewangelicki',     file: 'swiecie_kosciol_ewangelicki.webp',     title: 'Dawny kościół ewangelicki (ob. św. A. Boboli)', date: 'b.d.' },
      { id: 'klasztor_bernardynow',    file: 'swiecie_klasztor_bernardynow.webp',    title: 'Dawny kościół i klasztor bernardynów',    date: 'b.d.' },
      { id: 'zamek_krzyzacki',         file: 'swiecie_zamek_krzyzacki.webp',         title: 'Dawny zamek krzyżacki',                    date: 'b.d.' },
      { id: 'kosciol_nmp',             file: 'swiecie_kosciol_nmp.webp',             title: 'Kościół NMP i Stare Miasto',               date: 'b.d.' },
      { id: 'rynek_ratusz',            file: 'swiecie_rynek_ratusz.webp',            title: 'Rynek i ratusz',                           date: 'b.d.' },
      { id: 'plan_ruin_zamku_1795',    file: 'swiecie_plan_ruin_zamku_1795.webp',    title: 'Plan ruin zamku i wieża zamkowa',          date: 'ok. 1795' },
      { id: 'widok_od_zachodu_xix',    file: 'swiecie_widok_od_zachodu_xix.webp',    title: 'Widok miasta od zachodu',                  date: 'pocz. XIX w.' },
      { id: 'widok_zamku_1656',        file: 'swiecie_widok_zamku_1656.webp',        title: 'Widok zamku od południa',                  date: '1656' },
    ],
  },
  tarnow: {
    label: 'Tarnów',
    center: [20.985, 50.013],
    basePath: '/galeria/tarnow/',
    photos: [
      { id: 'kolegiata_1800',             file: 'tarnow_kolegiata_1800.webp',             title: 'Kolegiata',                         date: '1800' },
      { id: 'widok_z_lotu_ptaka',         file: 'tarnow_widok_z_lotu_ptaka.webp',         title: 'Widok z lotu ptaka',                date: 'b.d.' },
      { id: 'rynek_ratusz_1800',          file: 'tarnow_rynek_ratusz_1800.webp',          title: 'Rynek i ratusz',                    date: '1800' },
      { id: 'widok_od_poludnia_1820',     file: 'tarnow_widok_od_poludnia_1820.webp',     title: 'Widok od południa',                 date: '1820–30' },
      { id: 'widok_gory_sw_marcina_1831', file: 'tarnow_widok_gory_sw_marcina_1831.webp', title: 'Widok z Góry św. Marcina',          date: '1831' },
      { id: 'zamek_gora_sw_marcina',      file: 'tarnow_zamek_gora_sw_marcina.webp',      title: 'Zamek na Górze św. Marcina',        date: 'b.d.' },
    ],
  },
  tczew: {
    label: 'Tczew',
    center: [18.776, 53.777],
    basePath: '/galeria/tczew/',
    photos: [
      { id: 'widok_od_poludnia',         file: 'tczew_widok_od_poludnia.webp',         title: 'Widok od południa',           date: 'b.d.' },
      { id: 'widok_od_polnocy',          file: 'tczew_widok_od_polnocy.webp',          title: 'Widok od północy',            date: 'b.d.' },
      { id: 'widok_od_polnocy_2',        file: 'tczew_widok_od_polnocy_2.webp',        title: 'Widok od północy',            date: 'b.d.' },
      { id: 'widok_od_wschodu',          file: 'tczew_widok_od_wschodu.webp',          title: 'Widok od wschodu',            date: 'b.d.' },
      { id: 'panorama_od_wschodu_1855',  file: 'tczew_panorama_od_wschodu_1855.webp',  title: 'Panorama od wschodu',         date: '1855' },
      { id: 'zdjecia_lotnicze_2013',     file: 'tczew_zdjecia_lotnicze_2013.webp',     title: 'Zdjęcia lotnicze',            date: '2013' },
      { id: 'zdjecia_lotnicze_2013_2',   file: 'tczew_zdjecia_lotnicze_2013_2.webp',   title: 'Zdjęcia lotnicze',            date: '2013' },
    ],
  },
  torun: {
    label: 'Toruń',
    center: [18.604, 53.013],
    basePath: '/galeria/torun/',
    photos: [
      { id: 'dwor_artusa_xviii',           file: 'torun_dwor_artusa_xviii.webp',           title: 'Dwór Artusa (poł. XVIII w.)',            date: 'poł. XVIII w.' },
      { id: 'plan_wsi_przysiek_1601',      file: 'torun_plan_wsi_przysiek_1601.webp',      title: 'Plan wsi Przysiek',                      date: '1601' },
      { id: 'ruiny_zamku',                 file: 'torun_ruiny_zamku.webp',                 title: 'Ruiny zamku krzyżackiego',               date: 'b.d.' },
      { id: 'rynek_nowego_miasta',         file: 'torun_rynek_nowego_miasta.webp',         title: 'Rynek Nowego Miasta od południa',        date: 'b.d.' },
      { id: 'rynek_starego_miasta',        file: 'torun_rynek_starego_miasta.webp',        title: 'Rynek Starego Miasta od płn.-zach.',     date: 'b.d.' },
      { id: 'widok_ogolny_od_polnocy',     file: 'torun_widok_ogolny_od_polnocy.webp',     title: 'Widok ogólny od północy',                date: 'b.d.' },
      { id: 'domy_ul_zeglarska_1783',      file: 'torun_domy_ul_zeglarska_1783.webp',      title: 'Domy przy ul. Żeglarskiej',              date: '1783' },
      { id: 'plan_widok_1641',             file: 'torun_plan_widok_1641.webp',             title: 'Plan-widok perspektywiczny',             date: '1641' },
      { id: 'widok_od_poludnia_xviii',     file: 'torun_widok_od_poludnia_xviii.webp',     title: 'Widok od południa (2. poł. XVIII w.)',   date: '2. poł. XVIII w.' },
      { id: 'widok_od_polnocy_po_1756',    file: 'torun_widok_od_polnocy_po_1756.webp',    title: 'Widok od północy',                       date: 'po 1756' },
    ],
  },
  trzebnica: {
    label: 'Trzebnica',
    center: [17.062, 51.311],
    basePath: '/galeria/trzebnica/',
    photos: [
      { id: 'osadnictwo',                 file: 'trzebnica_osadnictwo.webp',                 title: 'Osadnictwo ujazdu trzebnickiego (XII–XIII w.)', date: 'b.d.' },
      { id: 'stanowiska_archeologiczne',  file: 'trzebnica_stanowiska_archeologiczne.webp',  title: 'Średniowieczne stanowiska archeologiczne',     date: 'b.d.' },
    ],
  },
  wloclawek: {
    label: 'Włocławek',
    center: [19.065, 52.648],
    basePath: '/galeria/wloclawek/',
    photos: [
      { id: 'widok_od_polnocy_1894', file: 'wloclawek_widok_od_polnocy_1894.webp', title: 'Widok od północy (zawody wioślarskie na Wiśle)', date: 'ok. 1894' },
      { id: 'widok_ok_1836',         file: 'wloclawek_widok_ok_1836.webp',         title: 'Widok miasta',                                  date: 'ok. 1836' },
    ],
  },
  wroclaw: {
    label: 'Wrocław',
    center: [17.038, 51.107],
    basePath: '/galeria/wroclaw/',
    photos: [
      { id: 'architektura_mieszczanska',  file: 'wroclaw_architektura_mieszczanska.webp',  title: 'Architektura mieszczańska przy rynku',              date: 'b.d.' },
      { id: 'dzialki_przyrynkowe',        file: 'wroclaw_dzialki_przyrynkowe.webp',        title: 'Kształtowanie działek przyrynkowych (XIII–XV w.)', date: 'b.d.' },
      { id: 'zabudowa_bloki',             file: 'wroclaw_zabudowa_bloki.webp',             title: 'Zabudowa bloków na zachód od rynku',               date: 'b.d.' },
      { id: 'studium_parcelacyjne',       file: 'wroclaw_studium_parcelacyjne.webp',       title: 'Studium przekształceń parcelacyjnych',             date: 'b.d.' },
      { id: 'zamek_ksiazеcy',             file: 'wroclaw_zamek_ksiazеcy.webp',             title: 'Zamek książęcy — fazy rozwoju (XII–XV w.)',        date: 'b.d.' },
    ],
  },
  zamosc: {
    label: 'Zamość',
    center: [23.252, 50.722],
    basePath: '/galeria/zamosc/',
    photos: [
      { id: 'novum_zamoscium_1642',            file: 'zamosc_novum_zamoscium_1642.webp',            title: 'Novum Zamoscium',                           date: 'ok. 1642' },
      { id: 'widok_od_poludnia_1662',          file: 'zamosc_widok_od_poludnia_1662.webp',          title: 'Widok od południa',                         date: 'ok. 1662' },
      { id: 'widok_bramy_szczebrzeskiej_1821', file: 'zamosc_widok_bramy_szczebrzeskiej_1821.webp', title: 'Widok od strony Bramy Szczebrzeskiej',      date: '1821' },
      { id: 'przed_1890_1',                    file: 'zamosc_przed_1890_1.webp',                    title: 'Widok miasta',                              date: 'przed 1890' },
      { id: 'przed_1890_2',                    file: 'zamosc_przed_1890_2.webp',                    title: 'Widok miasta',                              date: 'przed 1890' },
      { id: 'przed_1890_3',                    file: 'zamosc_przed_1890_3.webp',                    title: 'Widok miasta',                              date: 'przed 1890' },
      { id: 'przed_1890_4',                    file: 'zamosc_przed_1890_4.webp',                    title: 'Widok miasta',                              date: 'przed 1890' },
      { id: 'przed_1890_5',                    file: 'zamosc_przed_1890_5.webp',                    title: 'Widok miasta',                              date: 'przed 1890' },
      { id: 'przed_1890_6',                    file: 'zamosc_przed_1890_6.webp',                    title: 'Widok miasta',                              date: 'przed 1890' },
      { id: 'przed_1890_7',                    file: 'zamosc_przed_1890_7.webp',                    title: 'Widok miasta',                              date: 'przed 1890' },
      { id: 'przed_1890',                      file: 'zamosc_przed_1890.webp',                      title: 'Widok miasta',                              date: 'przed 1890' },
      { id: 'zamosc_1927',                     file: 'zamosc_1927.webp',                            title: 'Widok miasta',                              date: '1927' },
      { id: 'widok_z_lotu_ptaka_2022',         file: 'zamosc_widok_z_lotu_ptaka_2022.webp',         title: 'Widok z lotu ptaka',                        date: '2022' },
    ],
  },
  ziebice: {
    label: 'Ziębice',
    center: [17.043, 50.602],
    basePath: '/galeria/ziebice/',
    photos: [
      { id: 'mapa_ksiestwa',              file: 'ziebice_mapa_ksiestwa.webp',              title: 'Mapa księstwa ziębickiego',                date: 'poł. XVIII w.' },
      { id: 'mapa_otoczenia_rolnego',     file: 'ziebice_mapa_otoczenia_rolnego_1768.webp', title: 'Mapa otoczenia rolnego',                  date: '1768' },
      { id: 'widok_z_lotu_ptaka_1762',    file: 'ziebice_widok_z_lotu_ptaka_1762.webp',    title: 'Miasto — widok z lotu ptaka',             date: '1762–1771' },
      { id: 'panorama_od_sw_1738',        file: 'ziebice_panorama_od_sw_1738.webp',        title: 'Panorama od południowego zachodu',        date: '1738' },
      { id: 'plan_miasta_1762',           file: 'ziebice_plan_miasta_1762.webp',           title: 'Plan miasta',                             date: '1762–1771' },
      { id: 'kosciol_sw_jerzego',         file: 'ziebice_kosciol_sw_jerzego.webp',         title: 'Kościół pw. św. Jerzego — rzut i przekrój', date: 'przed 1904' },
      { id: 'fasada_kosciol_sw_jerzego',  file: 'ziebice_fasada_kosciol_sw_jerzego.webp',  title: 'Kościół Św. Jerzego — fasada zachodnia',  date: 'pocz. XX w.' },
      { id: 'widok_od_poludnia_1928',     file: 'ziebice_widok_od_poludnia_1928.webp',     title: 'Widok od południa',                       date: '1928' },
      { id: 'widok_od_sw_1928',           file: 'ziebice_widok_od_sw_1928.webp',           title: 'Widok od południowego zachodu',           date: '1928' },
    ],
  },
}

// ── Helper: actual rendered image bounds (accounts for object-fit: contain) ─

function getImgRenderBounds(imgEl) {
  const r = imgEl.getBoundingClientRect()
  const nw = imgEl.naturalWidth, nh = imgEl.naturalHeight
  const cr = r.width / r.height
  const nr = nw / nh
  if (nr > cr) {
    const h = r.width / nr
    return { left: r.left, top: r.top + (r.height - h) / 2, width: r.width, height: h }
  } else {
    const w = r.height * nr
    return { left: r.left + (r.width - w) / 2, top: r.top, width: w, height: r.height }
  }
}

// ── Main component ─────────────────────────────────────────────────────────

export default function GaleriaEdytor() {
  const [cityId, setCityId]   = useState('biecz')
  const city = CITIES[cityId]

  // Per-city data stored separately so switching preserves work
  const [allData, setAllData] = useState(() =>
    Object.fromEntries(
      Object.entries(CITIES).map(([id, c]) => [
        id,
        c.photos.map(p => ({ ...p, mapPin: null, imgPins: [] })),
      ])
    )
  )
  const data    = allData[cityId]
  const setData = (updater) =>
    setAllData(prev => ({ ...prev, [cityId]: typeof updater === 'function' ? updater(prev[cityId]) : updater }))

  const [activeIdx, setActiveIdx] = useState(0)
  const [tab, setTab] = useState('photo') // 'photo' | 'map'
  const [prompt, setPrompt]     = useState(null)  // { x, y } — pending pin
  const [labelText, setLabelText] = useState('')
  const imgRef   = useRef(null)
  const mapRef   = useRef(null)
  const markerRef = useRef(null)
  const mapElRef  = useRef(null)
  const inputRef  = useRef(null)

  const photo = data[activeIdx]

  // ── Image: click → place pin ───────────────────────────────────────────

  const handleImgClick = useCallback((e) => {
    if (prompt) return // already waiting for label
    const bounds = getImgRenderBounds(e.currentTarget)
    const x = parseFloat(((e.clientX - bounds.left) / bounds.width  * 100).toFixed(1))
    const y = parseFloat(((e.clientY - bounds.top)  / bounds.height * 100).toFixed(1))
    if (x < 0 || x > 100 || y < 0 || y > 100) return
    setPrompt({ x, y })
    setLabelText('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [prompt])

  const confirmPin = useCallback(() => {
    if (!labelText.trim() || !prompt) return
    setData(prev => prev.map((p, i) =>
      i !== activeIdx ? p
        : { ...p, imgPins: [...p.imgPins, { x: prompt.x, y: prompt.y, label: labelText.trim() }] }
    ))
    setPrompt(null)
  }, [labelText, prompt, activeIdx])

  const removePin = useCallback((pinIdx) => {
    setData(prev => prev.map((p, i) =>
      i !== activeIdx ? p
        : { ...p, imgPins: p.imgPins.filter((_, j) => j !== pinIdx) }
    ))
  }, [activeIdx])

  const cancelPrompt = useCallback(() => setPrompt(null), [])

  const clearMapPin = useCallback(() => {
    setData(prev => prev.map((p, i) => i !== activeIdx ? p : { ...p, mapPin: null }))
    if (markerRef.current) { markerRef.current.remove(); markerRef.current = null }
  }, [activeIdx])

  // ── Map init / destroy ─────────────────────────────────────────────────

  useEffect(() => {
    if (tab !== 'map' || !mapElRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapElRef.current,
      style: {
        version: 8,
        sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OpenStreetMap' } },
        layers:  [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: city.center,
      zoom: 14,
    })
    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.on('click', (e) => {
      const { lng, lat } = e.lngLat
      const pin = [parseFloat(lng.toFixed(6)), parseFloat(lat.toFixed(6))]
      setData(prev => prev.map((p, i) => i !== activeIdx ? p : { ...p, mapPin: pin }))

      // Update/create marker
      if (markerRef.current) markerRef.current.remove()
      markerRef.current = new maplibregl.Marker({ color: '#b8963e' })
        .setLngLat(pin)
        .addTo(map)
    })

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current  = null
      markerRef.current = null
    }
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── When switching to map tab OR changing photo — restore existing marker ─

  useEffect(() => {
    const map = mapRef.current
    if (!map || tab !== 'map') return
    if (markerRef.current) markerRef.current.remove()
    if (photo.mapPin) {
      markerRef.current = new maplibregl.Marker({ color: '#b8963e' })
        .setLngLat(photo.mapPin)
        .addTo(map)
      map.flyTo({ center: photo.mapPin, zoom: 15, duration: 600 })
    } else {
      markerRef.current = null
    }
  }, [tab, activeIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Export JSON ────────────────────────────────────────────────────────

  const exportJson = () => {
    const out = data.map(({ id, file, title, date, mapPin, imgPins }) => ({ id, file, title, date, mapPin, imgPins }))
    const json = JSON.stringify(out, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${cityId}_gallery.json`
    a.click()
  }

  // ── Keyboard: Enter = confirm, Escape = cancel ─────────────────────────

  useEffect(() => {
    const fn = (e) => {
      if (!prompt) return
      if (e.key === 'Enter')  confirmPin()
      if (e.key === 'Escape') cancelPrompt()
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [prompt, confirmPin, cancelPrompt])

  // ── Navigate photos ────────────────────────────────────────────────────

  const goTo = (idx) => {
    setPrompt(null)
    setActiveIdx(idx)
  }

  const switchCity = (id) => {
    setPrompt(null)
    setActiveIdx(0)
    setTab('photo')
    // Fly map to new city if map is already initialized
    if (mapRef.current) {
      mapRef.current.flyTo({ center: CITIES[id].center, zoom: 13, duration: 800 })
    }
    setCityId(id)
  }

  // ── Render ─────────────────────────────────────────────────────────────

  const donePins  = data.filter(p => p.mapPin && p.imgPins.length > 0).length
  const totalPins = data.length

  return (
    <div style={s.root}>

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside style={s.sidebar}>
        <div style={s.sidebarHead}>
          <span style={s.sidebarTitle}>Edytor galerii</span>
          <select
            value={cityId}
            onChange={e => switchCity(e.target.value)}
            style={s.citySelect}
          >
            {Object.entries(CITIES).map(([id, c]) => (
              <option key={id} value={id}>{c.label}</option>
            ))}
          </select>
          <span style={s.sidebarSub}>{donePins}/{totalPins} gotowych</span>
        </div>
        <div style={s.thumbList}>
          {data.map((p, i) => {
            const done  = p.mapPin && p.imgPins.length > 0
            const partial = p.mapPin || p.imgPins.length > 0
            return (
              <button key={p.id} onClick={() => goTo(i)} style={{ ...s.thumbBtn, ...(i === activeIdx ? s.thumbActive : {}) }}>
                <img src={city.basePath + p.file} alt="" style={s.thumbImg} />
                <div style={s.thumbInfo}>
                  <div style={s.thumbName}>{p.title}</div>
                  <div style={s.thumbDate}>{p.date}</div>
                  <div style={s.thumbStatus}>
                    <span style={{ color: p.mapPin ? '#2e7d32' : '#999' }}>📍 mapa</span>
                    <span style={{ color: p.imgPins.length > 0 ? '#2e7d32' : '#999', marginLeft: 6 }}>🖼 {p.imgPins.length} pin.</span>
                  </div>
                </div>
                {done && <span style={s.checkmark}>✓</span>}
              </button>
            )
          })}
        </div>
        <div style={s.sidebarFoot}>
          <button onClick={exportJson} style={s.exportBtn}>↓ Eksportuj JSON</button>
        </div>
      </aside>

      {/* ── Main panel ─────────────────────────────────────────────────── */}
      <main style={s.main}>

        {/* Header */}
        <div style={s.mainHead}>
          <div>
            <span style={s.mainTitle}>{photo.title}</span>
            <span style={s.mainDate}> · {photo.date}</span>
          </div>
          <div style={s.tabs}>
            <button onClick={() => setTab('photo')} style={tab === 'photo' ? s.tabActive : s.tab}>
              🖼 Zdjęcie
            </button>
            <button onClick={() => setTab('map')} style={tab === 'map' ? s.tabActive : s.tab}>
              📍 Mapa
            </button>
          </div>
          <div style={s.navBtns}>
            <button onClick={() => goTo(Math.max(0, activeIdx - 1))} disabled={activeIdx === 0} style={s.navBtn}>← Poprzednie</button>
            <button onClick={() => goTo(Math.min(data.length - 1, activeIdx + 1))} disabled={activeIdx === data.length - 1} style={s.navBtn}>Następne →</button>
          </div>
        </div>

        {/* ── Photo tab ─────────────────────────────────────────────── */}
        {tab === 'photo' && (
          <div style={s.photoArea}>
            <div style={s.hint}>
              Kliknij na zdjęcie, żeby dodać pinezkę z podpisem
            </div>
            <div style={s.imgWrapper}>
              <img
                ref={imgRef}
                src={city.basePath + photo.file}
                alt={photo.title}
                style={s.img}
                onClick={handleImgClick}
                draggable={false}
              />

              {/* Existing pins */}
              {photo.imgPins.map((pin, i) => (
                <div key={i} style={{ ...s.pin, left: `${pin.x}%`, top: `${pin.y}%` }}>
                  <div style={s.pinDot} />
                  <div style={s.pinLabel} onClick={e => e.stopPropagation()}>
                    {pin.label}
                    <button
                      onClick={(e) => { e.stopPropagation(); removePin(i) }}
                      style={s.pinRemove}
                      title="Usuń pinezkę"
                    >✕</button>
                  </div>
                </div>
              ))}

              {/* Pending pin */}
              {prompt && (
                <div style={{ ...s.pin, left: `${prompt.x}%`, top: `${prompt.y}%` }}>
                  <div style={{ ...s.pinDot, background: '#e65100' }} />
                  <div style={s.pinPrompt}>
                    <input
                      ref={inputRef}
                      value={labelText}
                      onChange={e => setLabelText(e.target.value)}
                      placeholder="Wpisz etykietę…"
                      style={s.pinInput}
                    />
                    <button onClick={confirmPin} disabled={!labelText.trim()} style={s.pinConfirm}>OK</button>
                    <button onClick={cancelPrompt} style={s.pinCancel}>✕</button>
                  </div>
                </div>
              )}
            </div>

            {/* Pin list */}
            {photo.imgPins.length > 0 && (
              <div style={s.pinList}>
                {photo.imgPins.map((pin, i) => (
                  <span key={i} style={s.pinChip}>
                    {pin.label} <em style={{ color: '#aaa', fontSize: '10px' }}>({pin.x}%, {pin.y}%)</em>
                    <button onClick={(e) => { e.stopPropagation(); removePin(i) }} style={s.chipRemove} title="Usuń">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Map tab ───────────────────────────────────────────────── */}
        {tab === 'map' && (
          <div style={s.mapArea}>
            <div style={{ ...s.hint, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span>Kliknij raz na mapie, żeby ustawić lokalizację pinezki dla tego zdjęcia</span>
              {photo.mapPin ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#2e7d32' }}>✓ [{photo.mapPin[1].toFixed(5)}, {photo.mapPin[0].toFixed(5)}]</span>
                  <button onClick={clearMapPin} style={s.clearMapBtn} title="Usuń pinezkę z mapy">✕ Wyczyść</button>
                </span>
              ) : (
                <span style={{ color: '#999' }}>Brak pinezki</span>
              )}
            </div>
            <div ref={mapElRef} style={s.mapEl} />
          </div>
        )}

      </main>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────

const s = {
  root: {
    display: 'flex',
    height: '100%',
    overflow: 'hidden',
    fontFamily: 'var(--font-sans, system-ui)',
    fontSize: '13px',
    color: 'var(--navy, #1a2942)',
    background: '#f7f4ef',
  },

  // Sidebar
  sidebar: {
    width: 220,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #ddd',
    background: '#fff',
    overflow: 'hidden',
  },
  sidebarHead: {
    padding: '14px 14px 10px',
    borderBottom: '1px solid #eee',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  sidebarTitle: { fontWeight: 700, fontSize: 14 },
  sidebarSub:   { fontSize: 11, color: '#888' },
  citySelect: {
    padding: '4px 6px',
    fontSize: 12,
    border: '1px solid #ccc',
    borderRadius: 3,
    background: '#fff',
    color: '#1a2942',
    cursor: 'pointer',
    outline: 'none',
  },
  thumbList: {
    overflowY: 'auto',
    flex: 1,
    padding: '6px 0',
  },
  thumbBtn: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    width: '100%',
    padding: '7px 10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    position: 'relative',
    borderLeft: '3px solid transparent',
  },
  thumbActive: {
    background: '#f0ebe0',
    borderLeftColor: '#b8963e',
  },
  thumbImg: {
    width: 48,
    height: 36,
    objectFit: 'cover',
    borderRadius: 2,
    flexShrink: 0,
    border: '1px solid #ddd',
  },
  thumbInfo: { flex: 1, minWidth: 0 },
  thumbName: { fontSize: 11, fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  thumbDate: { fontSize: 10, color: '#888', marginTop: 1 },
  thumbStatus: { fontSize: 10, marginTop: 3, display: 'flex' },
  checkmark: { position: 'absolute', top: 6, right: 8, color: '#2e7d32', fontSize: 13 },
  sidebarFoot: {
    padding: '10px 12px',
    borderTop: '1px solid #eee',
    flexShrink: 0,
  },
  exportBtn: {
    width: '100%',
    padding: '7px',
    background: '#1a2942',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.3px',
  },

  // Main
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  mainHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '10px 16px',
    borderBottom: '1px solid #ddd',
    background: '#fff',
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  mainTitle: { fontWeight: 700, fontSize: 15 },
  mainDate:  { color: '#888', fontSize: 13 },
  tabs: { display: 'flex', gap: 4, marginLeft: 'auto' },
  tab: {
    padding: '5px 14px',
    border: '1px solid #ccc',
    borderRadius: 4,
    background: 'none',
    cursor: 'pointer',
    fontSize: 12,
    color: '#555',
  },
  tabActive: {
    padding: '5px 14px',
    border: '1px solid #b8963e',
    borderRadius: 4,
    background: '#b8963e',
    cursor: 'pointer',
    fontSize: 12,
    color: '#fff',
    fontWeight: 600,
  },
  navBtns: { display: 'flex', gap: 6 },
  navBtn: {
    padding: '5px 12px',
    border: '1px solid #ddd',
    borderRadius: 4,
    background: 'none',
    cursor: 'pointer',
    fontSize: 12,
    color: '#555',
  },

  // Photo tab
  photoArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    padding: 16,
    gap: 12,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    background: '#fffde7',
    border: '1px solid #f9a825',
    borderRadius: 4,
    padding: '6px 12px',
    flexShrink: 0,
  },
  imgWrapper: {
    position: 'relative',
    display: 'inline-block',
    cursor: 'crosshair',
    userSelect: 'none',
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  img: {
    display: 'block',
    maxWidth: '100%',
    maxHeight: 'calc(100vh - 240px)',
    objectFit: 'contain',
    border: '1px solid #ddd',
    borderRadius: 2,
  },
  pin: {
    position: 'absolute',
    transform: 'translate(-50%, -100%)',
    zIndex: 10,
    pointerEvents: 'auto',
  },
  pinDot: {
    width: 10,
    height: 10,
    background: '#b8963e',
    border: '2px solid #fff',
    borderRadius: '50%',
    margin: '0 auto',
    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
  },
  pinLabel: {
    position: 'absolute',
    bottom: 14,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(26,41,66,0.92)',
    color: '#fff',
    padding: '3px 8px 3px 8px',
    borderRadius: 3,
    fontSize: 11,
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    pointerEvents: 'auto',
  },
  pinRemove: {
    background: 'none',
    border: 'none',
    color: '#aaa',
    cursor: 'pointer',
    padding: 0,
    fontSize: 10,
    lineHeight: 1,
  },
  pinPrompt: {
    position: 'absolute',
    bottom: 14,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#fff',
    border: '1px solid #b8963e',
    borderRadius: 4,
    padding: '6px 8px',
    display: 'flex',
    gap: 4,
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    zIndex: 20,
    whiteSpace: 'nowrap',
  },
  pinInput: {
    border: '1px solid #ccc',
    borderRadius: 3,
    padding: '3px 7px',
    fontSize: 12,
    width: 160,
    outline: 'none',
  },
  pinConfirm: {
    background: '#b8963e',
    color: '#fff',
    border: 'none',
    borderRadius: 3,
    padding: '3px 10px',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  },
  pinCancel: {
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: 3,
    padding: '3px 6px',
    cursor: 'pointer',
    fontSize: 11,
    color: '#888',
  },
  pinList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    flexShrink: 0,
  },
  pinChip: {
    background: '#1a2942',
    color: '#fff',
    padding: '3px 8px',
    borderRadius: 12,
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  chipRemove: {
    background: 'none',
    border: 'none',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: 10,
    padding: 0,
  },

  clearMapBtn: {
    background: 'none',
    border: '1px solid #c62828',
    borderRadius: 3,
    padding: '2px 8px',
    cursor: 'pointer',
    fontSize: 11,
    color: '#c62828',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },

  // Map tab
  mapArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    padding: '12px 16px 16px',
    gap: 10,
  },
  mapEl: {
    flex: 1,
    borderRadius: 4,
    border: '1px solid #ddd',
    overflow: 'hidden',
    cursor: 'crosshair',
  },
}
