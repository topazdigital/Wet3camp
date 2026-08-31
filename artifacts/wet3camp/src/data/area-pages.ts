export interface AreaPage {
  citySlug: string
  cityName: string
  slug: string
  name: string
  filterArea: string
  nearby: string[]
  description: string
  intro: string
}

const makeArea = (
  citySlug: string,
  cityName: string,
  slug: string,
  name: string,
  filterArea: string,
  nearby: string[],
  localContext: string,
): AreaPage => ({
  citySlug,
  cityName,
  slug,
  name,
  filterArea,
  nearby,
  description: `Browse public escort profiles in ${name}, ${cityName}. Compare services, availability and contact details on Wet3 Camp.`,
  intro: `${name} is one of the locations people search when looking for adult companionship in ${cityName}. This page brings together profiles that list ${name} as their current area, with public details to help adults compare options and contact providers directly. ${localContext}`,
})

export const AREA_PAGES: AreaPage[] = [
  makeArea('nairobi', 'Nairobi', 'westlands', 'Westlands', 'Westlands', ['Kilimani', 'Parklands', 'Gigiri'], 'Westlands is a major commercial and hospitality district in Nairobi.'),
  makeArea('nairobi', 'Nairobi', 'kilimani', 'Kilimani', 'Kilimani', ['Lavington', 'Hurlingham', 'Westlands'], 'Kilimani is a busy residential and business neighborhood close to Nairobi’s central districts.'),
  makeArea('nairobi', 'Nairobi', 'karen', 'Karen', 'Karen', ['Langata', 'Lavington', 'Runda'], 'Karen is a spacious southern Nairobi neighborhood known for residential stays and nearby attractions.'),
  makeArea('nairobi', 'Nairobi', 'lavington', 'Lavington', 'Lavington', ['Kilimani', 'Kileleshwa', 'Hurlingham'], 'Lavington sits between several established Nairobi residential and business neighborhoods.'),
  makeArea('nairobi', 'Nairobi', 'parklands', 'Parklands', 'Parklands', ['Westlands', 'Gigiri', 'CBD'], 'Parklands is a central Nairobi district with easy access to Westlands and the city centre.'),
  makeArea('nairobi', 'Nairobi', 'upper-hill', 'Upper Hill', 'Upper Hill', ['CBD', 'Kilimani', 'South C'], 'Upper Hill is a prominent Nairobi business district south of the CBD.'),
  makeArea('nairobi', 'Nairobi', 'gigiri', 'Gigiri', 'Gigiri', ['Runda', 'Parklands', 'Westlands'], 'Gigiri is a northern Nairobi district near major offices, residences and international institutions.'),
  makeArea('nairobi', 'Nairobi', 'runda', 'Runda', 'Runda', ['Gigiri', 'Rosslyn', 'Ruaka'], 'Runda is a northern Nairobi residential neighborhood with links to Gigiri and the Kiambu Road corridor.'),
  makeArea('nairobi', 'Nairobi', 'cbd', 'CBD', 'CBD', ['Parklands', 'Upper Hill', 'Westlands'], 'Nairobi CBD is the city’s central business district and a common reference point for visitors.'),
  makeArea('nairobi', 'Nairobi', 'south-b', 'South B', 'South B', ['South C', 'Langata', 'CBD'], 'South B is a residential area south of Nairobi CBD with access to major roads and the airport corridor.'),
  makeArea('nairobi', 'Nairobi', 'langata', 'Langata', 'Langata', ['Karen', 'South B', 'South C'], 'Langata is a southern Nairobi area connecting Karen, South B and nearby attractions.'),
  makeArea('nairobi', 'Nairobi', 'eastleigh', 'Eastleigh', 'Eastleigh', ['CBD', 'Pangani', 'Mathare'], 'Eastleigh is a busy inner-city Nairobi district with strong commercial activity.'),
  makeArea('nairobi', 'Nairobi', 'embakasi', 'Embakasi', 'Embakasi', ['Utawala', 'Syokimau', 'South B'], 'Embakasi is an eastern Nairobi area near the airport and major transport corridors.'),
  makeArea('nairobi', 'Nairobi', 'ngong-road', 'Ngong Road', 'Ngong Road', ['Kilimani', 'Lavington', 'Karen'], 'Ngong Road connects several southern and central Nairobi neighborhoods.'),
  makeArea('nairobi', 'Nairobi', 'thika-road', 'Thika Road', 'Thika Road', ['Kasarani', 'Roysambu', 'Ruaraka'], 'Thika Road is a major northern Nairobi transport corridor.'),
  makeArea('nairobi', 'Nairobi', 'nairobi-west', 'Nairobi West', 'Nairobi West', ['South B', 'Langata', 'CBD'], 'Nairobi West is a residential area west of the city centre.'),
  makeArea('nairobi', 'Nairobi', 'kasarani', 'Kasarani', 'Kasarani', ['Roysambu', 'Ruaraka', 'Thika Road'], 'Kasarani is a northern Nairobi residential and sports district.'),
  makeArea('nairobi', 'Nairobi', 'ruaka', 'Ruaka', 'Ruaka', ['Runda', 'Rosslyn', 'Gigiri'], 'Ruaka is a fast-growing area on the northern edge of Nairobi.'),
  makeArea('nairobi', 'Nairobi', 'kileleshwa', 'Kileleshwa', 'Kileleshwa', ['Lavington', 'Kilimani', 'Hurlingham'], 'Kileleshwa is a residential neighborhood between Kilimani and Lavington.'),
  makeArea('nairobi', 'Nairobi', 'hurlingham', 'Hurlingham', 'Hurlingham', ['Kilimani', 'Lavington', 'Upper Hill'], 'Hurlingham is a central Nairobi neighborhood near Kilimani and Upper Hill.'),
  makeArea('nairobi', 'Nairobi', 'spring-valley', 'Spring Valley', 'Spring Valley', ['Westlands', 'Loresho', 'Runda'], 'Spring Valley is a residential area adjoining Westlands and the northern suburbs.'),
  makeArea('nairobi', 'Nairobi', 'loresho', 'Loresho', 'Loresho', ['Spring Valley', 'Westlands', 'Runda'], 'Loresho is a western Nairobi residential neighborhood.'),
  makeArea('nairobi', 'Nairobi', 'muthaiga', 'Muthaiga', 'Muthaiga', ['Parklands', 'Gigiri', 'Runda'], 'Muthaiga is an established northern Nairobi residential neighborhood.'),
  makeArea('nairobi', 'Nairobi', 'ridgeways', 'Ridgeways', 'Ridgeways', ['Runda', 'Muthaiga', 'Kasarani'], 'Ridgeways is a northern Nairobi residential area near Thika Road.'),
  makeArea('nairobi', 'Nairobi', 'roysambu', 'Roysambu', 'Roysambu', ['Kasarani', 'Thika Road', 'Ruaraka'], 'Roysambu is a northern Nairobi neighborhood along the Thika Road corridor.'),
  makeArea('nairobi', 'Nairobi', 'zimmerman', 'Zimmerman', 'Zimmerman', ['Roysambu', 'Kasarani', 'Thika Road'], 'Zimmerman is a residential area in northern Nairobi.'),
  makeArea('nairobi', 'Nairobi', 'ruaraka', 'Ruaraka', 'Ruaraka', ['Westlands', 'Roysambu', 'Kasarani'], 'Ruaraka is an industrial and residential area north-east of central Nairobi.'),
  makeArea('nairobi', 'Nairobi', 'buru-buru', 'Buru Buru', 'Buru Buru', ['Eastleigh', 'Embakasi', 'CBD'], 'Buru Buru is an established residential estate in eastern Nairobi.'),
  makeArea('nairobi', 'Nairobi', 'mwiki', 'Mwiki', 'Mwiki', ['Kasarani', 'Roysambu', 'Zimmerman'], 'Mwiki is a north-eastern Nairobi residential area.'),
  makeArea('nairobi', 'Nairobi', 'outering', 'Outering', 'Outering', ['Eastleigh', 'Buru Buru', 'Embakasi'], 'Outering is a major eastern Nairobi road corridor and neighborhood reference.'),
  makeArea('nairobi', 'Nairobi', 'juja', 'Juja', 'Juja', ['Thika Road', 'Roysambu', 'Ruaraka'], 'Juja is a town on the northern Nairobi–Kiambu corridor.'),
  makeArea('nairobi', 'Nairobi', 'ongata-rongai', 'Ongata Rongai', 'Ongata Rongai', ['Karen', 'Langata', 'Kitengela'], 'Ongata Rongai is a growing town south of Nairobi near Karen and Langata.'),
  makeArea('nairobi', 'Nairobi', 'kitengela', 'Kitengela', 'Kitengela', ['Ongata Rongai', 'Syokimau', 'Embakasi'], 'Kitengela is a growing town south-east of Nairobi.'),
  makeArea('nairobi', 'Nairobi', 'syokimau', 'Syokimau', 'Syokimau', ['Embakasi', 'Kitengela', 'Utawala'], 'Syokimau is a residential area near the airport and Nairobi’s south-eastern edge.'),
  makeArea('nairobi', 'Nairobi', 'utawala', 'Utawala', 'Utawala', ['Embakasi', 'Syokimau', 'Mwiki'], 'Utawala is an eastern Nairobi residential area near the airport corridor.'),
  makeArea('nairobi', 'Nairobi', 'kahawa', 'Kahawa', 'Kahawa', ['Roysambu', 'Zimmerman', 'Kasarani'], 'Kahawa is a northern Nairobi area along the Thika Road corridor.'),
  makeArea('nairobi', 'Nairobi', 'kariobangi', 'Kariobangi', 'Kariobangi', ['Mathare', 'Eastleigh', 'Outering'], 'Kariobangi is an eastern Nairobi residential area.'),
  makeArea('nairobi', 'Nairobi', 'mathare', 'Mathare', 'Mathare', ['Eastleigh', 'Kariobangi', 'CBD'], 'Mathare is an inner-city Nairobi area north-east of the CBD.'),
  makeArea('nairobi', 'Nairobi', 'kayole', 'Kayole', 'Kayole', ['Embakasi', 'Buru Buru', 'Outering'], 'Kayole is an eastern Nairobi residential area.'),
  makeArea('nairobi', 'Nairobi', 'dandora', 'Dandora', 'Dandora', ['Kayole', 'Buru Buru', 'Outering'], 'Dandora is an eastern Nairobi residential area near the Outering corridor.'),
  makeArea('nairobi', 'Nairobi', 'githurai', 'Githurai', 'Githurai', ['Kahawa', 'Roysambu', 'Kasarani'], 'Githurai is a town north of Nairobi along the Thika Road corridor.'),
  makeArea('nairobi', 'Nairobi', 'clay-city', 'Clay City', 'Clay City', ['Kasarani', 'Mwiki', 'Roysambu'], 'Clay City is a north-eastern Nairobi residential area.'),
  makeArea('nairobi', 'Nairobi', 'kahawa-west', 'Kahawa West', 'Kahawa West', ['Kahawa', 'Zimmerman', 'Roysambu'], 'Kahawa West is a northern Nairobi residential area.'),
  makeArea('nairobi', 'Nairobi', 'kamiti-road', 'Kamiti Road', 'Kamiti Road', ['Roysambu', 'Kasarani', 'Kahawa'], 'Kamiti Road is a northern Nairobi corridor linking residential neighborhoods.'),
  makeArea('nairobi', 'Nairobi', 'rosslyn', 'Rosslyn', 'Rosslyn', ['Runda', 'Ruaka', 'Gigiri'], 'Rosslyn is a northern Nairobi residential and commercial area.'),
  makeArea('mombasa', 'Mombasa', 'nyali', 'Nyali', 'Nyali', ['Bamburi', 'Mombasa CBD', 'Shanzu'], 'Nyali is a coastal residential and hospitality area north of Mombasa Island.'),
  makeArea('mombasa', 'Mombasa', 'bamburi', 'Bamburi', 'Bamburi', ['Nyali', 'Shanzu', 'Mtwapa'], 'Bamburi is a popular north-coast area with residential, beach and hospitality activity.'),
  makeArea('mombasa', 'Mombasa', 'diani', 'Diani', 'Diani', ['Mombasa', 'Nyali', 'Likoni'], 'Diani is a south-coast beach destination frequently searched by visitors planning coastal stays.'),
  makeArea('mombasa', 'Mombasa', 'mtwapa', 'Mtwapa', 'Mtwapa', ['Bamburi', 'Nyali', 'Shanzu'], 'Mtwapa is a north-coast town connected to Bamburi, Shanzu and the wider Mombasa area.'),
  makeArea('mombasa', 'Mombasa', 'tudor', 'Tudor', 'Tudor', ['Mombasa CBD', 'Nyali', 'Likoni'], 'Tudor is a residential area close to Mombasa Island and the city’s central districts.'),
  makeArea('mombasa', 'Mombasa', 'likoni', 'Likoni', 'Likoni', ['Diani', 'Mombasa CBD', 'Tudor'], 'Likoni is on the south side of Mombasa and provides access toward the south-coast destinations.'),
  makeArea('mombasa', 'Mombasa', 'kisauni', 'Kisauni', 'Kisauni', ['Nyali', 'Bamburi', 'Mombasa CBD'], 'Kisauni is a northern Mombasa constituency adjoining Nyali and Bamburi.'),
  makeArea('mombasa', 'Mombasa', 'mombasa-cbd', 'Mombasa CBD', 'cbd', ['Tudor', 'Nyali', 'Likoni'], 'Mombasa CBD is the historic commercial centre on Mombasa Island.'),
  makeArea('mombasa', 'Mombasa', 'shanzu', 'Shanzu', 'Shanzu', ['Nyali', 'Bamburi', 'Mtwapa'], 'Shanzu is a north-coast beach and residential area near Mombasa.'),
  makeArea('kisumu', 'Kisumu', 'milimani', 'Milimani', 'Milimani', ['Mega City', 'Kisumu CBD', 'Mamboleo'], 'Milimani is a central Kisumu neighborhood near offices, services and the lakefront.'),
  makeArea('kisumu', 'Kisumu', 'mega-city', 'Mega City', 'Mega City', ['Milimani', 'Kisumu CBD', 'Mamboleo'], 'Mega City is a recognizable shopping and residential area in Kisumu.'),
  makeArea('kisumu', 'Kisumu', 'kisumu-cbd', 'Kisumu CBD', 'cbd', ['Milimani', 'Mega City', 'Mamboleo'], 'Kisumu CBD is the city’s central business district and a reference point for visitors.'),
  makeArea('kisumu', 'Kisumu', 'mamboleo', 'Mamboleo', 'Mamboleo', ['Milimani', 'Mega City', 'Kondele'], 'Mamboleo is a growing eastern Kisumu neighborhood along the main road corridors.'),
  makeArea('kisumu', 'Kisumu', 'kondele', 'Kondele', 'Kondele', ['Mamboleo', 'Kisumu CBD', 'Milimani'], 'Kondele is a well-known Kisumu neighborhood east of the central business district.'),
  makeArea('kisumu', 'Kisumu', 'nyalenda', 'Nyalenda', 'Nyalenda', ['Kisumu CBD', 'Milimani', 'Mamboleo'], 'Nyalenda is a residential area south of Kisumu’s central districts.'),
  makeArea('kisumu', 'Kisumu', 'kolwa', 'Kolwa', 'Kolwa', ['Mamboleo', 'Nyalenda', 'Kisumu CBD'], 'Kolwa is an area on the wider Kisumu urban edge.'),
  makeArea('kisumu', 'Kisumu', 'riat', 'Riat', 'Riat', ['Mamboleo', 'Milimani', 'Kisumu CBD'], 'Riat is a residential area in the wider Kisumu area.'),
  makeArea('kisumu', 'Kisumu', 'airport', 'Airport', 'Airport', ['Mamboleo', 'Milimani', 'Kisumu CBD'], 'The Kisumu airport area is a useful location reference for visitors.'),
  makeArea('nakuru', 'Nakuru', 'milimani', 'Milimani', 'Milimani', ['Nakuru CBD', 'Section 58', 'Lanet'], 'Milimani is a central Nakuru neighborhood close to the CBD and major roads.'),
  makeArea('nakuru', 'Nakuru', 'nakuru-cbd', 'Nakuru CBD', 'cbd', ['Milimani', 'Section 58', 'Lanet'], 'Nakuru CBD is the city’s central commercial district and a common visitor reference point.'),
  makeArea('nakuru', 'Nakuru', 'section-58', 'Section 58', 'Section 58', ['Milimani', 'Nakuru CBD', 'Lanet'], 'Section 58 is an established residential area in Nakuru near the central districts.'),
  makeArea('nakuru', 'Nakuru', 'lanet', 'Lanet', 'Lanet', ['Milimani', 'Section 58', 'Nakuru CBD'], 'Lanet is a southern Nakuru area with access to the Nairobi–Nakuru corridor.'),
  makeArea('nakuru', 'Nakuru', 'pipeline', 'Pipeline', 'Pipeline', ['Nakuru CBD', 'Lanet', 'Milimani'], 'Pipeline is a residential and transport-connected area of Nakuru.'),
  makeArea('nakuru', 'Nakuru', 'shabab', 'Shabab', 'Shabab', ['Nakuru CBD', 'Milimani', 'Pipeline'], 'Shabab is a Nakuru neighborhood close to the city’s central and residential areas.'),
  makeArea('nakuru', 'Nakuru', 'bahati', 'Bahati', 'Bahati', ['Nakuru CBD', 'Milimani', 'Lanet'], 'Bahati is an area on the wider Nakuru urban edge.'),
  makeArea('nakuru', 'Nakuru', 'bondeni', 'Bondeni', 'Bondeni', ['Nakuru CBD', 'Milimani', 'Section 58'], 'Bondeni is a neighborhood close to Nakuru’s central districts.'),
  makeArea('nakuru', 'Nakuru', 'free-area', 'Free Area', 'Free Area', ['Nakuru CBD', 'Pipeline', 'Milimani'], 'Free Area is a residential neighborhood in Nakuru.'),
  makeArea('eldoret', 'Eldoret', 'elgon-view', 'Elgon View', 'Elgon View', ['Pioneer', 'Elgon Road', 'Eldoret CBD'], 'Elgon View is a well-known residential area in Eldoret.'),
  makeArea('eldoret', 'Eldoret', 'elgon-road', 'Elgon Road', 'Elgon Road', ['Elgon View', 'Pioneer', 'Eldoret CBD'], 'Elgon Road connects established residential areas with Eldoret’s central districts.'),
  makeArea('eldoret', 'Eldoret', 'pioneer', 'Pioneer', 'Pioneer', ['Elgon View', 'Elgon Road', 'Eldoret CBD'], 'Pioneer is a residential area near Eldoret’s central business and transport routes.'),
  makeArea('eldoret', 'Eldoret', 'eldoret-cbd', 'Eldoret CBD', 'cbd', ['Pioneer', 'Elgon View', 'Huruma'], 'Eldoret CBD is the city’s central commercial district.'),
  makeArea('eldoret', 'Eldoret', 'huruma', 'Huruma', 'Huruma', ['Eldoret CBD', 'Pioneer', 'Langas'], 'Huruma is a residential area within the wider Eldoret urban area.'),
  makeArea('eldoret', 'Eldoret', 'langas', 'Langas', 'Langas', ['Huruma', 'Eldoret CBD', 'Pioneer'], 'Langas is a southern Eldoret neighborhood connected to the city centre.'),
  makeArea('eldoret', 'Eldoret', 'kipkorir', 'Kipkorir', 'Kipkorir', ['Elgon View', 'Pioneer', 'Eldoret CBD'], 'Kipkorir is a neighborhood reference within the wider Eldoret area.'),
  makeArea('eldoret', 'Eldoret', 'kapsabet', 'Kapsabet', 'Kapsabet', ['Eldoret CBD', 'Pioneer', 'Elgon View'], 'Kapsabet is a nearby western Kenya town sometimes used in regional location searches.'),
]

export function getAreaPage(citySlug: string, areaSlug: string): AreaPage | undefined {
  return AREA_PAGES.find(page => page.citySlug === citySlug && page.slug === areaSlug)
}

export function areaSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function getAreaPagesForCity(citySlug: string): AreaPage[] {
  return AREA_PAGES.filter(page => page.citySlug === citySlug)
}