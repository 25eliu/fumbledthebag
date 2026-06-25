import type { Item } from "@/lib/types";

// THE ONE FILE TO EDIT. Add/remove items freely.
// price is an APPROXIMATION (drives qty = floor(amount/price)); the url is the
// source of truth for the real price. scale buckets: everyday <$100 |
// aspirational $100-$10k | flex $10k-$500k | absurd >$500k.
export const ITEMS: Item[] = [
  // ── everyday (<$100) ──────────────────────────────────────────────
  { icon: "🌯", name: "Chipotle burritos", price: 12, scale: "everyday", url: "https://www.chipotle.com/order", blurb: "Guac included, obviously." },
  { icon: "☕", name: "oat-milk lattes", price: 6, scale: "everyday", url: "https://www.starbucks.com/menu", blurb: "Caffeinated regret." },
  { icon: "🍕", name: "large pizzas", price: 18, scale: "everyday", url: "https://www.dominos.com/en/pages/order/menu", blurb: "Friday sorted forever." },
  { icon: "🎮", name: "AAA video games", price: 70, scale: "everyday", url: "https://store.steampowered.com/", blurb: "Backlog of dreams." },
  { icon: "☄️", name: "real meteorite fragments", price: 35, scale: "everyday", url: "https://www.amazon.com/s?k=genuine+meteorite+fragment", blurb: "Older than your grudge." },
  { icon: "🚀", name: "packs of astronaut ice cream", price: 8, scale: "everyday", url: "https://www.amazon.com/s?k=astronaut+ice+cream", blurb: "Freeze-dried disappointment." },
  { icon: "⭐", name: "name-a-star kits", price: 30, scale: "everyday", url: "https://www.amazon.com/s?k=name+a+star+kit", blurb: "Legally meaningless. Emotionally huge." },
  { icon: "🦖", name: "dino-bone fossil chips", price: 45, scale: "everyday", url: "https://www.amazon.com/s?k=dinosaur+bone+fossil", blurb: "65 million years > your timing." },
  { icon: "📀", name: "vinyl records", price: 30, scale: "everyday", url: "https://www.amazon.com/s?k=vinyl+records", blurb: "Crackle of what-ifs." },
  { icon: "🧱", name: "LEGO sets", price: 60, scale: "everyday", url: "https://www.lego.com/en-us/categories/adults-welcome", blurb: "Build something that appreciates." },
  { icon: "🪴", name: "houseplants", price: 25, scale: "everyday", url: "https://www.thesill.com/collections/all-plants", blurb: "More growth than your portfolio." },
  { icon: "🌶️", name: "hot-sauce sampler sets", price: 40, scale: "everyday", url: "https://www.amazon.com/s?k=hot+sauce+gift+set", blurb: "Spicier than your regret." },
  { icon: "🎧", name: "AirPods", price: 100, scale: "everyday", url: "https://www.apple.com/airpods/", blurb: "To drown out the news." },
  { icon: "🃏", name: "Pokémon booster boxes", price: 90, scale: "everyday", url: "https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon", blurb: "Gotta lose 'em all." },
  { icon: "🧦", name: "absurd designer socks", price: 15, scale: "everyday", url: "https://www.amazon.com/s?k=novelty+socks", blurb: "Knock 'em off." },

  // ── aspirational ($100–$10k) ──────────────────────────────────────
  { icon: "👟", name: "retro Air Jordans", price: 200, scale: "aspirational", url: "https://www.nike.com/w/jordan-shoes-37eef", blurb: "Never worn, obviously." },
  { icon: "🤖", name: "million GPT-4 tokens", price: 30, scale: "aspirational", url: "https://openai.com/api/pricing/", blurb: "A novel's worth of vibes." },
  { icon: "🛰️", name: "Starlink kits", price: 349, scale: "aspirational", url: "https://www.starlink.com/", blurb: "Internet from space, regret on Earth." },
  { icon: "🎟️", name: "Sphere Las Vegas tickets", price: 300, scale: "aspirational", url: "https://www.thespherevegas.com/", blurb: "A globe inside a globe." },
  { icon: "📱", name: "iPhone Pro Maxes", price: 1200, scale: "aspirational", url: "https://www.apple.com/iphone/", blurb: "One per pocket." },
  { icon: "💻", name: "MacBook Pros", price: 2500, scale: "aspirational", url: "https://www.apple.com/macbook-pro/", blurb: "For the spreadsheets of grief." },
  { icon: "🛸", name: "DJI camera drones", price: 1000, scale: "aspirational", url: "https://www.dji.com/products/comparison-consumer-drones", blurb: "For a bird's-eye view of the L." },
  { icon: "🎸", name: "Gibson Les Pauls", price: 2500, scale: "aspirational", url: "https://www.gibson.com/en-US/Guitars/Les-Paul", blurb: "Play the blues you earned." },
  { icon: "🚲", name: "carbon road bikes", price: 4000, scale: "aspirational", url: "https://www.trekbikes.com/us/en_US/bikes/road-bikes/c/B200/", blurb: "Outrun your decisions." },
  { icon: "🪙", name: "1 oz gold coins", price: 2200, scale: "aspirational", url: "https://www.apmex.com/category/10000/gold-coins", blurb: "Shiny, smug." },
  { icon: "🖥️", name: "RTX 5090 graphics cards", price: 2000, scale: "aspirational", url: "https://www.nvidia.com/en-us/geforce/graphics-cards/", blurb: "Render your what-ifs in 4K." },
  { icon: "🛋️", name: "Eames lounge chairs", price: 6000, scale: "aspirational", url: "https://www.hermanmiller.com/products/seating/lounge-seating/eames-lounge-chair-and-ottoman/", blurb: "Sit with your choices." },
  { icon: "📈", name: "shares of Berkshire (Class B)", price: 450, scale: "aspirational", url: "https://finance.yahoo.com/quote/BRK-B/", blurb: "Let Warren feel your pain." },
  { icon: "🎿", name: "season ski passes", price: 1000, scale: "aspirational", url: "https://www.epicpass.com/", blurb: "Downhill, like your entry point." },
  { icon: "🪑", name: "Herman Miller Aerons", price: 1500, scale: "aspirational", url: "https://www.hermanmiller.com/products/seating/office-chairs/aeron-chairs/", blurb: "Ergonomic doomscrolling." },
  { icon: "⌚", name: "Rolex Submariners", price: 10000, scale: "aspirational", url: "https://www.rolex.com/watches/submariner", blurb: "Time you'll never get back." },

  // ── flex ($10k–$500k) ─────────────────────────────────────────────
  { icon: "🏎️", name: "used Porsche 911s", price: 80000, scale: "flex", url: "https://www.cargurus.com/Cars/l-Used-Porsche-911-d309", blurb: "Vroom of shame." },
  { icon: "🪙", name: "kilos of gold", price: 90000, scale: "flex", url: "https://www.apmex.com/category/30000/gold-bars", blurb: "Pirate-grade flex." },
  { icon: "🖼️", name: "signed Banksy prints", price: 40000, scale: "flex", url: "https://www.sothebys.com/en/buy/_banksy", blurb: "Art about throwing money away. Fitting." },
  { icon: "🐎", name: "racehorse ownership shares", price: 25000, scale: "flex", url: "https://www.myracehorse.com/", blurb: "Bet on a different animal." },
  { icon: "💍", name: "1-carat diamonds", price: 6000, scale: "flex", url: "https://www.bluenile.com/diamonds/round-cut", blurb: "Pressure makes... regret." },
  { icon: "🚗", name: "Tesla Model S Plaids", price: 90000, scale: "flex", url: "https://www.tesla.com/models", blurb: "0-60 faster than your gains." },
  { icon: "🏠", name: "median home down payments", price: 80000, scale: "flex", url: "https://www.zillow.com/", blurb: "Equity you'll never know." },
  { icon: "⌚", name: "Patek Philippe watches", price: 40000, scale: "flex", url: "https://www.patek.com/en/collection", blurb: "You never actually own it." },
  { icon: "🛻", name: "Tesla Cybertrucks", price: 100000, scale: "flex", url: "https://www.tesla.com/cybertruck", blurb: "Bulletproof, unlike your thesis." },
  { icon: "🖥️", name: "NVIDIA H100 GPUs", price: 30000, scale: "flex", url: "https://www.nvidia.com/en-us/data-center/h100/", blurb: "Mine your sorrows." },
  { icon: "🐵", name: "Bored Ape NFTs", price: 80000, scale: "flex", url: "https://opensea.io/collection/boredapeyachtclub", blurb: "Right-click and weep." },
  { icon: "🤖", name: "billion GPT-4 tokens", price: 60000, scale: "flex", url: "https://openai.com/api/pricing/", blurb: "Enough to overthink everything." },
  { icon: "💎", name: "Rolex Daytonas", price: 35000, scale: "flex", url: "https://www.rolex.com/watches/cosmograph-daytona", blurb: "Timing is everything. You'd know." },
  { icon: "🏍️", name: "Harley-Davidsons", price: 25000, scale: "flex", url: "https://www.harley-davidson.com/us/en/motorcycles/index.html", blurb: "Loud enough to forget." },
  { icon: "🚁", name: "used Robinson R22 helicopters", price: 300000, scale: "flex", url: "https://www.controller.com/listings/for-sale/robinson/r22/aircraft", blurb: "Rise above it. Literally." },

  // ── absurd (>$500k) ───────────────────────────────────────────────
  { icon: "🛥️", name: "entry-level yachts", price: 500000, scale: "absurd", url: "https://www.boattrader.com/boats/type-power/class-flybridge/", blurb: "Seasick with envy." },
  { icon: "✈️", name: "light private jets", price: 4000000, scale: "absurd", url: "https://www.controller.com/listings/for-sale/cessna/citation-cj3/aircraft", blurb: "Skip the L in first class." },
  { icon: "🏝️", name: "private islands", price: 2000000, scale: "absurd", url: "https://www.privateislandsonline.com/islands-for-sale", blurb: "Population: your ego." },
  { icon: "🚀", name: "Blue Origin space seats", price: 1500000, scale: "absurd", url: "https://www.blueorigin.com/new-shepard/", blurb: "Leave the planet that did this to you." },
  { icon: "🏎️", name: "Bugatti Chirons", price: 3500000, scale: "absurd", url: "https://www.bugatti.com/models/", blurb: "1,500 horses of pure cope." },
  { icon: "🖼️", name: "blue-chip auction paintings", price: 5000000, scale: "absurd", url: "https://www.christies.com/en/results", blurb: "Hang your hubris." },
  { icon: "🦖", name: "real T. rex skeletons", price: 8000000, scale: "absurd", url: "https://www.sothebys.com/en/buy/auction", blurb: "Extinct, like your entry price." },
  { icon: "🏰", name: "French châteaux", price: 5000000, scale: "absurd", url: "https://www.sothebysrealty.com/eng/sales/fra", blurb: "Brood with a moat." },
  { icon: "🛰️", name: "rideshare satellite launches", price: 1000000, scale: "absurd", url: "https://www.spacex.com/rideshare/", blurb: "Put your regret into orbit." },
  { icon: "🤖", name: "ten billion GPT-4 tokens", price: 600000, scale: "absurd", url: "https://openai.com/api/pricing/", blurb: "Simulate a universe where you bought in." },
  { icon: "🚁", name: "new turbine helicopters", price: 1200000, scale: "absurd", url: "https://robinsonheli.com/r66-turbine/", blurb: "Commute over the carnage." },
  { icon: "💼", name: "seats on a SpaceX Dragon", price: 55000000, scale: "absurd", url: "https://www.spacex.com/human-spaceflight/", blurb: "There is no escaping it. Try anyway." },
];
