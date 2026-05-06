# 🌡️ Thermal Survival

> A comprehensive temperature and survival experience for Minecraft Bedrock Edition,
> combining and expanding upon the mechanics of Scorchful, Frostiful, and Thermoo
> from Java Edition — rebuilt from the ground up for Bedrock.



![Status](https://img.shields.io/badge/Status-Work%20In%20Progress-yellow)




![Version](https://img.shields.io/badge/Minecraft-1.21.90%2B-green)




![License](https://img.shields.io/badge/License-Custom%20ARR-red)



---

## 📖 About

Thermal Survival is an original Minecraft Bedrock add-on that combines and expands
the mechanics of 3 Java mods and 2 Bedrock add-ons into a single unified survival
experience. This is not a simple port — every system has been rebuilt and extended
specifically for Bedrock Edition.

**Inspired by:**
- [Scorchful](https://modrinth.com/mod/scorchful) by TheDeathlyCow
- [Frostiful](https://modrinth.com/mod/frostiful) by TheDeathlyCow  
- [Thermoo](https://modrinth.com/mod/thermoo) by TheDeathlyCow
- [Adventure Condiment](https://www.curseforge.com/minecraft-bedrock/addons/adventure-condiment) by qduoubp
- [Forging Table](https://www.curseforge.com/minecraft-bedrock/addons/forging-table) by qduoubp

---

## ✨ Features

### 🌡️ Temperature System
- Dynamic body temperature based on biome, weather, time of day, and altitude
- Chunk-based light map scanning for heat sources
- Smooth temperature interpolation with `mix()` and `smoothstep()`
- Temperature immunity for Creative and Spectator mode
- Area and per-player temperature modifiers via commands
- Temperature persists across sessions via DynamicProperty

### 🥵 Heat Mechanics (Scorchful-inspired)
- Passive heating in warm biomes (Desert, Savanna, Jungle, Badlands)
- Heat effects from Sun exposure
- Heatstroke effects: weakness, hunger, mining fatigue
- Burnt heart overlay on HUD
- Sun Hat reduces heat from sun exposure
- Desert armor set for heat resistance
- Sand Pile and Red Sand Pile blocks
- Cactus Juice and Water Skin items
- Crimson Lily plant in the Nether

### 🥶 Cold Mechanics (Frostiful-inspired)
- Passive freezing in cold biomes
- Icicle blocks that form naturally
- Brittle Ice mechanics
- Frozen wall torch
- Freezing wind ambience
- Frozen heart overlay on HUD
- Camera shake and cold breath particles when freezing
- Slowness effect when cold
- Instant death when frozen threshold is reached
- Fur armor set for cold resistance
- Ice Skates and Armored Ice Skates
- Frostology Cloak
- Frost Wand
- Glacial Arrow
- Biter, Chillager, and Frostologer mobs
- Frostologer 3-phase combat system

### 💧 Thirst System (Adventure Condiment-inspired)
- Thirst bar displayed on HUD
- Soaked level indicator
- Dirty water mechanic
- Water Flask item
- Thirst integration with vanilla and modded foods
- Cross-addon compatibility via custom components

### 🔨 Forging System (Forging Table-inspired)
- New Forging Table block
- Disenchanting mechanic
- Developer API for custom forging recipes

### 🧪 Armor & Items
- Temperature resistance and insulation system per armor piece
- Vanilla armor temperature values balanced
- Custom armor sets: Winter, Desert, Fur, Fur Padded Chainmail
- Turtle armor temperature support
- Heater item system (keeps player warm when cold)

### 🌍 World Generation
- Emberbloom block with snow-melting mechanic
- Emberbloom particles

### 🖥️ HUD & UI
- Temperature bar (0-20 scale)
- Burnt heart overlay (heat damage indicator)
- Frozen heart overlay (cold damage indicator)
- Thirst bar
- Soaked indicator
- Temperature resistance bar
- Thermometer item

---

## 🐛 Known Bugs

### 🔴 Critical
- `crimson_pitcher` — texture `cauldron_water` missing from
  `terrain_texture.json`, causes visual error
- `chiller_box` and `heater_box` — not connected to scripts,
  currently non-functional

### 🟡 Missing Content (Work In Progress)

#### Frostiful — Blocks not yet ported
- `cold/cool/warm/hot_sun_lichen`
- `cut_blue_ice` slab, stairs, wall
- `cut_packed_ice` slab, stairs, wall
- `packed_snow_bricks` slab, stairs, wall
- `icicle` (block)
- `frozen_wall_torch`
- `icy_trial_spawner`
- `icy_vault`

#### Frostiful — Items not yet ported
- `inert_frostology_cloak`
- `frosty/glacial/snow_man armor trim smithing template`
- `ice_skate_upgrade_template`
- `fur_upgrade_template`
- `frostology/icicle/snowflake banner pattern`
- `ominous_castle_key`

> ⚠️ Smithing templates and banner patterns have no
> equivalent in current Bedrock API — will be implemented
> with alternative mechanics

#### Frostiful — Missing recipes
- cut_blue_ice variants, cut_packed_ice variants
- packed_snow_bricks variants
- brittle_ice, ice_pane, glacial_arrow
- frost_wand, frostology_cloak, frozen_rod
- fur_padding, armored_ice_skates, ice_skates (smithing)

#### Scorchful — Missing recipes
- sand_pile, red_sand_pile (and reverse)
- quartz_from_dust
- water_skin

#### Scorchful — Missing features
- Potion of Paranoia (no equivalent in Bedrock yet)
- Enchantment "Rehydration" (pending Bedrock enchant API)
- Waterskin 3-state system (empty/partial/filled)
- Sun Hat heat reduction not yet connected to armor.js

#### World Generation — Missing
- `crimson_lily` feature rule (Nether spawn)
- `sand_pile` and `red_sand_pile` natural spawn in deserts
- Warped Lily Farm structure

#### Sounds — Missing
- brittle_ice: crack, snap
- packed_snow: break, step
- ice_skating: glide, skate, stop
- wind: howl, woosh
- mob/biter, mob/frostologer sounds
- entity/frost_spell, break_binding_curse

#### Structures — Not yet built
- Chillager Outpost (snowy plains/ice spikes)
- Frostologer's Castle (rare, boss dungeon)

#### Mob Behaviour — Incomplete
- Frostologer 3-phase transition not fully implemented
- Chillager natural spawn (requires Chillager Outpost)
- Biter does not break brittle_ice when walking over it

---

## 📋 Development Progress

| System | Status |
|---|---|
| Temperature Engine | ✅ Complete |
| Heat Mechanics | 🟡 70% |
| Cold Mechanics | 🟡 70% |
| Thirst System | ✅ Complete |
| Forging System | 🟡 Partial |
| Armor System | ✅ Complete |
| HUD / UI | ✅ Complete |
| World Generation | 🔴 Partial |
| Sounds | 🔴 Missing |
| Structures | 🔴 Not started |
| Mob Behaviour | 🟡 Partial |

---

## ⚙️ Requirements

- Minecraft Bedrock Edition **1.21.90+**
- Enable **Holiday Creator Features**
- Enable **Beta APIs**
- Enable **Upcoming Creator Features**

---

## 📦 Installation

1. Download both `.mcpack` files (BP and RP)
2. Open each file with Minecraft
3. Apply both packs to your world
4. Enable the required experiments listed above
5. Enjoy! 🌡️

---

## 👤 Credits

| Role | Name |
|---|---|
| Developer | AlpSaymoreStudio |
| Scorchful, Frostiful, Thermoo | TheDeathlyCow |
| Adventure Condiment, Forging Table | qduoubp |

---

## 📜 License

This project is licensed under a Custom License.
See [LICENSE](./LICENSE.md) for details.
