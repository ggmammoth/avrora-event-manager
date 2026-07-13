-- AvroraMU Event Manager: public sample data
-- Run fourth. No auth users are inserted by this script.

insert into public.categories (name, description) values
  ('PvP Tournaments', 'Competitive player-versus-player battles for glory and rewards.'),
  ('Castle Siege', 'Large-scale guild warfare for control of the castle.'),
  ('PvE Challenges', 'Cooperative hunts, boss encounters, and survival trials.'),
  ('Community', 'Social gatherings, celebrations, and creative community events.')
on conflict (name) do update set description = excluded.description;

insert into public.events (category_id, title, short_description, description, event_date, location, max_participants, is_active)
values
  ((select id from public.categories where name = 'PvP Tournaments'), 'Crown of the Blood Arena', 'A fast-paced elimination tournament for the realm’s most disciplined duelists.', 'Enter the Blood Arena and survive a sequence of escalating duels. Competitors are seeded into balanced brackets, with the final two warriors meeting in a best-of-three championship. Consumable and equipment rules will be announced before check-in.', '2027-02-20 18:00:00+00', 'Blood Castle Arena', 32, true),
  ((select id from public.categories where name = 'Castle Siege'), 'Siege of Loren Keep', 'Guilds assemble for a decisive campaign to claim Loren Castle.', 'The banners rise over Loren. Registered guild representatives must report before the tactical briefing. Alliances, crown interactions, and point scoring follow the official server siege rules. Downloadable rules may be attached later through the admin panel.', '2027-03-06 17:00:00+00', 'Loren Valley', 80, true),
  ((select id from public.categories where name = 'PvE Challenges'), 'Kundun’s Last Stand', 'Form an elite party and face the ancient lord at the deepest level of Kalima.', 'Parties race through Kalima to defeat Kundun within the time limit. Coordination, balanced classes, and careful resource management will decide which team earns the fastest-clear title.', '2027-03-21 19:30:00+00', 'Kalima 7', 40, true),
  ((select id from public.categories where name = 'Community'), 'Avrora Fashion Gala', 'Show the realm your most striking armor combination and character story.', 'A relaxed community showcase judged on visual identity, originality, and a short character backstory. Participants will take the stage one at a time before the community vote opens.', '2027-04-10 16:00:00+00', 'Devias Square', 50, true),
  ((select id from public.categories where name = 'PvP Tournaments'), 'Chaos Castle Masters', 'No alliances, no retreat—only one fighter leaves Chaos Castle victorious.', 'A classic last-player-standing contest across several qualification rounds. Brackets are separated where necessary for competitive balance. Final placement is determined by survival and elimination count.', '2027-04-24 18:30:00+00', 'Chaos Castle', 48, true),
  ((select id from public.categories where name = 'PvE Challenges'), 'Crywolf Defense Vanguard', 'Defend the altar and protect the realm in a coordinated server-wide operation.', 'Players unite to defend Crywolf Fortress against waves of Balgass forces. Class leads will organize squads before the assault. Success depends on protecting the contracted elves and maintaining every defensive line.', '2027-05-08 17:30:00+00', 'Crywolf Fortress', 100, true)
on conflict do nothing;

-- After real users register, create registrations and comments through the app so
-- auth.uid(), foreign keys, and RLS are exercised. Do not insert fake auth.users rows.
