/* ==========================================================================
   site.config.js — THE ONLY place contact details live (PRD.md §6)

   Replace every REPLACE_ME below once. Every page reads these values, either
   at runtime via js/modules/config.js (hydrate) or baked into href and
   JSON-LD attributes by tools/sync-partials.js so they survive with
   JavaScript disabled.

   Never hardcode a phone number, email or address into an HTML file.
   ========================================================================== */

export const SITE = {
  name:        "OVI IoT Solutions",
  shortName:   "OVI",
  tagline:     "Smart IoT Solutions for Connected Infrastructure",
  url:         "https://REPLACE_ME.com",          // production domain, no trailing slash
  email:       "REPLACE_ME@domain.com",
  phone:       "+00 000 000 0000",                 // display format
  phoneRaw:    "+000000000000",                    // tel: format, digits and + only
  whatsapp:    "000000000000",                     // international, no + and no spaces
  address: {
    line1:   "REPLACE_ME",
    line2:   "REPLACE_ME",
    city:    "REPLACE_ME",
    region:  "REPLACE_ME",
    postal:  "REPLACE_ME",
    country: "REPLACE_ME",
  },
  map:         { lat: 0.0, lng: 0.0, zoom: 15 },   // for Leaflet
  hours:       "REPLACE_ME",                        // e.g. "Sun-Thu, 09:00-18:00"
  social: {                                         // omit any that don't exist — do not invent profiles
    linkedin: "",
    x:        "",
    youtube:  "",
  },
  web3formsKey: "REPLACE_ME",                       // https://web3forms.com — free, no backend

  /* Prefilled WhatsApp click-to-chat message (PRD F5). */
  whatsappMessage: "Hello OVI IoT Solutions — I'd like to discuss an IoT project.",
};
