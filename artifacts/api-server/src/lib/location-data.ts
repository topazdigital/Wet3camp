export interface AreaLandingPage {
  citySlug: string
  cityName: string
  slug: string
  name: string
  filterValues: string[]
  nearby: string[]
  description: string
  intro: string
}

const normalize = (value: unknown) =>
  String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')

export const CITY_AREA_VALUES: Record<string, string[]> = {
  nairobi: ['nairobi', 'nairobi cbd', 'westlands', 'karen', 'kilimani', 'lavington', 'parklands', 'upperhill', 'upper hill', 'langata', 'south b', 'south c', 'gigiri', 'runda', 'eastleigh', 'embakasi', 'ngong road', 'thika road', 'nairobi west', 'kasarani', 'ruaka', 'kileleshwa', 'hurlingham', 'spring valley', 'loresho', 'muthaiga', 'ridgeways', 'roysambu', 'zimmerman', 'ruaraka', 'buru buru', 'mwiki', 'outering', 'juja', 'ongata rongai', 'kitengela', 'syokimau', 'utawala', 'kahawa', 'kariobangi', 'mathare', 'kayole', 'dandora', 'githurai', 'clay city', 'kahawa west', 'kamiti road'],
  mombasa: ['mombasa', 'mombasa cbd', 'nyali', 'bamburi', 'diani', 'diani beach', 'mtwapa', 'tudor', 'likoni', 'kisauni', 'shanzu', 'malindi', 'watamu', 'kilifi'],
  kisumu: ['kisumu', 'kisumu cbd', 'milimani', 'mega city', 'mamboleo', 'kondele', 'nyalenda', 'kolwa', 'riat', 'airport'],
  nakuru: ['nakuru', 'nakuru cbd', 'milimani nakuru', 'lanet', 'section 58', 'bahati', 'bondeni', 'free area'],
  eldoret: ['eldoret', 'eldoret cbd', 'elgon view', 'elgon road', 'kipkorir', 'pioneer', 'huruma', 'langas', 'kapsabet'],
}

function makeArea(
  citySlug: string,
  cityName: string,
  slug: string,
  name: string,
  filterValues: string[],
  nearby: string[],
  localContext: string,
): AreaLandingPage {
  return {
    citySlug,
    cityName,
    slug,
    name,
    filterValues,
    nearby,
    description: `Browse public escort profiles in ${name}, ${cityName}. Compare services, availability and contact details on Wet3 Camp.`,
    intro: `${name} is one of the locations people search when looking for adult companionship in ${cityName}. This page brings together profiles that list ${name} as their current area, with public details to help adults compare options and contact providers directly. ${localContext}`,
  }
}

export const AREA_LANDING_PAGES: AreaLandingPage[] = [
  makeArea('nairobi', 'Nairobi', 'westlands', 'Westlands', ['westlands'], ['Kilimani', 'Parklands', 'Gigiri'], 'Westlands is a major commercial and hospitality district in Nairobi.'),
  makeArea('nairobi', 'Nairobi', 'kilimani', 'Kilimani', ['kilimani'], ['Lavington', 'Hurlingham', 'Westlands'], 'Kilimani is a busy residential and business neighborhood close to Nairobi’s central districts.'),
  makeArea('nairobi', 'Nairobi', 'karen', 'Karen', ['karen'], ['Langata', 'Lavington', 'Runda'], 'Karen is a spacious southern Nairobi neighborhood known for residential stays and nearby attractions.'),
  makeArea('nairobi', 'Nairobi', 'lavington', 'Lavington', ['lavington'], ['Kilimani', 'Kileleshwa', 'Hurlingham'], 'Lavington sits between several established Nairobi residential and business neighborhoods.'),
  makeArea('nairobi', 'Nairobi', 'parklands', 'Parklands', ['parklands'], ['Westlands', 'Gigiri', 'CBD'], 'Parklands is a central Nairobi district with easy access to Westlands and the city centre.'),
  makeArea('nairobi', 'Nairobi', 'upper-hill', 'Upper Hill', ['upper hill', 'upperhill'], ['CBD', 'Kilimani', 'South C'], 'Upper Hill is a prominent Nairobi business district south of the CBD.'),
  makeArea('nairobi', 'Nairobi', 'gigiri', 'Gigiri', ['gigiri'], ['Runda', 'Parklands', 'Westlands'], 'Gigiri is a northern Nairobi district near major offices, residences and international institutions.'),
  makeArea('nairobi', 'Nairobi', 'runda', 'Runda', ['runda'], ['Gigiri', 'Rosslyn', 'Ruaka'], 'Runda is a northern Nairobi residential neighborhood with links to Gigiri and the Kiambu Road corridor.'),
  makeArea('nairobi', 'Nairobi', 'cbd', 'CBD', ['cbd', 'nairobi cbd'], ['Parklands', 'Upper Hill', 'Westlands'], 'Nairobi CBD is the city’s central business district and a common reference point for visitors.'),
  makeArea('nairobi', 'Nairobi', 'south-b', 'South B', ['south b'], ['South C', 'Langata', 'CBD'], 'South B is a residential area south of Nairobi CBD with access to major roads and the airport corridor.'),
  makeArea('nairobi', 'Nairobi', 'langata', 'Langata', ['langata'], ['Karen', 'South B', 'South C'], 'Langata is a southern Nairobi area connecting Karen, South B and nearby attractions.'),
  makeArea('nairobi', 'Nairobi', 'eastleigh', 'Eastleigh', ['eastleigh'], ['CBD', 'Pangani', 'Mathare'], 'Eastleigh is a busy inner-city Nairobi district with strong commercial activity.'),
  makeArea('nairobi', 'Nairobi', 'embakasi', 'Embakasi', ['embakasi'], ['Utawala', 'Syokimau', 'South B'], 'Embakasi is an eastern Nairobi area near the airport and major transport corridors.'),
  makeArea('nairobi', 'Nairobi', 'ngong-road', 'Ngong Road', ['ngong road'], ['Kilimani', 'Lavington', 'Karen'], 'Ngong Road connects several southern and central Nairobi neighborhoods.'),
  makeArea('nairobi', 'Nairobi', 'thika-road', 'Thika Road', ['thika road'], ['Kasarani', 'Roysambu', 'Ruaraka'], 'Thika Road is a major northern Nairobi transport corridor.'),
  makeArea('nairobi', 'Nairobi', 'nairobi-west', 'Nairobi West', ['nairobi west'], ['South B', 'Langata', 'CBD'], 'Nairobi West is a residential area west of the city centre.'),
  makeArea('nairobi', 'Nairobi', 'kasarani', 'Kasarani', ['kasarani'], ['Roysambu', 'Ruaraka', 'Thika Road'], 'Kasarani is a northern Nairobi residential and sports district.'),
  makeArea('nairobi', 'Nairobi', 'ruaka', 'Ruaka', ['ruaka'], ['Runda', 'Rosslyn', 'Gigiri'], 'Ruaka is a fast-growing area on the northern edge of Nairobi.'),
  makeArea('nairobi', 'Nairobi', 'kileleshwa', 'Kileleshwa', ['kileleshwa'], ['Lavington', 'Kilimani', 'Hurlingham'], 'Kileleshwa is a residential neighborhood between Kilimani and Lavington.'),
  makeArea('nairobi', 'Nairobi', 'hurlingham', 'Hurlingham', ['hurlingham'], ['Kilimani', 'Lavington', 'Upper Hill'], 'Hurlingham is a central Nairobi neighborhood near Kilimani and Upper Hill.'),
  makeArea('nairobi', 'Nairobi', 'spring-valley', 'Spring Valley', ['spring valley'], ['Westlands', 'Loresho', 'Runda'], 'Spring Valley is a residential area adjoining Westlands and the northern suburbs.'),
  makeArea('nairobi', 'Nairobi', 'loresho', 'Loresho', ['loresho'], ['Spring Valley', 'Westlands', 'Runda'], 'Loresho is a western Nairobi residential neighborhood.'),
  makeArea('nairobi', 'Nairobi', 'muthaiga', 'Muthaiga', ['muthaiga'], ['Parklands', 'Gigiri', 'Runda'], 'Muthaiga is an established northern Nairobi residential neighborhood.'),
  makeArea('nairobi', 'Nairobi', 'ridgeways', 'Ridgeways', ['ridgeways'], ['Runda', 'Muthaiga', 'Kasarani'], 'Ridgeways is a northern Nairobi residential area near Thika Road.'),
  makeArea('nairobi', 'Nairobi', 'roysambu', 'Roysambu', ['roysambu'], ['Kasarani', 'Thika Road', 'Ruaraka'], 'Roysambu is a northern Nairobi neighborhood along the Thika Road corridor.'),
  makeArea('nairobi', 'Nairobi', 'zimmerman', 'Zimmerman', ['zimmerman'], ['Roysambu', 'Kasarani', 'Thika Road'], 'Zimmerman is a residential area in northern Nairobi.'),
  makeArea('nairobi', 'Nairobi', 'ruaraka', 'Ruaraka', ['ruaraka'], ['Westlands', 'Roysambu', 'Kasarani'], 'Ruaraka is an industrial and residential area north-east of central Nairobi.'),
  makeArea('nairobi', 'Nairobi', 'buru-buru', 'Buru Buru', ['buru buru'], ['Eastleigh', 'Embakasi', 'CBD'], 'Buru Buru is an established residential estate in eastern Nairobi.'),
  makeArea('nairobi', 'Nairobi', 'mwiki', 'Mwiki', ['mwiki'], ['Kasarani', 'Roysambu', 'Zimmerman'], 'Mwiki is a north-eastern Nairobi residential area.'),
  makeArea('nairobi', 'Nairobi', 'outering', 'Outering', ['outering'], ['Eastleigh', 'Buru Buru', 'Embakasi'], 'Outering is a major eastern Nairobi road corridor and neighborhood reference.'),
  makeArea('nairobi', 'Nairobi', 'juja', 'Juja', ['juja'], ['Thika Road', 'Roysambu', 'Ruaraka'], 'Juja is a town on the northern Nairobi–Kiambu corridor.'),
  makeArea('nairobi', 'Nairobi', 'ongata-rongai', 'Ongata Rongai', ['ongata rongai'], ['Karen', 'Langata', 'Kitengela'], 'Ongata Rongai is a growing town south of Nairobi near Karen and Langata.'),
  makeArea('nairobi', 'Nairobi', 'kitengela', 'Kitengela', ['kitengela'], ['Ongata Rongai', 'Syokimau', 'Embakasi'], 'Kitengela is a growing town south-east of Nairobi.'),
  makeArea('nairobi', 'Nairobi', 'syokimau', 'Syokimau', ['syokimau'], ['Embakasi', 'Kitengela', 'Utawala'], 'Syokimau is a residential area near the airport and Nairobi’s south-eastern edge.'),
  makeArea('nairobi', 'Nairobi', 'utawala', 'Utawala', ['utawala'], ['Embakasi', 'Syokimau', 'Mwiki'], 'Utawala is an eastern Nairobi residential area near the airport corridor.'),
  makeArea('nairobi', 'Nairobi', 'kahawa', 'Kahawa', ['kahawa'], ['Roysambu', 'Zimmerman', 'Kasarani'], 'Kahawa is a northern Nairobi area along the Thika Road corridor.'),
  makeArea('nairobi', 'Nairobi', 'kariobangi', 'Kariobangi', ['kariobangi'], ['Mathare', 'Eastleigh', 'Outering'], 'Kariobangi is an eastern Nairobi residential area.'),
  makeArea('nairobi', 'Nairobi', 'mathare', 'Mathare', ['mathare'], ['Eastleigh', 'Kariobangi', 'CBD'], 'Mathare is an inner-city Nairobi area north-east of the CBD.'),
  makeArea('nairobi', 'Nairobi', 'kayole', 'Kayole', ['kayole'], ['Embakasi', 'Buru Buru', 'Outering'], 'Kayole is an eastern Nairobi residential area.'),
  makeArea('nairobi', 'Nairobi', 'dandora', 'Dandora', ['dandora'], ['Kayole', 'Buru Buru', 'Outering'], 'Dandora is an eastern Nairobi residential area near the Outering corridor.'),
  makeArea('nairobi', 'Nairobi', 'githurai', 'Githurai', ['githurai'], ['Kahawa', 'Roysambu', 'Kasarani'], 'Githurai is a town north of Nairobi along the Thika Road corridor.'),
  makeArea('nairobi', 'Nairobi', 'clay-city', 'Clay City', ['clay city'], ['Kasarani', 'Mwiki', 'Roysambu'], 'Clay City is a north-eastern Nairobi residential area.'),
  makeArea('nairobi', 'Nairobi', 'kahawa-west', 'Kahawa West', ['kahawa west'], ['Kahawa', 'Zimmerman', 'Roysambu'], 'Kahawa West is a northern Nairobi residential area.'),
  makeArea('nairobi', 'Nairobi', 'kamiti-road', 'Kamiti Road', ['kamiti road'], ['Roysambu', 'Kasarani', 'Kahawa'], 'Kamiti Road is a northern Nairobi corridor linking residential neighborhoods.'),
  makeArea('nairobi', 'Nairobi', 'rosslyn', 'Rosslyn', ['rosslyn'], ['Runda', 'Ruaka', 'Gigiri'], 'Rosslyn is a northern Nairobi residential and commercial area.'),

  makeArea('mombasa', 'Mombasa', 'nyali', 'Nyali', ['nyali'], ['Bamburi', 'Mombasa CBD', 'Shanzu'], 'Nyali is a coastal residential and hospitality area north of Mombasa Island.'),
  makeArea('mombasa', 'Mombasa', 'bamburi', 'Bamburi', ['bamburi'], ['Nyali', 'Shanzu', 'Mtwapa'], 'Bamburi is a popular north-coast area with residential, beach and hospitality activity.'),
  makeArea('mombasa', 'Mombasa', 'diani', 'Diani', ['diani', 'diani beach'], ['Mombasa', 'Nyali', 'Likoni'], 'Diani is a south-coast beach destination frequently searched by visitors planning coastal stays.'),
  makeArea('mombasa', 'Mombasa', 'mtwapa', 'Mtwapa', ['mtwapa'], ['Bamburi', 'Nyali', 'Shanzu'], 'Mtwapa is a north-coast town connected to Bamburi, Shanzu and the wider Mombasa area.'),
  makeArea('mombasa', 'Mombasa', 'tudor', 'Tudor', ['tudor'], ['Mombasa CBD', 'Nyali', 'Likoni'], 'Tudor is a residential area close to Mombasa Island and the city’s central districts.'),
  makeArea('mombasa', 'Mombasa', 'likoni', 'Likoni', ['likoni'], ['Diani', 'Mombasa CBD', 'Tudor'], 'Likoni is on the south side of Mombasa and provides access toward the south-coast destinations.'),
  makeArea('mombasa', 'Mombasa', 'kisauni', 'Kisauni', ['kisauni'], ['Nyali', 'Bamburi', 'Mombasa CBD'], 'Kisauni is a northern Mombasa constituency adjoining Nyali and Bamburi.'),
  makeArea('mombasa', 'Mombasa', 'mombasa-cbd', 'Mombasa CBD', ['mombasa cbd', 'cbd'], ['Tudor', 'Nyali', 'Likoni'], 'Mombasa CBD is the historic commercial centre on Mombasa Island.'),
  makeArea('mombasa', 'Mombasa', 'shanzu', 'Shanzu', ['shanzu'], ['Nyali', 'Bamburi', 'Mtwapa'], 'Shanzu is a north-coast beach and residential area near Mombasa.'),

  makeArea('kisumu', 'Kisumu', 'milimani', 'Milimani', ['milimani'], ['Mega City', 'Kisumu CBD', 'Mamboleo'], 'Milimani is a central Kisumu neighborhood near offices, services and the lakefront.'),
  makeArea('kisumu', 'Kisumu', 'mega-city', 'Mega City', ['mega city'], ['Milimani', 'Kisumu CBD', 'Mamboleo'], 'Mega City is a recognizable shopping and residential area in Kisumu.'),
  makeArea('kisumu', 'Kisumu', 'kisumu-cbd', 'Kisumu CBD', ['kisumu cbd', 'cbd'], ['Milimani', 'Mega City', 'Mamboleo'], 'Kisumu CBD is the city’s central business district and a reference point for visitors.'),
  makeArea('kisumu', 'Kisumu', 'mamboleo', 'Mamboleo', ['mamboleo'], ['Milimani', 'Mega City', 'Kondele'], 'Mamboleo is a growing eastern Kisumu neighborhood along the main road corridors.'),
  makeArea('kisumu', 'Kisumu', 'kondele', 'Kondele', ['kondele'], ['Mamboleo', 'Kisumu CBD', 'Milimani'], 'Kondele is a well-known Kisumu neighborhood east of the central business district.'),
  makeArea('kisumu', 'Kisumu', 'nyalenda', 'Nyalenda', ['nyalenda'], ['Kisumu CBD', 'Milimani', 'Mamboleo'], 'Nyalenda is a residential area south of Kisumu’s central districts.'),
  makeArea('kisumu', 'Kisumu', 'kolwa', 'Kolwa', ['kolwa'], ['Mamboleo', 'Nyalenda', 'Kisumu CBD'], 'Kolwa is an area on the wider Kisumu urban edge.'),
  makeArea('kisumu', 'Kisumu', 'riat', 'Riat', ['riat'], ['Mamboleo', 'Milimani', 'Kisumu CBD'], 'Riat is a residential area in the wider Kisumu area.'),
  makeArea('kisumu', 'Kisumu', 'airport', 'Airport', ['airport'], ['Mamboleo', 'Milimani', 'Kisumu CBD'], 'The Kisumu airport area is a useful location reference for visitors.'),

  makeArea('nakuru', 'Nakuru', 'milimani', 'Milimani', ['milimani', 'milimani nakuru'], ['Nakuru CBD', 'Section 58', 'Lanet'], 'Milimani is a central Nakuru neighborhood close to the CBD and major roads.'),
  makeArea('nakuru', 'Nakuru', 'nakuru-cbd', 'Nakuru CBD', ['nakuru cbd', 'cbd'], ['Milimani', 'Section 58', 'Lanet'], 'Nakuru CBD is the city’s central commercial district and a common visitor reference point.'),
  makeArea('nakuru', 'Nakuru', 'section-58', 'Section 58', ['section 58'], ['Milimani', 'Nakuru CBD', 'Lanet'], 'Section 58 is an established residential area in Nakuru near the central districts.'),
  makeArea('nakuru', 'Nakuru', 'lanet', 'Lanet', ['lanet'], ['Milimani', 'Section 58', 'Nakuru CBD'], 'Lanet is a southern Nakuru area with access to the Nairobi–Nakuru corridor.'),
  makeArea('nakuru', 'Nakuru', 'pipeline', 'Pipeline', ['pipeline'], ['Nakuru CBD', 'Lanet', 'Milimani'], 'Pipeline is a residential and transport-connected area of Nakuru.'),
  makeArea('nakuru', 'Nakuru', 'shabab', 'Shabab', ['shabab'], ['Nakuru CBD', 'Milimani', 'Pipeline'], 'Shabab is a Nakuru neighborhood close to the city’s central and residential areas.'),
  makeArea('nakuru', 'Nakuru', 'bahati', 'Bahati', ['bahati'], ['Nakuru CBD', 'Milimani', 'Lanet'], 'Bahati is an area on the wider Nakuru urban edge.'),
  makeArea('nakuru', 'Nakuru', 'bondeni', 'Bondeni', ['bondeni'], ['Nakuru CBD', 'Milimani', 'Section 58'], 'Bondeni is a neighborhood close to Nakuru’s central districts.'),
  makeArea('nakuru', 'Nakuru', 'free-area', 'Free Area', ['free area'], ['Nakuru CBD', 'Pipeline', 'Milimani'], 'Free Area is a residential neighborhood in Nakuru.'),

  makeArea('eldoret', 'Eldoret', 'elgon-view', 'Elgon View', ['elgon view'], ['Pioneer', 'Elgon Road', 'Eldoret CBD'], 'Elgon View is a well-known residential area in Eldoret.'),
  makeArea('eldoret', 'Eldoret', 'elgon-road', 'Elgon Road', ['elgon road'], ['Elgon View', 'Pioneer', 'Eldoret CBD'], 'Elgon Road connects established residential areas with Eldoret’s central districts.'),
  makeArea('eldoret', 'Eldoret', 'pioneer', 'Pioneer', ['pioneer'], ['Elgon View', 'Elgon Road', 'Eldoret CBD'], 'Pioneer is a residential area near Eldoret’s central business and transport routes.'),
  makeArea('eldoret', 'Eldoret', 'eldoret-cbd', 'Eldoret CBD', ['eldoret cbd', 'cbd'], ['Pioneer', 'Elgon View', 'Huruma'], 'Eldoret CBD is the city’s central commercial district.'),
  makeArea('eldoret', 'Eldoret', 'huruma', 'Huruma', ['huruma'], ['Eldoret CBD', 'Pioneer', 'Langas'], 'Huruma is a residential area within the wider Eldoret urban area.'),
  makeArea('eldoret', 'Eldoret', 'langas', 'Langas', ['langas'], ['Huruma', 'Eldoret CBD', 'Pioneer'], 'Langas is a southern Eldoret neighborhood connected to the city centre.'),
  makeArea('eldoret', 'Eldoret', 'kipkorir', 'Kipkorir', ['kipkorir'], ['Elgon View', 'Pioneer', 'Eldoret CBD'], 'Kipkorir is a neighborhood reference within the wider Eldoret area.'),
  makeArea('eldoret', 'Eldoret', 'kapsabet', 'Kapsabet', ['kapsabet'], ['Eldoret CBD', 'Pioneer', 'Elgon View'], 'Kapsabet is a nearby western Kenya town sometimes used in regional location searches.'),
]

export function getAreaLandingPage(citySlug: string, areaSlug: string): AreaLandingPage | undefined {
  return AREA_LANDING_PAGES.find(page => page.citySlug === citySlug && page.slug === areaSlug)
}

export function isAreaRowMatch(page: AreaLandingPage, row: { city?: unknown; area?: unknown }): boolean {
  const cityValue = normalize(row.city)
  const areaValue = normalize(row.area)
  const cityValues = CITY_AREA_VALUES[page.citySlug] ?? [normalize(page.cityName)]
  const belongsToCity = cityValues.includes(cityValue) || cityValue === normalize(page.cityName)
  const matchesArea = page.filterValues.some(value => {
    const normalizedValue = normalize(value)
    return normalizedValue === areaValue || normalizedValue === cityValue
  })
  return belongsToCity && matchesArea
}