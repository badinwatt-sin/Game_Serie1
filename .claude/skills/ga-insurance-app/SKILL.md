---
name: ga-insurance-app
description: Continue the GA Insurance Application product design and prototype using the agreed agency hierarchy, Daily Business Pulse (Performance, Productivity, Growth), sales activity funnel, verified-versus-pending-versus-simulation data layers, reconciliation, customer portfolio, AI coach and coaching tracker rules. Use for any work on GA Insurance, GA on app, the Digital Agency Office, its screens, data model, wireframes, MVP scope, PR material or prototype, including requests in Thai such as แอปสำนักงานตัวแทน, Business Pulse, สามวง, Pending, Reflection, Coaching Tracker.
---
# GA Insurance Application

Master reference: `references/GA-Insurance-Blueprint-v0.2.pdf` (Detailed Product Blueprint v0.2, 26 November 2026; expands v0.1, whose 13 preview pages are kept as its appendix). Read the PDF when a detail below is not enough. The blueprint is a working concept: feature names and screens are agreed in direction, while colors, navigation and final UX/UI are not locked.

## Product principles

- **Digital Agency Office.** Replace after-the-fact reports with daily business health: know the status, understand the cause, plan, act, learn. Personal data is the basis of the AI Coach, not generic advice.
- **Six connected modules** sharing one data set: Business Pulse; Income and Performance Intelligence; Customer Portfolio Intelligence; Career and Competency Development (Growth and Career); AI Business and Leadership Coach; My Sales Activity Management.
- **Status first, then drill down:** Business Health First, Diagnosis, Simulation, AI Coaching, Action Plan. WHOOP-inspired daily health. Do not force users to open the app three times a day.
- **Scope boundary:** Customer Portfolio manages the book and coverage reviews. A dedicated sales-presentation tool is a separate, deferred product.
- Do not finalize visual design before functional requirements are confirmed.

## Hierarchy and access

Agency Owner > MM1 / MM2 (peer directors, neither above the other) > Unit Manager > Agent.

- Owner: whole office, drill down by line; results, team income, trends, skills, resource allocation.
- MM1 / MM2: only Unit Managers and agents in their own line; may compare units inside the line. Never cross-line.
- Unit Manager: agents in own unit; results, activity, income opportunity, strengths, development areas, Coaching Action Tracker.
- Agent: own data only. Never another agent's income, results or customers.
- Leaders see team data to coach and motivate. Individual income detail and customer data need rights set by role and company policy; field-level rules are still to be confirmed.

## Daily Business Pulse (three connected rings)

- **Performance:** company-verified results: APE/NBC, case count, average case size, actual income, bonus, monthly/annual targets. Qualification milestones live inside Performance.
- **Productivity:** health of the work: new lead, contact, appointment, meeting, application, follow-up, conversion rate; daily trend; plan versus actual.
- **Growth:** readiness to grow: skills, strengths, development areas, courses, coaching, career readiness. Sales alone must not judge ability.
- Scores, colors, alert thresholds, weights and calculation windows are **not agreed**. Preview numbers (72 / 58 / 81) are illustrative only.

## Performance, income and milestones

- Show verified results against target with the data timestamp, remaining gap and monthly/annual trend. Actual income and bonus come from company data and company rules.
- Milestone detail: chosen qualification, each condition, verified result, gap, time left, what to change. Never assume qualification conditions.
- Simulation example: target APE 1,000,000, verified 720,000, gap 280,000. At average case size 40,000 that needs 7 more verified cases, or 5 cases at 56,000. Both are simulations, not real results.
- Income intelligence: separate commission, bonus and received income from forecasts. No guarantee of results.
- Leaders see team income by reporting line, bonus-threshold opportunities and ways to support; agents see only their own.

## Agent daily journey

Morning: three rings, daily trend, AI Coach focus. Plan my day: pick existing customers, add new leads, set appointments and next actions. During the day: log contact, appointment, meeting, conversation and proposal results with objections or success factors. Close or follow up: agreed to buy creates a Pending Case linked to customer and product; undecided records reason and follow-up; unsuccessful keeps the history. End of day: plan versus actual, open activities, pending business, reflection; AI summarizes learning and suggests tomorrow's plan.

## Sales funnel and state transitions (proposed for testing)

1. **Lead:** new prospect or existing customer; source and purpose.
2. **Contact:** reached / not reached / retry later; if not reached, reason and next action.
3. **Appointment:** date, channel; set / not yet / postponed / cancelled.
4. **Meeting and conversation:** met or not, conversation opened, needs discussed, proposal result, objections; if not met, reason and follow-up plan.
5. **Outcome:** agreed (Pending Case), undecided (Follow-up), declined (Lost / Unsuccessful with reasons). Every outcome can take a Reflection.
6. **Verification:** wait for company data, match, check approval and recognition: Verified or Not Approved. Unmatched items go to review; never create real results by hand.

## Minimum activity data model (proposal, not approved)

- Lead/Customer: Lead ID, Customer ID (if any), Agent ID, new/existing, source channel, created date, status, contact permission.
- Activity/Appointment: Activity ID, Customer/Lead ID, type, planned time, actual time, contact/appointment/meeting result, channel, next action, due date.
- Reflection: outcome, multi-select reason codes, optional note, technique used, objections, what to improve, next action.
- Pending Case: Case ID, Agent ID, Customer ID, Product ID, application reference (if any), application date, estimated APE, status, linked activity.
- Company Policy: Policy ID, application reference, Agent ID, Customer ID, Product ID, policy status, verified APE/NBC, eligible case count, effective date, source timestamp.
- Data minimization: no health or sensitive data in free notes unless necessary; identifiers and ID linkage need data and security review.

## Reflection and Personal Sales Playbook

- Success factors (multi-select): understood needs, built trust, explained coverage clearly, handled objections, followed up at the right time, or typed.
- Objection / lost reasons: budget or premium, no perceived need, wants to compare, not confident, not ready, agent could not answer fully, documents or underwriting, other.
- UX: short entry after meeting, multi-select plus optional typing; voice entry and a 30 to 60 second target are proposals to test.
- Playbook: techniques that worked, objections met, how they were handled, lessons, so the AI can bring them back in context.
- AI reports recurring patterns with sample counts and limits. It must not conclude that every lost sale is low skill; separate developable factors from underwriting and external causes.

## Pending business and reconciliation

- Company data alone determines verified APE, NBC, case counts, compensation and official qualification progress.
- Match on stable identifiers (Agent ID, Customer ID, application reference, Policy ID), not names alone.
- Example: agent enters 50,000, company verifies 46,000. Count 46,000 once under company rules, keep 50,000 as history, and re-forecast.
- Not approved: keep the case in customer history with the permitted reason, add nothing to real results, adjust the forecast, never delete activities that happened.
- Reversal or cancellation after verification: keep both states and adjust results (and compensation if relevant) by company rules.
- Mismatched, multi-matched or duplicate data waits for review; keep audit trail and source timestamp. Policy approval may differ from production recognition.

## Customer Portfolio Intelligence

- Overview of customers and policies with a product mix pie: Endowment, Critical Illness, Whole Life, Investment, Protection, Health.
- The counting basis (policies or APE) and non-overlapping category mapping must be defined, because Whole Life, Protection and riders can overlap.
- One customer can hold many policies; show product, status, maturity or key events where data exists, and contact history including unsuccessful cases.
- Coverage review: AI may flag topics, but missing data does not mean the customer lacks coverage. Check needs and policies held elsewhere first.
- Skill linkage: AI may suggest product knowledge or skills to prepare before a meeting. It does not sell on the agent's behalf.

## AI Business Coach

- Daily briefing from activity, pipeline, targets and latest data, stating limits when data is incomplete.
- Ask AI: what to change to reach a qualification, how many more cases or what case size, whom to follow up today, which skill to develop.
- Recommendation to action: propose customers or activities with reasons; the agent confirms before anything enters the plan. No automatic contact or selling.
- Learning coach: link Reflection, conversion and coaching history to Needs Analysis, Objection Handling, Product Knowledge or courses. AI Roleplay is a later idea.
- Trust rules: show data source, update date, assumptions and uncertainty; separate advice from fact; never invent sales, bonus rules or missing customer data. Leaders get skill gaps and coaching opportunities only inside their reporting line.

## Leader journey and coaching

- Unit Manager: morning Team Pulse, who needs help, income and bonus opportunity; during the day individual coaching and activity follow-up; end of day progress and next actions.
- MM1 / MM2: units growing or slowing, support managers, run a Skill Clinic for shared problems, line trends in results, income and skill gap.
- Agency Owner: office health, resource allocation, leader support, team development plan, trend against target.
- Team Income Intelligence: Actual and Forecast kept apart, with APE, case count, active agents, people near a bonus threshold, drill-down by rights.
- Coaching Action Tracker: topic, owner, coachee, date, status, coaching outcome, practice plan, follow-up date.
- Closed loop: Agent Activity, Sales Reflection, AI Skill Analysis, Manager Coaching, Skill Development, Productivity Improvement, Daily Pulse.
- Evaluation compares activity and conversion before and after over a suitable period, and does not claim coaching caused the change when data is thin.

## Calculation and data governance

- Three data layers: Agent input (activity and history), Simulation (changeable estimates), Company verified (real results, income, qualification). Never add Pending to Actual.
- Recalculation: activity updates Productivity activity measures at once; company-verified data updates Performance, case-based Productivity measures and related milestones; Growth skill measures need not move with every APE change.
- Definitions to confirm: conversion uses cohorts and consistent windows; case size = verified APE / eligible cases when the denominator is above zero; APE/NBC, bonus, persistency and qualification formulas need company confirmation.
- Access: role-based plus reporting-line scope, checked server-side on every request including AI retrieval; audit log, retention, encryption and PDPA review are implementation proposals.
- Data quality: show last-updated time and stale or missing status; stable IDs and idempotent imports prevent double counting; missing data shows as unknown, never as zero.

## Handoff and next decisions

- Phase 1, functional definition: confirm minimum fields, funnel statuses, customer/policy mapping, data sources, update frequency, field-level rights, the three ring score definitions, qualification and compensation rules.
- Phase 2, UX prototype: agent journey first (Home, Performance, Productivity, Growth, Activity, Customer Portfolio, Reflection, Pending, AI Coach), then the three leader views.
- Phase 3, MVP proposal: start with mock data and loggable activities; test matching and role isolation before connecting company data; no real customer data until security approval.
- Acceptance scenarios: an agent cannot see others' data; MM1/MM2 do not cross lines; the 50,000 to 46,000 case is not double counted; a not-approved case stays in history; AI creates no real results; Reflection links to Coaching and Next Action.
- Open decisions: UX/UI, score formulas, API, company schema, data cycle, income-rights detail, product-mix categorization, retention, MVP scope. The dedicated sales tool stays deferred.

## Working rules

- Write in Thai with English business terms (Performance, Productivity, Growth, Pending, Verified, Coaching, Pipeline).
- Mark assumptions, examples and illustrative numbers explicitly in every screen and document.
- Use the role names Agency Owner, MM1 / MM2, Unit Manager, Agent, in that order.
- Keep versioned decisions; do not overwrite an agreed requirement without confirmation, and say which blueprint section a change touches.
- The current prototype lives as a Claude Artifact named "GA Insurance"; earlier "GA on app" prototypes predate this blueprint.

## Owner-requested additions beyond Blueprint v0.2

These were added to the prototype on the owner's request (26 November 2026) and are not yet in the blueprint. Keep them, and flag them as additions until a blueprint version adopts them.

- **Learning Roadmap and Passport** (More, and linked from the Growth ring): seven milestones by tenure (start, first 30 days, 90 days, 6 months, 12 months, 24 months, leader track), four stamps each: Learn, Practice, Apply, Result. A milestone passes only with all four. Result stamps come from company-verified data only and never change official qualification. Unit Managers verify Practice stamps; leaders see team distribution, items awaiting review and agents behind plan within their reporting line. Milestone content is sample content.
- **Office Banner** on Home, placed under the Business Pulse so status still comes first: Event, Team Challenge, Promotion, Knowledge. The Team Challenge ranks units on activity versus plan, not sales, and shows only units inside the viewer's line. Prizes, contest rules and promotional material need company approval.
