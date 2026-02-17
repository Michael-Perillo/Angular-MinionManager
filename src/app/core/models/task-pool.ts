import { TaskTemplate } from './task.model';

export const TASK_POOL: TaskTemplate[] = [
  // ===== SCHEMES =====
  // Petty
  { name: 'Forge Hall Passes', description: 'Create convincing hall passes for sneaking around.', category: 'schemes', tier: 'petty' },
  { name: 'Rig the Lottery', description: 'Subtly adjust the numbers in your favor.', category: 'schemes', tier: 'petty' },
  { name: 'Spread Rumors', description: 'Plant false stories to sow confusion among rivals.', category: 'schemes', tier: 'petty' },
  { name: 'Tamper with Signs', description: 'Redirect traffic to cause minor chaos.', category: 'schemes', tier: 'petty' },
  { name: 'Steal Lunch Money', description: 'Shake down unsuspecting do-gooders for pocket change.', category: 'schemes', tier: 'petty' },
  // Sinister
  { name: 'Blackmail the Mayor', description: 'Acquire compromising photos for leverage.', category: 'schemes', tier: 'sinister' },
  { name: 'Infiltrate the Council', description: 'Plant a spy in the city council meetings.', category: 'schemes', tier: 'sinister' },
  { name: 'Frame a Rival', description: 'Set up evidence to implicate a competing villain.', category: 'schemes', tier: 'sinister' },
  { name: 'Corrupt the Inspector', description: 'Bribe building inspectors to look the other way.', category: 'schemes', tier: 'sinister' },
  { name: 'Forge Royal Decrees', description: 'Create official-looking documents for nefarious purposes.', category: 'schemes', tier: 'sinister' },
  // Diabolical
  { name: 'Overthrow the Guild', description: 'Execute a hostile takeover of the local guild.', category: 'schemes', tier: 'diabolical' },
  { name: 'Master Plan Alpha', description: 'Orchestrate a city-wide scheme of deception.', category: 'schemes', tier: 'diabolical' },
  { name: 'Double Agent Network', description: 'Establish agents in every major organization.', category: 'schemes', tier: 'diabolical' },

  // ===== HEISTS =====
  // Petty
  { name: 'Pilfer the Tip Jar', description: 'Swipe coins from an unattended tip jar.', category: 'heists', tier: 'petty' },
  { name: 'Snatch a Purse', description: 'Quick grab-and-run from a distracted pedestrian.', category: 'heists', tier: 'petty' },
  { name: 'Rob a Lemonade Stand', description: 'The most dastardly of petty crimes.', category: 'heists', tier: 'petty' },
  { name: 'Pocket the Silverware', description: 'Dine and swipe at a fancy restaurant.', category: 'heists', tier: 'petty' },
  { name: 'Swipe Library Books', description: 'Take rare editions without checking them out.', category: 'heists', tier: 'petty' },
  // Sinister
  { name: 'Museum Night Raid', description: 'Break in after hours for a priceless artifact.', category: 'heists', tier: 'sinister' },
  { name: 'Jewel Store Heist', description: 'Crack the display cases for sparkling loot.', category: 'heists', tier: 'sinister' },
  { name: 'Vault Cracking', description: 'Break into a bank vault with precision tools.', category: 'heists', tier: 'sinister' },
  { name: 'Armored Car Ambush', description: 'Intercept a cash transport on route.', category: 'heists', tier: 'sinister' },
  { name: 'Casino Chip Swap', description: 'Replace real chips with counterfeits.', category: 'heists', tier: 'sinister' },
  // Diabolical
  { name: 'The Crown Jewels Job', description: 'The heist of the century - steal the crown jewels.', category: 'heists', tier: 'diabolical' },
  { name: 'Fort Knox Breach', description: 'Penetrate the most secure vault in the world.', category: 'heists', tier: 'diabolical' },
  { name: 'Space Station Robbery', description: 'Rob the orbital research station of its treasures.', category: 'heists', tier: 'diabolical' },

  // ===== RESEARCH =====
  // Petty
  { name: 'Mix Stink Bombs', description: 'Brew a particularly foul concoction.', category: 'research', tier: 'petty' },
  { name: 'Invent Itching Powder', description: 'A classic formula for maximum annoyance.', category: 'research', tier: 'petty' },
  { name: 'Study Lock Picking', description: 'Practice on padlocks from the hardware store.', category: 'research', tier: 'petty' },
  { name: 'Brew Sleeping Potion', description: 'A mild sedative for guard dogs.', category: 'research', tier: 'petty' },
  { name: 'Decode Secret Messages', description: 'Crack a simple cipher from intercepted notes.', category: 'research', tier: 'petty' },
  // Sinister
  { name: 'Build a Shrink Ray', description: 'Miniaturize objects (and enemies) at will.', category: 'research', tier: 'sinister' },
  { name: 'Develop Mind Control Serum', description: 'A formula to bend wills temporarily.', category: 'research', tier: 'sinister' },
  { name: 'Craft Smoke Grenades', description: 'Perfect the vanishing act for quick escapes.', category: 'research', tier: 'sinister' },
  { name: 'Engineer Trap Doors', description: 'Design hidden escape routes and traps.', category: 'research', tier: 'sinister' },
  { name: 'Forge Disguise Kit', description: 'Create a kit of realistic disguises.', category: 'research', tier: 'sinister' },
  // Diabolical
  { name: 'Build a Doomsday Device', description: 'The ultimate bargaining chip for world domination.', category: 'research', tier: 'diabolical' },
  { name: 'Create Clone Army', description: 'Mass-produce loyal duplicates of your best minion.', category: 'research', tier: 'diabolical' },
  { name: 'Invent Time Machine', description: 'Bend time itself to your villainous will.', category: 'research', tier: 'diabolical' },

  // ===== MAYHEM =====
  // Petty
  { name: 'TP the Hero\'s House', description: 'Classic toilet paper bombardment.', category: 'mayhem', tier: 'petty' },
  { name: 'Release the Pigeons', description: 'Unleash birds in a shopping mall.', category: 'mayhem', tier: 'petty' },
  { name: 'Glitter Bomb Delivery', description: 'Send sparkly chaos to unsuspecting victims.', category: 'mayhem', tier: 'petty' },
  { name: 'Rearrange Street Signs', description: 'Cause navigational confusion citywide.', category: 'mayhem', tier: 'petty' },
  { name: 'Clog the Fountains', description: 'Fill public fountains with bubble bath.', category: 'mayhem', tier: 'petty' },
  // Sinister
  { name: 'Unleash Robot Swarm', description: 'Deploy tiny robots to cause widespread mischief.', category: 'mayhem', tier: 'sinister' },
  { name: 'Sabotage the Power Grid', description: 'Plunge a district into darkness.', category: 'mayhem', tier: 'sinister' },
  { name: 'Flood the Subway', description: 'Redirect water mains into the transit tunnels.', category: 'mayhem', tier: 'sinister' },
  { name: 'Hack the Billboards', description: 'Display your evil manifesto on every screen.', category: 'mayhem', tier: 'sinister' },
  { name: 'Release the Kraken', description: 'Summon a sea beast in the harbor.', category: 'mayhem', tier: 'sinister' },
  // Diabolical
  { name: 'Volcano Activation', description: 'Trigger a dormant volcano near the city.', category: 'mayhem', tier: 'diabolical' },
  { name: 'Summon a Meteor', description: 'Call down space rocks for maximum drama.', category: 'mayhem', tier: 'diabolical' },
  { name: 'Unleash the Kaiju', description: 'Wake the ancient beast beneath the city.', category: 'mayhem', tier: 'diabolical' },

  // ===== LEGENDARY =====
  // Schemes
  { name: 'Shadow Government', description: 'Install puppet leaders across every nation. Total control achieved.', category: 'schemes', tier: 'legendary' },
  { name: 'Rewrite Reality', description: 'Gaslight the entire world into believing your version of history.', category: 'schemes', tier: 'legendary' },

  // Heists
  { name: 'Steal the Moon', description: 'The ultimate heist — shrink and pocket Earth\'s moon.', category: 'heists', tier: 'legendary' },
  { name: 'Loot the Multiverse', description: 'Rob parallel dimensions of their most valuable artifacts.', category: 'heists', tier: 'legendary' },

  // Research
  { name: 'Achieve Singularity', description: 'Create an AI so powerful it bends reality to your will.', category: 'research', tier: 'legendary' },
  { name: 'Entropy Reversal Engine', description: 'Conquer thermodynamics itself. Nothing decays unless you allow it.', category: 'research', tier: 'legendary' },

  // Mayhem
  { name: 'Crack the Planet', description: 'Split the Earth\'s crust open. Continental-scale destruction.', category: 'mayhem', tier: 'legendary' },
  { name: 'Summon Cthulhu', description: 'Awaken the elder god from the deep. Reality itself trembles.', category: 'mayhem', tier: 'legendary' },
];
