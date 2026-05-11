# SERP Audit — Why pos 1 = 0 clicks (2026-05-10)

Mobile SERP for Phoenix,Arizona. Top **10** impression-losers from
GSC where we have ≥200 impressions and 0 clicks in the last 28 days.

For each query we capture: every SERP feature present, the features ranked
ABOVE our organic listing (the actual click-stealers), and our true organic
position. **GSC position 1.x can hide everything above the organic block.**

---

## Per-query breakdown

### `personal injury lawyer`

- **GSC**: 4183 impressions, 0 clicks, avg pos 1.2
- **DFS organic pos**: NOT IN TOP 20
- **Our URL**: ``
- **Features ABOVE our organic listing**: Local Pack (maps 3-pack), People Also Ask, people_also_search, discussions_and_forums, perspectives
- **All SERP features on page**: discussions_and_forums(1), local_pack(4), organic(19), people_also_ask(1), people_also_search(5), perspectives(1)

### `civil law attorney`

- **GSC**: 2592 impressions, 0 clicks, avg pos 37.0
- **DFS organic pos**: NOT IN TOP 20
- **Our URL**: ``
- **Features ABOVE our organic listing**: Local Pack (maps 3-pack), People Also Ask, people_also_search, discussions_and_forums, perspectives
- **All SERP features on page**: discussions_and_forums(1), local_pack(3), organic(18), people_also_ask(1), people_also_search(5), perspectives(1)

### `car accident lawyer`

- **GSC**: 2578 impressions, 0 clicks, avg pos 1.2
- **DFS organic pos**: NOT IN TOP 20
- **Our URL**: ``
- **Features ABOVE our organic listing**: local_services, Local Pack (maps 3-pack), People Also Ask, discussions_and_forums, people_also_search, perspectives, Paid Ad
- **All SERP features on page**: discussions_and_forums(1), local_pack(4), local_services(1), organic(18), paid(2), people_also_ask(1), people_also_search(4), perspectives(1)

### `personal injury lawyer avondale`

- **GSC**: 1614 impressions, 0 clicks, avg pos 1.4
- **DFS organic pos**: NOT IN TOP 20
- **Our URL**: ``
- **Features ABOVE our organic listing**: Local Pack (maps 3-pack), people_also_search
- **All SERP features on page**: local_pack(3), organic(20), people_also_search(2)

### `personal injury lawyers near me`

- **GSC**: 1544 impressions, 0 clicks, avg pos 1.0
- **DFS organic pos**: NOT IN TOP 20
- **Our URL**: ``
- **Features ABOVE our organic listing**: Local Pack (maps 3-pack), People Also Ask, people_also_search, discussions_and_forums
- **All SERP features on page**: discussions_and_forums(1), local_pack(4), organic(20), people_also_ask(1), people_also_search(5)

### `personal injury lawyer near me`

- **GSC**: 1437 impressions, 0 clicks, avg pos 1.1
- **DFS organic pos**: NOT IN TOP 20
- **Our URL**: ``
- **Features ABOVE our organic listing**: Local Pack (maps 3-pack), People Also Ask, people_also_search, discussions_and_forums, Image Pack
- **All SERP features on page**: discussions_and_forums(1), images(1), local_pack(4), organic(19), people_also_ask(1), people_also_search(4)

### `personal injury attorneys`

- **GSC**: 1363 impressions, 0 clicks, avg pos 1.1
- **DFS organic pos**: NOT IN TOP 20
- **Our URL**: ``
- **Features ABOVE our organic listing**: Local Pack (maps 3-pack), People Also Ask, people_also_search, discussions_and_forums
- **All SERP features on page**: discussions_and_forums(1), local_pack(4), organic(20), people_also_ask(1), people_also_search(5)

### `business lawyer`

- **GSC**: 1317 impressions, 0 clicks, avg pos 1.3
- **DFS organic pos**: NOT IN TOP 20
- **Our URL**: ``
- **Features ABOVE our organic listing**: Local Pack (maps 3-pack), People Also Ask, people_also_search, knowledge_graph_expanded_item, perspectives
- **All SERP features on page**: knowledge_graph_expanded_item(2), local_pack(3), organic(19), people_also_ask(1), people_also_search(5), perspectives(1)

### `injury lawyers`

- **GSC**: 1289 impressions, 0 clicks, avg pos 1.1
- **DFS organic pos**: NOT IN TOP 20
- **Our URL**: ``
- **Features ABOVE our organic listing**: local_services, Local Pack (maps 3-pack), People Also Ask, people_also_search, discussions_and_forums, Image Pack
- **All SERP features on page**: discussions_and_forums(1), images(1), local_pack(4), local_services(1), organic(18), people_also_ask(1), people_also_search(4)

### `personal injury lawyers`

- **GSC**: 1267 impressions, 0 clicks, avg pos 1.1
- **DFS organic pos**: NOT IN TOP 20
- **Our URL**: ``
- **Features ABOVE our organic listing**: Paid Ad, Local Pack (maps 3-pack), People Also Ask, people_also_search, discussions_and_forums, perspectives
- **All SERP features on page**: discussions_and_forums(1), local_pack(4), organic(19), paid(6), people_also_ask(1), people_also_search(5), perspectives(1)

---

## Aggregate diagnosis — what's stealing the clicks

Counted by: number of audited queries where this feature appears ABOVE our
organic listing. Higher count = more impressions stolen.

| Feature | Queries above us | Likely fix |
|---|---:|---|
| **Local Pack (maps 3-pack)** | 10 | Google Business Profile optimization — primary lever, not on-site |
| **people_also_search** | 10 | TBD |
| **People Also Ask** | 9 | Add the PAA questions verbatim as H2s + 50-word answers |
| **discussions_and_forums** | 8 | TBD |
| **perspectives** | 5 | TBD |
| **local_services** | 2 | TBD |
| **Paid Ad** | 2 | Paid ads displacing organic — invest in GBP / paid search |
| **Image Pack** | 2 | Add a hero image with descriptive alt + filename matching the query |
| **knowledge_graph_expanded_item** | 1 | TBD |

## Verdict

Look at the top row. If it says **AI Overview**, the click-stealer is Google
answering questions in-SERP and citing us without sending traffic. The fix is
SGE optimization (answer-first content patterns), not rankings work.

If it says **Local Pack**, the fix is Google Business Profile, not on-site SEO.

If multiple features dominate, the SERP is over-saturated with click-stealers
and recovering organic CTR is structurally hard — pivot to (a) GBP, (b) paid,
or (c) different keyword targets where the SERP is cleaner.