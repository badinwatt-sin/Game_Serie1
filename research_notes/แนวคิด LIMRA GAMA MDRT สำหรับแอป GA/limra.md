# LIMRA concepts, metrics and benchmarks for life-insurance agency management (input for a Thai GA mobile app)

> Research date: 2026-11-24. **Method caveat:** direct page fetches to limra.com, loma.org, tlaa.org and prudential.co.th were blocked in this session (hosts not on the network allowlist). All findings below come from web-search result extracts of those pages, not from reading the full documents. Numbers are quoted as the search extracts reported them; anything not confirmed is listed under Gaps. Labels used: **[V]** = stated in a primary/official source extract; **[I]** = illustrative / author-experience / sample figure, not a survey benchmark; **[O]** = old figure (year given).

## 1. Agent retention and policy persistency: definitions and benchmarks

### Takeaway
LIMRA's headline retention metric is the 4-year agent retention rate (still under contract at December of the fourth year after hire); the US benchmark has sat at about 14-15% for years, and an Asia practitioner estimate published by LOMA is about 9%. LIMRA's persistency metric is the count-based 13-month rate (policies in force / policies paid for), with 90% as the quality-award threshold; Thailand's industry-wide persistency was 82-84% in 2024-2026.

### Cited Findings

**Agent retention**
- [V] Definition: LIMRA counts an agent as retained at four years if still under contract through December of the fourth year after hire. — [LIMRA 2025 Annual Conference, Session 16 "Building High-Performing Sales Teams"](https://www.limra.com/globalassets/limra-loma/events-learning-and-networking/conferences/2025/limra-annual-conference/session-16-building-high-performing-sales-teams.pdf)
- [V] Industry-wide (US) 4-year retention rate has been 14% "for years"; average retention for agency-building companies has not exceeded 20% (2025 deck). — [LIMRA Session 16 deck, 2025](https://www.limra.com/globalassets/limra-loma/events-learning-and-networking/conferences/2025/limra-annual-conference/session-16-building-high-performing-sales-teams.pdf)
- [V] About 15% 4-year retention cited in 2025 trade press; in 2020 only 15% of financial professionals in agency systems recruiting mainly inexperienced people remained with the hiring company after four years. — [ThinkAdvisor, Jul 2025](https://www.thinkadvisor.com/amp/2025/07/14/how-to-fix-the-agent-retention-crisis-in-life-insurance/); [InsuranceNewsNet, "5 key factors that help retain new financial professionals"](https://insurancenewsnet.com/innarticle/5-key-factors-that-help-retain-new-financial-professionals)
- [V] "Only 15 of every 100 recruits will still be with their hiring companies after four years" (LIMRA, cited by AM Best). — [AM Best](https://news.ambest.com/articlecontent.aspx?refnum=311816)
- [O, 2011, Canada] 4-year retention 45% for experienced recruits vs 29% for inexperienced recruits (LIMRA-linked Canadian study). — [Insurance Portal, "Retention rates frozen"](https://insurance-portal.ca/article/retention-rates-frozen/)
- [V, different channel] US multiple-line exclusive agents: 4-year retention rose from 51% to 55% (LOMA MarketFacts 2025). Not comparable to tied life agents. — [LOMA MarketFacts 2025](https://www.loma.org/en/news/marketfacts/2025/mlea-distribution-recruiting-dips-but-is-the-sky-falling)
- [V] First-year retention by who sourced the recruit: recruiter-sourced 44%, sales-manager-sourced 50%, office-head-sourced 55% (LIMRA-Finseca, 2022). — [InsuranceNewsNet](https://insurancenewsnet.com/innarticle/5-key-factors-that-help-retain-new-financial-professionals)
- [I, Asia] LOMA MarketFacts (2025) article by a practitioner gives year-by-year retention "typical" across agency leaders in Singapore, China, Malaysia, Thailand, Vietnam, Indonesia, Philippines: 70% year 1, 30% year 2, 60% year 3, 70% year 4, compounding to about 9% 4-year retention. Year 2 is the worst "regardless of market and company", attributed to weak prospecting / market-development training. The author claims about 40% is attainable with disciplined recruiting and training ("up to 400% improvement"). This is author experience, not a survey. — [LOMA MarketFacts 2025, "Increasing Agent Retention: A Leadership-Driven Approach"](https://www.loma.org/en/news/marketfacts/2025/increasing-agent-retention-a-leadership-driven-approach/)
- [V] LIMRA research identifies the first 12-24 months as the critical retention window in Asia; high turnover lowers productivity and raises training cost (Nov 2025). — [LOMA MarketFacts 2025, "Retaining Life Agents in Asia: Lessons for Sustainable Growth"](https://www.loma.org/en/news/marketfacts/2025/retaining-life-agents-in-asia-lessons-for-sustainable-growth)
- [V] 2018: companies still reported low retention for agents in their first two calendar years. — [LIMRA news release 2018](https://www.limra.com/en/newsroom/news-releases/2018/agent-retention-among-top-concerns-at-limras-2018-distribution-conference-for-financial-services)

**Policy persistency**
- [V] LIMRA 13-month persistency (award definition): share of paid-for policies that have received any portion of the second-year premium; count-based: persistency rate = policies still in force / policies paid for. Worked example: 65 of 72 policies in force = 90%. Excludes group insurance, single premium and "not-taken" policies. — [LIMRA Rewards and Recognition 2026 Catalog](https://www.limra.com/siteassets/solutions-and-services/global-solutions/rewards--recognition/rr-catalog.pdf)
- [V] Known bias of the LIMRA formula: accurate if sales are flat; tends to overstate persistency when sales grow fast and understate it when sales growth is sluggish. — [Pacific Century Insurance HKEX filing (2001)](https://www.hkexnews.hk/listedco/listconews/sehk/2001/0412/0065/f111.pdf)
- [V] Thai insurer practice is premium-based: annualized premiums from policies whose second-year premium is paid / annualized first-year premium of policies issued in the previous year. — [Thai Life Insurance investor FAQ](https://investor.thailife.com/en/information-inquiry/faq)
- [V, Thailand industry, TLAA-based press] Policy persistency rate: 83% for 2024; 82% in H1 2025; 84% in H1 2026 (which persistency month is not stated in the extracts). — [Bangkok Post, "Thai life insurance posts sturdy growth"](https://www.bangkokpost.com/business/general/3081869/thai-life-insurance-posts-sturdy-growth); [Bangkok Post, "Life sector poised to maintain steady growth"](https://www.bangkokpost.com/business/general/3289790/life-sector-poised-to-maintain-steady-growth)
- [Unverified] A finance blog gives typical ranges of 86-91% (13-month) and 79-86% (25-month) with no named source. — [finnerd.co.uk](https://finnerd.co.uk/blog/18-persistency-analysis)

### Inferences
- App should compute persistency both ways and label them: (a) LIMRA/IQA count-based 13-month (policies in force / policies paid for, excluding single premium, group, not-taken) and (b) Thai-insurer premium-based (the figure the company statement will show). They will differ.
- Benchmarks to show on a persistency gauge: 90% = award threshold (IQA Silver / TNQA), about 83% = Thai industry average (2024-2026). An agent below about 83% is under the market; 90%+ is award grade.
- Retention should be tracked as a cohort table by contract month (hire cohort x months 3, 6, 12/13, 24, 36, 48), since LIMRA's metric is cohort-based and the loss concentrates in months 12-24. Flag "year-2 risk" agents explicitly.
- Tag each recruit with its source and the recruiting leader, since first-year retention differs by who sourced the recruit (44% / 50% / 55%).

### Gaps
- No LIMRA-published 13-month (first-year) agent retention benchmark for Asia or Thailand was found; LIMRA's FP Production and Retention study and the Asia Agency Project are member-only.
- No LIMRA 25-month persistency benchmark for Asia/Thailand found. The Thai 82-84% figures did not specify 13th vs 25th month in the extracts.
- The 9% Asia 4-year figure is an author's illustrative estimate, not survey data.

## 2. Recruiting, selection, onboarding and early validation

### Takeaway
LIMRA's position is that retention is decided before and just after contracting: validated selection testing (Career Profile+ family), referral-based recruiting, and a fast start with early sales activity, joint fieldwork, sales-skills training and mentoring. Hard funnel ratios and 90-day validation standards are not public.

### Cited Findings
- [V] LIMRA-Finseca "The Path to Improving Retention" (2022; 56 field leaders and 21 home-office leaders surveyed): five factors with greatest influence on early retention are (1) early sales activity / fast start, (2) strong selection process before hiring, (3) joint fieldwork, (4) quality of sales training, (5) mentoring. 86% of leaders strongly believe sales-skills training quality affects early retention. — [InsuranceNewsNet](https://insurancenewsnet.com/innarticle/5-key-factors-that-help-retain-new-financial-professionals); [Finseca](https://www.finseca.org/finseca-foundation-and-limra-five-ways-to-keep-financial-professionals-engaged/); [LIMRA 2022](https://www.limra.com/en/newsroom/industry-trends/2022/improving-financial-professional-retention-requires-a-combination-of-rewards-and-reality/)
- [V] Same five drivers restated for Asia in Nov 2025. — [Asia Insurance Review, Nov 2025](https://asiainsurancereview.com/Magazine/ReadMagazineArticle?aid=59790)
- [V] Asia recruiting (Aug 2025, LIMRA Asia Agency Project + regional interviews + LIMRA-Finseca study): referral / "agent-get-agent" recruiting consistently yields the highest conversion rates across Asia. Mistakes flagged by agency leaders in Thailand, Malaysia and the Philippines: hiring for appearance over grit, and ignoring early red flags such as poor follow-up. — [LIMRA MarketFacts 2025, "Life Insurance Recruiting in Asia: Trends and Key Strategies"](https://www.limra.com/en/trending-topics/publications/marketfacts/2025/life-insurance-recruiting-in--asia-trends-and-key-strategies/)
- [V] Career Profile+ (CP+): LIMRA describes it as its most extensively validated selection tool; it predicts whether a candidate will have above-average production and still be under contract after one year; scoring is recalibrated annually with user data. Vendor-reported validity; no independent validation found. — [LIMRA case study "Predicting long-term success"](https://www.limra.com/en/solutions-and-services/recruiting_and_selection/assessment-case-studies/predicting-long-term-success/); [LIMRA "Data Driven" white paper](https://www.limra.com/siteassets/solutions-and-services/data-driven-white-paper_final_web2.pdf)
- [V] Career Profile Advantage defines a "successful" agent as one who survives the first contract year and produces in the top half of first-year surviving producers in the company. — [LIMRA CP Advantage sample report](https://www.limra.com/siteassets/solutions-and-services/selection/career-profile/cp-advantage-sales---sample)
- [V] Case study: an insurer that relaxed selection standards and dropped the test saw problems afterwards. — [LIMRA "Hindsight is 2020"](https://www.limra.com/en/solutions-and-services/recruiting_and_selection/assessment-case-studies/hindsight-is-2020-lessons-learned-after-dropping-a-test/)
- [V] Manulife signed a three-year agreement to use LIMRA's Career Choice assessment to screen candidates across its Asian markets, starting in Singapore and Hong Kong. — [Manulife](https://www.manulife.com/en/news/manulife-partners-with-limra-to-recruit-asias-best-in-class-insurance-advisors.html); [Insurance Business Asia](https://www.insurancebusinessmag.com/asia/news/breaking-news/manulife-partners-with-limra-to-strengthen-agent-recruitment-254791.aspx)
- [V] LIMRA "Ascent to Agency Success: Recruiting, Training, and Retaining High Performing Agents in Asia" series (Aug 2025) covers effective recruiting and retention practices, common mistakes, and the role of technology in productivity; country reports include Japan and Indonesia. — [LIMRA research series](https://www.limra.com/en/research/research-series/ascent-to-agency-success-recruiting-training-and-retaining-high-performing-agents-in-asia-series/)

### Inferences
- A recruiting pipeline module should mirror LIMRA's sequence: source (with referral / agent-get-agent as a first-class source) -> first interview -> selection assessment -> career presentation -> licensing exam -> contract -> fast-start. Store conversion per stage and per source so the office builds its own ratios, since LIMRA's are not public.
- Add a structured "red flag" checklist at selection (follow-up reliability, grit indicators), because those are the named mistakes in Thailand.
- A "fast start" tracker for the first 90 days should log the five LIMRA-Finseca drivers as checkable items: first sales activity dates, number of joint field visits with the manager, training modules completed, assigned mentor and mentoring sessions.
- The CP Advantage success definition (survive year 1 and top-half production) is a usable in-app definition of a "validated" new agent.

### Gaps
- No public LIMRA recruiting funnel ratios (candidates per contract), no numeric first-90-day validation or financing standards, and no public breakdown of recruit sources by percentage were found. Any such thresholds in the app must be set by the agency or the insurer's own contract.
- "Exsel" could not be confirmed as a distinct selection product; in search results it appears only as LIMRA's test administration channel. Career Profile+, Career Profile Advantage, Career Choice, SuccessPredictor and RightChoice are the product names found.

## 3. Agent productivity and activity metrics

### Takeaway
Public LIMRA material confirms what it measures (field activity, sales performance, retention via the annual FP Production and Retention benchmarking study) but not the benchmark values. The only public numeric production anchors are the award tiers (IAP 25/50/100 policies; IQA sample 30/50/100 policies per year).

### Cited Findings
- [V] LIMRA's FP Production and Retention study is an annual benchmarking study that helps participants track field activity and sales performance; results are for participants. — [LIMRA Retail Distribution Research](https://www.limra.com/en/research/distribution/retail-distribution/)
- [V] LIMRA International Award for Productivity (IAP): tiers at minimum 25 policies (Silver), 50 (Gold), 100 (Platinum). The measurement period was not stated in the extract. — [LIMRA IAP flyer](https://www.limra.com/siteassets/solutions-and-services/global-solutions/rewards--recognition/iap-flyer)
- [V, date not confirmed, more than two years old] LIMRA-BCG study: financial professionals in the top 25% are twice as productive as the median, across all channels. — [InsuranceNewsNet, "How life carriers can optimize agent productivity"](https://insurancenewsnet.com/conference-post/how-life-carriers-can-optimize-agent-productivity)
- [V] McKinsey-LIMRA Insurance 360 Benchmark (2025) is an industry performance benchmark survey for individual life and annuities; agent-level ratios were not in the public extract. — [McKinsey-LIMRA 2025 deck](https://www.limra.com/globalassets/limra-loma/landing/common-assets/mckinsey-webinars/life_mckinsey-limra-2025-insurance-360-industry-trends_11122025.pdf)
- [V] LIMRA paper "Hidden costs of chasing volume in life insurance sales" exists in the Rewards and Recognition library (argues for quality over volume); contents not retrieved. — [LIMRA](https://www.limra.com/siteassets/solutions-and-services/global-solutions/rewards--recognition/hidden-costs-of-chasing-volume-in-life-insurance-sales.pdf)

### Inferences
- With no public LIMRA ratios, the app should let the agency compute its own baselines and show each agent against the office median and top quartile (LIMRA-BCG's "top quartile = 2x median" is a reasonable framing for the dashboard).
- Suggested KPI set consistent with what LIMRA tracks (definitions are standard industry practice, not LIMRA-published values): active ratio = agents with at least 1 issued case in the month / total contracted agents; cases per active agent; FYP/APE per agent and per active agent; activity funnel counts (prospects -> appointments -> fact-finds -> closes) with conversion rates; average case size.
- Annual policy-count progress bars toward 25 / 30 / 50 / 100 policies map directly to IAP and IQA tiers.

### Gaps
- No verified LIMRA benchmark values for cases per agent, active ratio, premium per agent, or prospect->appointment->sale ratios (including the commonly quoted "10-3-1") were found; these are behind LIMRA membership. Do not present any such ratio in the app as a "LIMRA benchmark".

## 4. Field-leader / manager development

### Takeaway
LIMRA's core manager curriculum is the Agency Management Training Course (AMTC): five modules (Orientation and Planning, Recruitment, Selection, Training, Performance Management) covering 28 proficiencies, leading to the CIAM designation. Its manager quality scorecard is the IQMA: share of directly managed agents who earn IQA (30% / 50% / 70%).

### Cited Findings
- [V] AMTC consists of five modules: Orientation and Planning, Recruitment, Selection, Training, Performance Management. Offered modularly (single topics or the whole course). Full course about 13 days; individual modules 2-3 days. Covers 28 proficiencies. Methods: discussion, role-play and skill drills, video role-modelling, practical assignments. — [LIMRA AMTC page](https://limra.com/en/solutions-and-services/global/learning-and-development/programs-for-managers/agency-management-training-course-amtc/); [AMTC flyer](https://www.limra.com/siteassets/solutions-and-services/global-solutions/learning--development/amtc-flyer.pdf)
- [V] Planning is framed around goals and objectives; Selection includes how to present the career opportunity. — [LIMRA AMTC page](https://limra.com/en/solutions-and-services/global/learning-and-development/programs-for-managers/agency-management-training-course-amtc/)
- [V] Completing AMTC plus the capstone Summary Planning Project is required for the CIAM designation (AIAM is the associate level). — [LIMRA AIAM and CIAM flyer](https://www.limra.com/siteassets/solutions-and-services/global-solutions/learning--development/aiam-and-ciam-flyer.pdf)
- [V] Revised AMTC languages listed: English, Greek, Spanish, Simplified Chinese, Traditional Chinese, Vietnamese (Thai not listed on that page). — [LIMRA AMTC page](https://limra.com/en/solutions-and-services/global/learning-and-development/programs-for-managers/agency-management-training-course-amtc/)
- [V] Other LIMRA manager programs listed: Agency Enhancement Series (AES) and Pacesetter. — [LIMRA Programs for Managers](https://limra.com/en/solutions-and-services/global/learning-and-development/programs-for-managers)
- [V] IQMA (International Quality Management Award): for field managers at unit-manager level or above who have led sales for at least two years and manage at least three agents; tiers by share of directly managed agents who qualified for any IQA in the current year: Silver 30%, Gold 50%, Platinum 70%. Only for managers of LIMRA member companies. A Thai-language IQMA flyer exists. — [LIMRA IQMA page](https://www.limra.com/en/solutions-and-services/global/rewards-and-recognition/international-quality-management-award-iqma/); [IQMA flyer](https://www.limra.com/siteassets/solutions-and-services/global-solutions/rewards--recognition/iqma-flyer.pdf); [IQMA flyer (Thai)](https://www.limra.com/siteassets/solutions-and-services/global-solutions/rewards--recognition/iqma-flyer-th.pdf)
- [V] LOMA MarketFacts 2026 article "Rebuilding Leadership for the Industry's Talent Crisis" exists (contents not retrieved). — [LOMA 2026](https://www.loma.org/en/news/marketfacts/2026/rebuilding-leadership-for-the-industrys-talent-crisis/)

### Inferences
- A manager scorecard in the app can follow the AMTC module structure, one block per competency: Planning (unit plan vs actual), Recruiting (pipeline volume, source mix), Selection (interview-to-contract conversion, assessment use), Training (joint field work count, new-agent module completion), Performance Management (active ratio, cases per agent, persistency, 13-month agent retention of own recruits).
- "% of my agents on track for IQA/TNQA" is a ready-made unit-manager and director KPI, with 30/50/70% bands taken from IQMA. Minimum unit size for the metric: 3 agents, 2 years as leader.
- The manager development path can be shown as AMTC modules -> AIAM -> CIAM as an optional external credential track.

### Gaps
- No LIMRA-published span-of-control benchmark (agents per unit manager) was found; the only number is the IQMA minimum of 3 managed agents.
- "Trustworthy Selling" was not surfaced in any search result; its current availability and content are unconfirmed.
- The list of the 28 AMTC proficiencies was not retrieved.

## 5. IQA and TNQA qualification criteria

### Takeaway
IQA: a minimum number of policies in each of two consecutive years plus a qualifying 13-month persistency, at a LIMRA member company; thresholds vary by country, and LIMRA's sample table shows Silver/Gold/Platinum = 30/50/100 policies per year with 90/91/92% persistency. TNQA (TLAA): publicly confirmed criterion is policy persistency of at least 90% while staying with the same company; the full numeric criteria (cases, premium) could not be verified. The 43rd TNQA (2026) had 2,836 qualifiers from 15 companies.

### Cited Findings

**IQA (LIMRA)**
- [V] Requirements: produce a minimum number of policies written in two consecutive years, and a qualifying 13-month persistency rate on individual life and annuity business issued and paid for during a calendar year; candidate must represent a LIMRA member company; levels Silver, Gold, Platinum; requirements vary by country. — [LIMRA IQA page](https://www.limra.com/en/solutions-and-services/global/rewards-and-recognition/international-quality-award-iqa/)
- [I, LIMRA sample table, may be dated] Silver: 30 policies per year and 90% persistency; Gold: 50 and 91%; Platinum: 100 and 92%. The flyer says to contact the local LIMRA representative for actual country requirements. — [LIMRA IQA flyer](https://www.limra.com/contentassets/46711bd43335427ab1e4821c5932eb5d/iqa_flyer.pdf)
- [Conflict] The 2026 Rewards and Recognition catalog gives a different example (Platinum described as more than 50 policies and 90% persistency), confirming tiers are country/year specific. — [LIMRA R&R 2026 Catalog](https://www.limra.com/siteassets/solutions-and-services/global-solutions/rewards--recognition/rr-catalog.pdf)
- [O, about 2011] Older rule: at least 30 policies written in two consecutive years, 13-month persistency of at least 90%, full-time agent of a LIMRA member company. — [LIMRA IQA program details (archived on Yumpu)](https://www.yumpu.com/en/document/view/37913737/international-quality-award-program-details-limracom)
- [V] Qualifying period: after first qualification, measured on a 2-year rolling basis (example: 2020 qualification is measured on 2018 and 2019 performance). Certificates or plaques on qualification and every five years after. Digital badges included with IQA, IAP and IQMA. — [LIMRA IQA flyer](https://www.limra.com/contentassets/46711bd43335427ab1e4821c5932eb5d/iqa_flyer.pdf); [LIMRA R&R 2026 Catalog](https://www.limra.com/siteassets/solutions-and-services/global-solutions/rewards--recognition/rr-catalog.pdf)
- [V] A Thai-language IQA flyer exists (not readable in this session). — [LIMRA IQA flyer (Thai)](https://www.limra.com/contentassets/46711bd43335427ab1e4821c5932eb5d/iqaflyer_thai.pdf)

**TNQA (Thai Life Assurance Association)**
- [V] TNQA honours agents with outstanding results and ethics; qualifiers must maintain policy persistency of not less than 90%. — [Siamturakij, 43rd TNQA 2026](https://siamturakij.com/%E0%B8%AA%E0%B8%A1%E0%B8%B2%E0%B8%84%E0%B8%A1%E0%B8%9B%E0%B8%A3%E0%B8%B0%E0%B8%81%E0%B8%B1%E0%B8%99%E0%B8%8A%E0%B8%B5%E0%B8%A7%E0%B8%B4%E0%B8%95%E0%B9%84%E0%B8%97%E0%B8%A2-%E0%B8%9B%E0%B8%A3/); [innwhy, 17 Jun 2026](https://www.innwhy.com/tlaa170626)
- [V] The agent must be with the same company throughout the performance-calculation period. — [Prudential Thailand TNQA page](https://www.prudential.co.th/th/about-us/careers/join-as-a-financial-consultant/national-and-international-award-winning-agents/thailand-national-quality-awards/)
- [V] 43rd TNQA (2026): ceremony 19 June 2026 at ICON Hall, ICONSIAM; 2,836 qualifiers from 15 life insurers; AIA had 1,696 qualifiers (no. 1 for the 19th consecutive year); Muang Thai Life 212; Bangkok Life 131. — [Hoonsmart](https://hoonsmart.com/archives/424463); [Siamrath (AIA)](https://siamrath.co.th/press-release/156656); [bizmatchingnews (MTL)](https://bizmatchingnews.com/archives/74783); [Siamrath (BLA)](https://siamrath.co.th/press-release/157991)
- [V] 42nd TNQA (2025): 2,660 qualifiers from 14 companies; 47 agents received the 10-year honorary plaque. 15-year and 20-year honorary awards also exist. — [TLAA](https://tlaa.org/page_bx.php?cid=23&cname=&cno=2028)
- [O, 2020, unverified attribution] A 2020 Thai news item states a related qualification requires at least 30 ordinary or industrial policies per year and total sum assured of at least 4.5 million baht per year; the search extract did not make clear that this is the TNQA rule itself, and it may have changed. — [thinsiam, 2020](https://www.thinsiam.com/archives/120232)
- TLAA's own TNQA criteria pages (not readable in this session). — [TLAA TNQA page](https://www.tlaa.org/page_bx.php?cid=28&cname=&cno=105); [TLAA TNQA (English)](https://www.tlaa.org/page_bx.php?cid=28&cno=1381&lang=eng)

### Inferences
- The app can ship an "award tracker" with configurable rules rather than hard-coded ones: policies issued this year and last year, count-based 13-month persistency, same-company tenure, with default targets of 30 policies per year and 90% persistency flagged as "to be confirmed against the current TLAA/LIMRA announcement".
- The 2,836 TNQA qualifiers in 2026 show how selective the award is; an owner-level KPI of "number and % of agents qualifying TNQA/IQA" is meaningful and feeds the IQMA bands for managers.
- Because IQA measures two consecutive years, the tracker needs a two-year view and an early warning when the current year falls behind pace.

### Gaps
- Exact current (2026) TNQA criteria for number of policies, premium or sum assured, and the measurement period could not be verified; tlaa.org was unreachable. Confirm with TLAA or the insurer's agency department before coding thresholds.
- Thailand-specific IQA thresholds (policy count per tier) could not be verified; the Thai flyer was unreachable.
- Whether TNQA is formally "run with LIMRA" could not be confirmed; sources show TNQA as a TLAA award and IQA as a separate LIMRA award.
- IAP measurement period and country-specific rules not retrieved.

## 6. Asia / Thailand agency distribution trends 2023-2026

### Takeaway
In Thailand agents remain the largest channel (about half of premium, 48.2% in a 2026 report) but the margin over bancassurance is narrowing and digital is the fastest-growing channel from a very small base. LIMRA's Asia work in 2025 centres on recruiting quality, early-tenure retention and technology-enabled productivity; no public LIMRA numbers on part-time vs full-time agents or agent demographics were found.

### Cited Findings
- [V, Thailand] 2025 total life premium 677 billion baht (+3.45% YoY); TLAA projects 690-700 billion baht for 2026 (+2.5% to 3.5%). — [Bangkok Post, "Life sector poised to maintain steady growth"](https://www.bangkokpost.com/business/general/3289790/life-sector-poised-to-maintain-steady-growth)
- [V, Thailand] H1 2025: agents were the main channel at roughly half of premiums; bancassurance 39.2%; digital 0.23% of premium, growing 28.2%. — [Bangkok Post, "Thai life insurance posts sturdy growth"](https://www.bangkokpost.com/business/general/3081869/thai-life-insurance-posts-sturdy-growth)
- [V, Thailand, 2026] Agents at 48.2% of the market; digital sales up 77.5% in H1 2026, the fastest-growing channel; the agent lead is narrowing as compliance rules tighten for traditional intermediaries. (H1 2025 and H1 2026 figures come from different reports and bases.) — [Insurance Business Asia, "Thailand's life insurance digital channel is closing in on agents"](https://www.insurancebusinessmag.com/asia/news/life-insurance/thailands-life-insurance-digital-channel-is-closing-in-on-agents-585257.aspx)
- [V, Thailand] Only about 38-39% of the Thai population holds a life policy. — [Asia Insurance Review](https://www.asiainsurancereview.com/Magazine/ReadMagazineArticle/aid/49295/Thailand-Life-market-to-see-stable-growth-of-2-3-in-2025)
- [V, Asia] Nov 2025: the agency channel across Asia is being reshaped by digital transformation; early-career retention drivers unchanged (selection, early activity, joint fieldwork, sales-skills training, mentoring). — [Asia Insurance Review, Nov 2025](https://asiainsurancereview.com/Magazine/ReadMagazineArticle?aid=59790)
- [V, Asia] LIMRA "Ascent to Agency Success" series (Aug 2025) includes the role of technology in enhancing productivity. — [LIMRA research series](https://www.limra.com/en/research/research-series/ascent-to-agency-success-recruiting-training-and-retaining-high-performing-agents-in-asia-series/)
- [V, Asia] Prudential describes working with LIMRA on agency excellence ("The Future Ready Adviser"); contents not retrieved. — [Prudential plc](https://www.prudentialplc.com/en/newsroom/insights/The-Future-Ready-Adviser-Prudential-Advances-Agency-Excellence-with-LIMRA/)
- [V] LIMRA holds an Asia Distribution Conference (agenda not retrieved). — [LIMRA](https://www.limra.com/asiadistribution/?t=agenda)

### Inferences
- With agents' share slipping toward bancassurance and digital growing quickly, the app's value proposition is quality and productivity per agent (persistency, active ratio, retention) rather than headcount; this matches LIMRA's "quality over volume" award design.
- Tightening compliance for intermediaries suggests including licence-expiry, training-hour and sales-conduct tracking as a module.

### Gaps
- No LIMRA data found on part-time vs full-time agent mix, agent age/gender demographics, or digital-tool adoption rates for Asia or Thailand (2023-2026).
- No verified current count of licensed Thai life agents was found.
- Full text of the LIMRA Asia Agency Project and "Ascent to Agency Success" reports is member-only and was not read.
