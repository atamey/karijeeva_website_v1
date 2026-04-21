"""
Karijeeva seed script — idempotent.
Run: `python /app/backend/seed.py`

Inserts products, product_variants, recipes, blog_posts, testimonials,
faqs, site_settings, and a WELCOME10 coupon. Uses `slug` / `id` as
natural keys so re-running does not duplicate rows.
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

# ---------- Image assets (user-provided, hosted externally) ----------
IMG = {
    "hero_wide":      "https://static.prod-images.emergentagent.com/jobs/fd05c149-4e93-4435-972e-7efd90591424/images/7f8868067560a2333d0283c82b4ade885325035e1c89441e6cde6988ea0ebdd0.jpeg",
    "bottle_tall":    "https://static.prod-images.emergentagent.com/jobs/fd05c149-4e93-4435-972e-7efd90591424/images/2d498f95f4525d72eb922b41f9511ab0cd4b772370aa69765019e9d37c90272c.jpeg",
    "jar_overhead":   "https://static.prod-images.emergentagent.com/jobs/fd05c149-4e93-4435-972e-7efd90591424/images/2477b88fae05a1b43290848cf929d450756ef22714f7e334eaa34f59581b5321.jpeg",
    "three_variants": "https://static.prod-images.emergentagent.com/jobs/fd05c149-4e93-4435-972e-7efd90591424/images/29fc6c1ed92bd2cd2c0f684173810e426d4f618f58afb42c8030feece82ab8aa.jpeg",
    "kitchen":        "https://static.prod-images.emergentagent.com/jobs/fd05c149-4e93-4435-972e-7efd90591424/images/ab13ebb1ebb9fda6ade34d91a17858ab2721e19f85dcabfcae54bf1c0b7db24f.jpeg",
    "founder_farm":   "https://static.prod-images.emergentagent.com/jobs/fd05c149-4e93-4435-972e-7efd90591424/images/a374c5e1d1a09d972282afa143cd93b70baab8ecf3acdc03183f7a4115e4cd69.jpeg",
    "recipe_dosa":    "https://static.prod-images.emergentagent.com/jobs/fd05c149-4e93-4435-972e-7efd90591424/images/eb8c3a122402f79f3f2642a2f929ad72929a31d4040f6235ad5ba3e722ea6b6c.jpeg",
    "recipe_chutney": "https://static.prod-images.emergentagent.com/jobs/fd05c149-4e93-4435-972e-7efd90591424/images/bbb81c890a60f14d0bdf425bee9a2e5c1bcf937d9dd8040a827a23bcbdbcba2e.jpeg",
    # Curated Unsplash for remaining recipe/blog/testimonial imagery.
    # All use ?auto=format&fit=crop&w=1600&q=80 params.
    "unsplash_avial":     "https://images.unsplash.com/photo-1630409351217-bc4fa6422075?auto=format&fit=crop&w=1600&q=80",
    "unsplash_thenga":    "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=1600&q=80",
    "unsplash_beeffry":   "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1600&q=80",
    "unsplash_barfi":     "https://images.unsplash.com/photo-1606471191009-63994c53433b?auto=format&fit=crop&w=1600&q=80",
    "unsplash_coconuts":  "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1600&q=80",
    "unsplash_farm":      "https://images.unsplash.com/photo-1610415946035-bad6fc9d3073?auto=format&fit=crop&w=1600&q=80",
    "unsplash_spices":    "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1600&q=80",
    "unsplash_chekku":    "https://images.unsplash.com/photo-1611599537845-1c7aca0091c0?auto=format&fit=crop&w=1600&q=80",
    # Avatars for testimonials
    "avatar_1": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    "avatar_2": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    "avatar_3": "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80",
    "avatar_4": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
    "avatar_5": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80",
    "avatar_6": "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=200&q=80",
}

NOW = datetime.now(timezone.utc).isoformat()


# ---------- Products ----------
PRODUCTS = [
    {
        "slug": "virgin-cold-pressed-coconut-oil",
        "name": "Virgin Cold-Pressed Coconut Oil",
        "short_desc": "Small-batch, single-origin. Cold-pressed at dawn from hand-picked coconuts — for everyday cooking and daily rituals.",
        "long_desc": (
            "The Karijeeva flagship. Pressed below 35°C within hours of harvest, this virgin "
            "oil keeps its aroma, its lauric acid, and its soul intact. Drizzle on a hot dosa, "
            "stir into fresh chutney, warm between palms for a weekend champi. One oil, many rituals."
        ),
        "category": "wellness",
        "tags": ["cold-pressed", "virgin", "bestseller", "small-batch"],
        "benefits": [
            {"icon": "Leaf",       "title": "100% Natural",          "body": "No heat, no refining, no additives."},
            {"icon": "ChefHat",    "title": "Culinary Grade",        "body": "Smoke point ~177°C — dosas, tadka, deep-fry ready."},
            {"icon": "Heart",      "title": "Rich in Lauric Acid",   "body": "50%+ lauric acid content — unrefined goodness."},
            {"icon": "Sparkles",   "title": "Ayurveda Approved",     "body": "A pillar ingredient of traditional Indian wellness."},
        ],
        "how_to_use": [
            "Drizzle 1 tsp over hot dosas, appams, or steamed idiyappam.",
            "Temper curry leaves + mustard seeds for Kerala-style chutneys.",
            "Warm gently and use as champi oil — massage scalp in circular motions, rest for an hour.",
            "Oil pulling: 1 tbsp swished for 10 minutes, mornings, empty stomach.",
        ],
        "ingredients": "100% cold-pressed virgin coconut oil. That's it. Nothing added, nothing refined.",
        "is_featured": True,
        "is_new_launch": False,
        "is_active": True,
        "avg_rating": 4.9,
        "review_count": 1287,
        "gallery": [IMG["bottle_tall"], IMG["jar_overhead"], IMG["three_variants"], IMG["kitchen"]],
    },
    {
        "slug": "wood-pressed-coconut-oil",
        "name": "Wood-Pressed Coconut Oil (Chekku)",
        "short_desc": "The old way. Slow-pressed in a wooden chekku (ghani) at rural speeds — the way our grandmothers knew it.",
        "long_desc": (
            "Chekku oil, pressed in a wooden mortar turned by a single ox walking a quiet circle. "
            "No motors, no shortcuts. The result is a fuller, nuttier oil — perfect for seasoning "
            "cast-iron, frying pappadam, or the season's best avial."
        ),
        "category": "wellness",
        "tags": ["wood-pressed", "chekku", "traditional", "slow-made"],
        "benefits": [
            {"icon": "Sparkles",  "title": "Wooden Chekku",         "body": "Slow-pressed at <30°C in a traditional ghani."},
            {"icon": "Leaf",      "title": "Nuttier Aroma",         "body": "Deeper flavour than fast cold-press."},
            {"icon": "ShieldCheck","title": "FSSAI Certified",      "body": "Every batch third-party tested."},
            {"icon": "ChefHat",   "title": "Tempering Ready",       "body": "Perfect for Kerala-style curries & tadka."},
        ],
        "how_to_use": [
            "Use for tempering: heat, add mustard + urad dal + curry leaves.",
            "Brush on parathas and rotis for a nutty finish.",
            "Traditional seasoning oil for cast-iron tawas.",
            "Warm-oil scalp massage on Sundays.",
        ],
        "ingredients": "Single-ingredient: wood-pressed (chekku) coconut oil.",
        "is_featured": True,
        "is_new_launch": True,
        "is_active": True,
        "avg_rating": 4.8,
        "review_count": 642,
        "gallery": [IMG["jar_overhead"], IMG["bottle_tall"], IMG["kitchen"], IMG["three_variants"]],
    },
    {
        "slug": "cooking-coconut-oil-family-pack",
        "name": "Cooking Coconut Oil (Family Pack)",
        "short_desc": "Built for everyday cooking. A workhorse oil for dosas, chutneys, avial, and the Sunday beef fry.",
        "long_desc": (
            "The pack every Indian kitchen deserves. Same cold-pressed promise, sized for the "
            "family who cooks three meals a day. Great for deep-fry, tempering, and steamed "
            "puttu. Pairs beautifully with our recipe notebook."
        ),
        "category": "culinary",
        "tags": ["culinary", "family-pack", "everyday", "value"],
        "benefits": [
            {"icon": "ChefHat",   "title": "Made for Cooking",      "body": "Stable smoke point, rich aroma."},
            {"icon": "ShieldCheck","title": "Food-Safe Packaging",  "body": "Food-grade tin, oxygen-tight."},
            {"icon": "Heart",     "title": "Daily Value",           "body": "Family-pack pricing without compromise."},
            {"icon": "Leaf",      "title": "Zero Refining",         "body": "Unrefined, unbleached, undeodorised."},
        ],
        "how_to_use": [
            "Deep-fry plantain chips the Kerala way.",
            "Temper mustard, urad, curry leaves for dosa chutney.",
            "Coat mixer-jar for smoother coconut chutney grinding.",
            "Seasoning oil for cast-iron dosa tawa.",
        ],
        "ingredients": "100% cold-pressed coconut oil. Family-size tin.",
        "is_featured": True,
        "is_new_launch": False,
        "is_active": True,
        "avg_rating": 4.7,
        "review_count": 918,
        "gallery": [IMG["three_variants"], IMG["kitchen"], IMG["bottle_tall"], IMG["jar_overhead"]],
    },
]

# ---------- Variants (3 per product) ----------
def variants_for(product_slug, base_price):
    """250ml / 500ml / 1000ml variants. base_price is the 500ml price."""
    # Discount from a higher MRP so UI shows a savings %.
    return [
        {
            "id": str(uuid.uuid4()),
            "product_slug": product_slug,
            "size": "250ml",
            "sku": f"{product_slug[:3].upper()}-250",
            "price": round(base_price * 0.55),
            "mrp":   round(base_price * 0.65),
            "stock": 120,
        },
        {
            "id": str(uuid.uuid4()),
            "product_slug": product_slug,
            "size": "500ml",
            "sku": f"{product_slug[:3].upper()}-500",
            "price": base_price,
            "mrp":   round(base_price * 1.2),
            "stock": 200,
        },
        {
            "id": str(uuid.uuid4()),
            "product_slug": product_slug,
            "size": "1000ml",
            "sku": f"{product_slug[:3].upper()}-1L",
            "price": round(base_price * 1.85),
            "mrp":   round(base_price * 2.1),
            "stock": 150,
        },
    ]

PRODUCT_BASE_PRICES = {
    "virgin-cold-pressed-coconut-oil": 499,
    "wood-pressed-coconut-oil": 579,
    "cooking-coconut-oil-family-pack": 449,
}


# ---------- Recipes (6) ----------
RECIPES = [
    {
        "slug": "dosa-coconut-drizzle",
        "title": "Dosa with Golden Coconut-Oil Drizzle",
        "hero_image": IMG["recipe_dosa"],
        "short_desc": "The crispiest dosa has a secret: a quick drizzle of cold-pressed oil, just off the flame.",
        "ingredients": [
            "2 cups dosa batter (fermented overnight)",
            "2 tbsp Karijeeva Virgin Cold-Pressed Coconut Oil",
            "Pinch of sea salt",
            "Serve with coconut chutney + sambar",
        ],
        "steps": [
            "Heat cast-iron tawa on medium flame until a drop of water dances and evaporates.",
            "Ladle batter in center, spread in a spiral from inside-out.",
            "Drizzle half a teaspoon of coconut oil along the edges.",
            "Cook until golden-crisp (~90 seconds). Flip if you prefer both sides crisp.",
            "Fold and serve immediately with a final drizzle of raw cold-pressed oil.",
        ],
        "pairs_with_product_slug": "virgin-cold-pressed-coconut-oil",
        "cook_time_min": 15,
        "tags": ["culinary", "breakfast", "kerala"],
    },
    {
        "slug": "avial",
        "title": "Avial — Thirteen Vegetables, One Kitchen",
        "hero_image": IMG["unsplash_avial"],
        "short_desc": "Kerala's showpiece vegetable stew, finished with a raw spoon of coconut oil.",
        "ingredients": [
            "Mixed vegetables (yam, raw banana, drumstick, carrot, beans) — 4 cups",
            "1 cup grated coconut",
            "1 tsp cumin + 2 green chillies (ground with coconut)",
            "½ cup thick yogurt",
            "2 tbsp Karijeeva Cooking Coconut Oil",
            "Few curry leaves",
        ],
        "steps": [
            "Cook vegetables with turmeric + salt until just fork-tender.",
            "Add the ground coconut-cumin paste, simmer 3 minutes.",
            "Whisk yogurt and fold in off-flame so it doesn't split.",
            "Finish with 2 tbsp raw coconut oil + torn curry leaves.",
            "Rest 10 minutes. Serve with red matta rice.",
        ],
        "pairs_with_product_slug": "cooking-coconut-oil-family-pack",
        "cook_time_min": 45,
        "tags": ["culinary", "onam", "traditional"],
    },
    {
        "slug": "coconut-chutney",
        "title": "Five-Minute Coconut Chutney",
        "hero_image": IMG["recipe_chutney"],
        "short_desc": "The chutney that anchors every South Indian breakfast — a spoon of oil is the secret.",
        "ingredients": [
            "1 cup fresh grated coconut",
            "2 tbsp roasted chana dal",
            "1 small green chilli",
            "½ inch ginger",
            "Salt + water to grind",
            "TEMPERING: 1 tbsp Karijeeva Virgin Cold-Pressed Coconut Oil, 1 tsp mustard, 1 dry red chilli, curry leaves, pinch hing",
        ],
        "steps": [
            "Grind coconut + dal + chilli + ginger + salt with enough water for a silk texture.",
            "Heat oil in a ladle. Splutter mustard seeds; add red chilli, curry leaves, hing.",
            "Pour the hot tempering over chutney. Stir once.",
            "Serve with dosa, idli, or vada.",
        ],
        "pairs_with_product_slug": "virgin-cold-pressed-coconut-oil",
        "cook_time_min": 10,
        "tags": ["culinary", "breakfast", "chutney"],
    },
    {
        "slug": "thenga-sadam",
        "title": "Thenga Sadam — Coconut Rice, The Slow Way",
        "hero_image": IMG["unsplash_thenga"],
        "short_desc": "Tamil Nadu's temple rice. The chekku oil gives it its quiet, nutty soul.",
        "ingredients": [
            "2 cups cooked rice (cooled)",
            "1 cup grated coconut",
            "2 tbsp Karijeeva Wood-Pressed Coconut Oil",
            "1 tbsp chana dal, 1 tbsp urad dal, 2 dry red chillies, curry leaves, mustard seeds, asafoetida, salt",
        ],
        "steps": [
            "Heat oil, splutter mustard, add dals, red chilli, curry leaves, asafoetida.",
            "Add grated coconut, sauté 3 minutes until it loses its rawness.",
            "Fold into cooled rice with salt. Do not break the grains.",
            "Rest covered 5 minutes. Serve with appalam.",
        ],
        "pairs_with_product_slug": "wood-pressed-coconut-oil",
        "cook_time_min": 20,
        "tags": ["culinary", "tamil-nadu", "comfort"],
    },
    {
        "slug": "kerala-beef-fry",
        "title": "Kerala-Style Beef Fry (Erachi)",
        "hero_image": IMG["unsplash_beeffry"],
        "short_desc": "The Sunday roast of the Malabar Coast. Slow-cooked until the coconut oil glistens.",
        "ingredients": [
            "500g beef cubed, marinated with ginger-garlic, chilli, coriander, fennel, garam masala",
            "1 large onion sliced, 2 green chilli, curry leaves",
            "3 tbsp Karijeeva Cooking Coconut Oil",
            "½ cup coconut pieces (thenga kothu)",
            "Freshly cracked pepper to finish",
        ],
        "steps": [
            "Pressure-cook marinated beef with a splash of water, 4 whistles.",
            "Heat coconut oil, crisp onions + coconut pieces.",
            "Add cooked beef, roast until every piece is shiny-dark.",
            "Finish with curry leaves + cracked pepper. Serve with kappa (tapioca).",
        ],
        "pairs_with_product_slug": "cooking-coconut-oil-family-pack",
        "cook_time_min": 60,
        "tags": ["culinary", "kerala", "festive"],
    },
    {
        "slug": "coconut-barfi",
        "title": "Two-Ingredient Coconut Barfi",
        "hero_image": IMG["unsplash_barfi"],
        "short_desc": "Your grandmother's festive sweet. Set in 20 minutes, disappears in 5.",
        "ingredients": [
            "2 cups fresh grated coconut",
            "1 cup sugar (or ¾ cup jaggery)",
            "¼ cup milk",
            "2 tsp Karijeeva Virgin Cold-Pressed Coconut Oil + extra for greasing",
            "½ tsp cardamom powder",
        ],
        "steps": [
            "Grease a steel plate with coconut oil, set aside.",
            "In a heavy pan, combine coconut, sugar, milk. Stir constantly on medium flame.",
            "After 10–12 minutes the mix thickens and leaves the sides. Add cardamom + oil.",
            "Pour onto greased plate, flatten with a spatula, cut squares while warm.",
            "Cool completely. Stores 5 days in an airtight jar.",
        ],
        "pairs_with_product_slug": "virgin-cold-pressed-coconut-oil",
        "cook_time_min": 25,
        "tags": ["culinary", "sweet", "festive"],
    },
]


# ---------- Blog posts (5, min 600 words each) ----------
def md_words(md):
    return len([w for w in md.split() if w.strip()])

BLOG_POSTS = [
    {
        "slug": "7-ways-to-use-coconut-oil-in-indian-cooking",
        "title": "7 Ways to Use Cold-Pressed Coconut Oil in Your Indian Kitchen",
        "excerpt": "From the humble tadka to the grand Onam sadya — seven everyday moments where the right coconut oil changes everything.",
        "cover_image": IMG["kitchen"],
        "author": "Lakshmi Iyer",
        "published_at": "2025-12-10T08:00:00+05:30",
        "read_time_min": 7,
        "category": "culinary",
        "tags": ["cooking", "recipes", "daily"],
        "tldr": "Cold-pressed coconut oil isn't just for dosas. Use it for tempering, finishing, deep-frying, coating, seasoning cast-iron, dressing salads, and baking. It's the one oil most Indian kitchens over-think.",
        "content_md": (
            "## 1. The Morning Tadka\n\n"
            "Every South Indian kitchen begins the day with a tadka — a hot tempering of mustard seeds, curry leaves, urad dal, and dried red chilli. Cold-pressed coconut oil, unlike refined oil, releases a quiet but unmistakable aroma the moment the mustard starts to pop. The difference you taste in your dosa chutney the first time is the difference of about four generations of home cooks knowing what they were doing.\n\n"
            "Pro tip: don't overheat it. Medium flame, 45 seconds, just until the curry leaves turn translucent.\n\n"
            "## 2. The Finishing Drizzle\n\n"
            "Most of us treat oil as a starting ingredient. But cold-pressed coconut oil is also a finishing ingredient. A teaspoon poured raw over hot avial, rasam, or thenga sadam adds aroma the cooking heat would have burnt away. Think of it like olive oil in an Italian kitchen — used twice: once to cook, once to finish.\n\n"
            "## 3. Deep-Frying the Kerala Way\n\n"
            "Unrefined coconut oil has a smoke point of about 177°C — high enough for proper deep-frying. Plantain chips (upperi), banana fritters (pazham pori), pappadam — all taste markedly different when fried in coconut oil vs. a neutral refined oil. You can taste the coconut. That's the point.\n\n"
            "## 4. Coating the Mixer Jar\n\n"
            "An old kitchen trick: before grinding coconut chutney, wipe the inside of the mixer jar with a thin coat of cold-pressed coconut oil. The chutney blends smoother, doesn't climb the walls, and the jar washes clean in seconds. Try it once; you won't go back.\n\n"
            "## 5. Seasoning Cast-Iron Cookware\n\n"
            "Most households inherit a dosa tawa that's a few decades old. The secret to that non-stick surface isn't silicone — it's a lifetime of coconut oil. After a weekend deep-clean, wipe a thin layer of cold-pressed coconut oil on a still-warm tawa and smoke it for 10 minutes. Repeat a few times. The seasoning layer builds, and the tawa cooks better every month.\n\n"
            "## 6. A Light Vinaigrette\n\n"
            "This one's a modern idea that actually works. At room temperature in a cool Bangalore monsoon, coconut oil is semi-solid. Warm it to 24°C and it pours like olive oil. Whisk with a lemon, a pinch of salt, and a little honey for a bright, unexpected salad dressing. Pairs beautifully with cucumber, mango, and roasted peanuts.\n\n"
            "## 7. Weekend Baking\n\n"
            "Replace butter or neutral oil 1:1 in banana bread, coconut laddu, or nankhatai. The fat profile changes the crumb — a shade denser, a shade more aromatic. Your banana bread will smell like your grandmother's kitchen.\n\n"
            "## The Bottom Line\n\n"
            "One oil, seven kitchens. The reason cold-pressed coconut oil deserves the premium is that it works everywhere refined oil does, and then some places refined oil cannot. A good bottle lasts six months. Keep it near the stove, not in the pantry — you'll reach for it more often.\n\n"
            "At Karijeeva we press small batches so the shelf between grove and kitchen is shorter than six weeks. Every bottle still smells of the morning it was opened.\n\n"
            "*Ready to try? Browse the [Karijeeva oils](/products) and cook your way through our [recipes](/recipes).*\n"
        ),
    },
    {
        "slug": "cold-pressed-vs-refined-coconut-oil",
        "title": "Cold-Pressed vs Refined Coconut Oil: What's Actually in the Bottle?",
        "excerpt": "A plain-language breakdown of how the two oils are made, how they taste, and how they behave in your kitchen.",
        "cover_image": IMG["unsplash_coconuts"],
        "author": "Dr. Anjali Menon",
        "published_at": "2025-11-22T10:00:00+05:30",
        "read_time_min": 9,
        "category": "wellness",
        "tags": ["cold-pressed", "refined", "education"],
        "tldr": "Cold-pressed oil is extracted under 35°C from fresh coconut meat. Refined oil (RBD) is bleached, deodorised, and heat-processed from dried copra. Both fry your chips; only one keeps its nutrients, aroma, and soul.\n\nFor everyday Indian cooking, cold-pressed pays for itself in flavour and shelf life.",
        "content_md": (
            "## The Elevator Pitch\n\n"
            "Walk any Indian supermarket aisle and you'll find two kinds of coconut oil: cold-pressed and refined. They look similar, the labels are confusing, and the price difference can be 2x. What's actually different?\n\n"
            "## How Each Oil Is Made\n\n"
            "**Cold-pressed coconut oil** is extracted from fresh coconut meat (or dried kernel in some traditions) at temperatures below 35°C, usually via a screw press or the traditional wooden *chekku* (ghani). No solvents, no heat processing, no bleaching. The oil that comes out is the same oil that went in — just separated from the fibre and water.\n\n"
            "**Refined coconut oil** (often called RBD — refined, bleached, deodorised) begins with *copra*: sun-dried or kiln-dried coconut meat. Copra-based oil contains impurities, so it's run through a chemical refinery. Hexane may be used to maximise yield. The oil is then bleached (often with activated clay) and deodorised at 240°C+ to remove smell. What comes out is colourless, odourless, and — importantly — stable for long shipping.\n\n"
            "## Side-By-Side\n\n"
            "| Property | Cold-Pressed | Refined (RBD) |\n"
            "| --- | --- | --- |\n"
            "| Extraction temp | < 35°C | 200°C+ |\n"
            "| Source | Fresh kernel | Copra |\n"
            "| Aroma | Pronounced, nutty | Neutral |\n"
            "| Lauric acid | ~50% retained | ~50% retained* |\n"
            "| Micronutrients | Vitamin E, polyphenols preserved | Largely destroyed |\n"
            "| Smoke point | ~177°C | ~232°C |\n"
            "| Shelf life (opened) | 6–8 months | 18+ months |\n"
            "| Cost | ₹₹ | ₹ |\n\n"
            "*Lauric acid is a fatty acid and survives heat. But the other compounds — tocopherols, sterols, polyphenols — do not.\n\n"
            "## The Taste Test\n\n"
            "Heat a teaspoon of each in a cast-iron pan, add one curry leaf, inhale. Cold-pressed oil smells like toasted coconut. Refined oil smells like almost nothing. In tempering, finishing, baking — the aroma matters. For deep-frying a large batch of chips where you want no flavour transfer, refined has a place. Most of us just need one bottle, and cold-pressed is the smarter one.\n\n"
            "## The Nutrient Question\n\n"
            "The internet argues endlessly about saturated fat. What's less debated:\n\n"
            "1. Cold-pressed oil retains its **polyphenols** and **vitamin E** content — natural antioxidants that refined oil loses.\n"
            "2. Both oils are ~50% lauric acid — refined doesn't lose this.\n"
            "3. Refined oil undergoes chemical bleaching; cold-pressed does not.\n"
            "4. Both are saturated fats; moderation still applies.\n\n"
            "If you want the full nutritional profile of the coconut, you want it cold-pressed. If you just want a cooking fat, refined is cheaper.\n\n"
            "## Which Should You Buy?\n\n"
            "- **Everyday cooking** where aroma matters (tempering, chutney, dosa): **cold-pressed**.\n"
            "- **Deep-frying at scale** where you want neutrality: refined is acceptable, but cold-pressed still works.\n"
            "- **Skin, hair, oil pulling**: **cold-pressed only** — refined oil has been stripped of the compounds that make coconut oil therapeutic.\n"
            "- **Baking**: either works; cold-pressed adds warmth.\n\n"
            "## How To Spot Good Cold-Pressed Oil\n\n"
            "1. Solidifies firmly below 24°C. Pure coconut oil's melting point is 24°C.\n"
            "2. Smells *clearly* of coconut when warmed.\n"
            "3. Is packaged in glass (or food-grade tin) — not clear plastic.\n"
            "4. Has a pressing date, not just an expiry date.\n"
            "5. Is cloudy or pale gold, not water-clear.\n\n"
            "## The Karijeeva Promise\n\n"
            "Every Karijeeva bottle is pressed below 30°C, usually within three days of the coconut coming down from the tree. We tell you the pressing date because shelf life is measured from *there*, not from the factory. Our family pack is for kitchens that actually cook; our wood-pressed chekku oil is for people who still prefer how their grandmother's kitchen smelled.\n\n"
            "*Explore [all three Karijeeva oils](/products), or read our full [story from grove to kitchen](/about).*\n"
        ),
    },
    {
        "slug": "why-chekku-oil-matters",
        "title": "Why Chekku Oil Matters — And Why You've Probably Never Had It",
        "excerpt": "The wooden ghani predates electricity. Here's why Kerala still presses oil the slow way, and why it shows up in your dal.",
        "cover_image": IMG["unsplash_chekku"],
        "author": "Rajesh Nair",
        "published_at": "2025-11-02T07:30:00+05:30",
        "read_time_min": 6,
        "category": "wellness",
        "tags": ["chekku", "wood-pressed", "heritage"],
        "tldr": "Chekku (wooden ghani) oil is pressed in a hand-carved wooden mortar at <30°C, powered by a single ox walking a slow circle. It's messier, slower, and more expensive than any modern method — and it produces a deeper, rounder oil most modern kitchens have never tasted.",
        "content_md": (
            "## The Ox, The Mortar, The Oil\n\n"
            "Walk into a traditional chekku mill before sunrise and you'll hear it before you see it: the slow, rhythmic groan of wood on wood as the ox walks its circle. The coconut kernels go in dry and splintered; an hour later the oil begins to weep. Half a day for a batch that a modern screw press would spit out in six minutes.\n\n"
            "This is chekku. Ghani in Hindi. *Marachekku* in Tamil. It is the oldest way we know to get oil out of a seed, and in some corners of India it is how most oil is still made.\n\n"
            "## Why Slow Matters\n\n"
            "Modern cold-press machines use a stainless-steel screw, high pressure, and rapid rotation. Even at 'cold' temperatures, friction heat can push the kernel to 40–50°C. Chekku moves so slowly that the oil rarely crosses 30°C. The lower temperature preserves:\n\n"
            "- **Aroma compounds** — the nutty, almost sweet top note of good chekku oil.\n"
            "- **Polyphenols** — fragile antioxidants that break down above 40°C.\n"
            "- **Vitamin E** — heat-sensitive tocopherols.\n\n"
            "You can taste the difference. Side-by-side with a modern cold-press, chekku oil is rounder, fuller, and carries a gentle toasted note that screw presses never quite achieve.\n\n"
            "## Why It's Almost Extinct\n\n"
            "A single ox-driven chekku produces roughly 5 litres of oil per day. A modern factory produces 5,000 litres per hour. The economics of cheap food have not been kind to chekku. Most surviving mills are family-run, semi-retired, or serving a tiny local market.\n\n"
            "The revival, slowly, is being driven by urban families who grew up in villages where the chekku mill was a fixture, and who are now willing to pay more for an oil that smells the way their grandmother's kitchen smelled.\n\n"
            "## Chekku vs Modern Cold-Press\n\n"
            "Both are excellent. Cold-pressed screw-press oil is 95% of the way there at 60% of the price. Chekku oil is for connoisseurs, for ritual cooking, for the oils you only cook with on Sundays.\n\n"
            "We make both. Our flagship *Virgin Cold-Pressed* is everyday-great. Our *Wood-Pressed Chekku* is our Sunday oil — the one that goes into the avial for Onam, the one that seasons the dosa tawa when it's been out of use for a week, the one a visiting aunt notices without being told.\n\n"
            "## A Quiet Craft\n\n"
            "Our chekku partner is a third-generation mill in rural Kerala. They press four days a week, take Thursdays off, and refuse to scale. Every litre of our chekku oil can be traced to a single three-day batch.\n\n"
            "Buying a bottle is buying a few minutes of a slow craft, slow-moving ox, slow-moving wood, slow-moving oil. Cooking with it is an act of remembrance.\n\n"
            "*Try our [Wood-Pressed Coconut Oil (Chekku)](/products/wood-pressed-coconut-oil) next time you make avial. Or read about [how we source](/about).*\n"
        ),
    },
    {
        "slug": "ayurveda-and-coconut-oil",
        "title": "Coconut Oil in Ayurveda: Champi, Abhyanga, and the Quiet Ritual",
        "excerpt": "From Sunday-morning champi to the Ayurvedic hospital's abhyanga — how one oil holds the centre of Indian wellness.",
        "cover_image": IMG["unsplash_spices"],
        "author": "Dr. Anjali Menon",
        "published_at": "2025-10-14T09:00:00+05:30",
        "read_time_min": 8,
        "category": "wellness",
        "tags": ["ayurveda", "champi", "ritual"],
        "tldr": "In Ayurveda, coconut oil is a cooling agent used in hair massage (champi), full-body massage (abhyanga), and oil pulling. Most of its claimed benefits are about *how* and *when* you use it. Cold-pressed oil is the traditional grade.",
        "content_md": (
            "## The Most Indian Ritual\n\n"
            "Every Sunday morning, in a lot of Indian homes, someone sits on a low stool while someone else warms a small bowl of coconut oil and begins to massage it into their scalp. Fingers move in slow circles. The oil rests for an hour, sometimes two. Then a hot shower — and a week of lighter, softer, easier hair.\n\n"
            "This is champi. Its instructions have not changed in 500 years.\n\n"
            "## Why Coconut Oil Specifically\n\n"
            "Ayurveda classifies oils by their *guna* (quality). Coconut oil is considered *sheetal* — cooling. In a hot, humid climate like coastal India, a cooling oil settles the scalp, cools the nervous system, and is said to help the mind rest. In colder regions, warming oils (sesame, mustard) are preferred. That's why Kerala cooks and applies coconut oil, and Punjab cooks in mustard.\n\n"
            "The science bit: coconut oil's lauric acid penetrates the hair shaft more effectively than most other plant oils, measured by mass-spec studies at Indian universities in the 2000s. Which means it reduces protein loss during wash. Which means, practically, healthier hair.\n\n"
            "## The Four Ayurvedic Uses\n\n"
            "### 1. Champi (head massage)\n"
            "Warm 2–3 tbsp of cold-pressed coconut oil between the palms until it liquefies. Section the hair and massage into the scalp in slow circles for 10 minutes. Leave for 1–2 hours. Wash with a mild shampoo. Frequency: once a week.\n\n"
            "### 2. Abhyanga (full-body massage)\n"
            "Practiced in Ayurvedic hospitals for centuries. Whole-body oil massage before a warm bath. 30–45 minutes. Used for post-partum recovery, joint stiffness, and general well-being. Daily during Panchakarma therapy, weekly otherwise.\n\n"
            "### 3. Oil Pulling (*Gandusha*)\n"
            "Swish 1 tablespoon of coconut oil in the mouth for 10 minutes, first thing in the morning, before water. Spit it out in the dustbin, rinse with warm water. Claimed benefits: oral hygiene, plaque reduction. Daily.\n\n"
            "### 4. *Nasya* (drops in the nose)\n"
            "Ayurvedic practice of a few drops of warm coconut oil in each nostril. Traditionally believed to support clarity and respiratory health. Consult a practitioner before doing this at home.\n\n"
            "## Which Oil For Which Use\n\n"
            "- For champi + abhyanga, almost any clean cold-pressed coconut oil works. Virgin is traditional.\n"
            "- For oil pulling, *only* cold-pressed. Refined oil has no therapeutic compounds.\n"
            "- For babies, use medical-grade virgin cold-pressed oil only.\n\n"
            "## A Modern Note\n\n"
            "Ayurvedic ritual is not medicine in the pharmaceutical sense. Consult your doctor for medical conditions. But the rituals themselves — a quiet Sunday morning with a bowl of warm oil and your mother's hands — are cultural medicine of a different kind, and the best wellness app we know.\n\n"
            "*Our [Virgin Cold-Pressed Oil](/products/virgin-cold-pressed-coconut-oil) is the traditional grade for champi. Hand-pressed small-batch, arrives within weeks of the press.*\n"
        ),
    },
    {
        "slug": "weekend-kerala-breakfast",
        "title": "A Weekend Kerala Breakfast — Four Dishes, One Oil",
        "excerpt": "Appam + stew, puttu + kadala, dosa + chutney, and idiyappam — a Saturday morning plan built around one bottle.",
        "cover_image": IMG["recipe_dosa"],
        "author": "Lakshmi Iyer",
        "published_at": "2025-09-28T08:30:00+05:30",
        "read_time_min": 6,
        "category": "culinary",
        "tags": ["kerala", "breakfast", "sadya"],
        "tldr": "Set aside a Saturday. Make all four Kerala breakfast dishes in one go, using one bottle of cold-pressed coconut oil. Serves 4, takes 2 hours, leftovers last Sunday.",
        "content_md": (
            "## The Plan\n\n"
            "Breakfast in Kerala isn't a dish — it's a spread. Appam with stew. Puttu with kadala curry. Dosa with coconut chutney. Idiyappam with egg roast. Traditionally, a Malabar kitchen makes two or three of these on a weekend morning; we're going to make all four.\n\n"
            "All four use cold-pressed coconut oil — in the batter, in the tempering, on the finish. One bottle, one morning, four dishes.\n\n"
            "## 7:00 AM — Soak and Ferment\n"
            "Actually this is last night's work. Soak 2 cups of idli rice + ½ cup urad dal in separate bowls overnight. Soak 1 cup rice for appam batter with ¼ tsp yeast and 1 tbsp sugar. Soak 1 cup black chickpeas for kadala curry.\n\n"
            "## 7:30 AM — Grind\n"
            "Grind the idli batter (rice + dal + salt), ferment 6–8 hours — which means this step needs to happen the day before in a warm kitchen. Grind the appam batter (rice + coconut + yeast sugar) in the morning; it ferments faster.\n\n"
            "## 8:00 AM — Start the Chickpeas\n"
            "Pressure-cook the soaked kadala with turmeric + salt for 4 whistles while you sip your first filter coffee.\n\n"
            "## 8:30 AM — Make the Dishes\n\n"
            "**Appam** — Heat a small kadai, pour batter, swirl. Drizzle 1 tsp coconut oil. Cover 2 minutes. Lift with a soft spatula. Stack.\n\n"
            "**Vegetable Stew** — Simmer potato, carrot, beans in coconut milk with whole spices (cardamom, cinnamon, clove, black pepper). Finish with 1 tbsp raw coconut oil + curry leaves off-flame.\n\n"
            "**Puttu** — Steam alternating layers of rice flour + grated coconut in a puttu kutti for 7 minutes. Serve with kadala curry (below).\n\n"
            "**Kadala Curry** — Heat coconut oil in a kadai, splutter mustard, add onion + ginger-garlic + chilli + coriander + pepper. Add cooked chickpeas + coconut-paste. Simmer 10 minutes.\n\n"
            "**Dosa** — Ladle fermented batter on a hot cast-iron tawa. Drizzle coconut oil. Crisp. Fold. Serve with coconut chutney (tempered with — you guessed it — coconut oil).\n\n"
            "## 10:00 AM — Sit Down\n\n"
            "Put everything in the centre of the table. Banana leaves if you have them, steel plates if you don't. Eat slowly. Coffee refills allowed. The morning is yours.\n\n"
            "## The Why\n\n"
            "You can do this breakfast with a refined oil. It will be fine. But every Kerala kitchen knows — and now you will too — that the second the cold-pressed oil hits the hot pan, the whole house smells different. The coconut is in the air before it's on the plate. That's the whole point.\n\n"
            "*Build your spread with our [Cooking Family Pack](/products/cooking-coconut-oil-family-pack). Recipes for each dish on our [recipes page](/recipes).*\n"
        ),
    },
]


# ---------- Testimonials (6) ----------
TESTIMONIALS = [
    {
        "name": "Meera Pillai", "location": "Bengaluru", "role": "Home cook",
        "quote": "My grandmother's dosa tawa finally smells right again. One bottle of Karijeeva and three weeks of seasoning — the kitchen is hers again.",
        "rating": 5, "avatar_url": IMG["avatar_1"], "verified": True,
    },
    {
        "name": "Arjun Kumar", "location": "Chennai", "role": "Chef",
        "quote": "I've tested a dozen brands for my restaurant. Karijeeva's chekku oil is the first that actually tastes like chekku. My tadka speaks for it.",
        "rating": 5, "avatar_url": IMG["avatar_2"], "verified": True,
    },
    {
        "name": "Priya Nair", "location": "Kochi", "role": "Doctor",
        "quote": "I use it for oil pulling, my mother uses it for champi, my daughter eats it on dosas. One bottle, three generations.",
        "rating": 5, "avatar_url": IMG["avatar_3"], "verified": True,
    },
    {
        "name": "Rohan Shetty", "location": "Mumbai", "role": "Food writer",
        "quote": "The aroma of a single drop on a hot cast-iron tawa — that's the test. Karijeeva passes without asking.",
        "rating": 5, "avatar_url": IMG["avatar_4"], "verified": True,
    },
    {
        "name": "Lakshmi Raman", "location": "Coimbatore", "role": "Ayurveda practitioner",
        "quote": "For abhyanga, I only recommend cold-pressed coconut oil. Karijeeva is the only brand my patients actually enjoy using.",
        "rating": 5, "avatar_url": IMG["avatar_5"], "verified": True,
    },
    {
        "name": "Vishal Krishnan", "location": "Hyderabad", "role": "Food blogger",
        "quote": "I ordered the family pack expecting mid-range. What arrived was chef-grade — better than oils twice the price.",
        "rating": 4, "avatar_url": IMG["avatar_6"], "verified": True,
    },
]


# ---------- FAQs (10) ----------
FAQS = [
    {"question": "Is Karijeeva oil really cold-pressed?",
     "answer": "Yes. Every bottle is pressed below 30°C in a screw-press or traditional wooden chekku. No heat, no refining, no bleaching, no solvents.",
     "category": "product"},
    {"question": "What is the shelf life?",
     "answer": "12 months sealed at room temperature. Once opened, finish within 6 months for the fullest aroma and benefits.",
     "category": "product"},
    {"question": "Does the oil solidify in winter?",
     "answer": "Yes — pure coconut oil solidifies below 24°C. That is a sign of purity. Warm the bottle in hot water for 2 minutes to re-liquefy, or just scoop a spoon directly.",
     "category": "product"},
    {"question": "Can I use it for deep-frying?",
     "answer": "Absolutely. The smoke point of our cold-pressed oil is around 177°C — enough for traditional deep-frying like plantain chips, pappadam, and pazham pori.",
     "category": "cooking"},
    {"question": "Is it FSSAI certified?",
     "answer": "Yes. Every batch is third-party tested and certified under FSSAI license number 10012345678.",
     "category": "product"},
    {"question": "What is the difference between virgin and wood-pressed?",
     "answer": "Both are cold-pressed. Virgin is screw-pressed at small scale; wood-pressed (chekku) is slow-pressed in a wooden ghani by ox. Chekku is slower, has a slightly deeper aroma, and costs more.",
     "category": "product"},
    {"question": "Is the oil suitable for babies?",
     "answer": "Our cold-pressed oil is food-grade and widely used for gentle body massage. For new-borns we recommend consulting a paediatrician before use.",
     "category": "wellness"},
    {"question": "Do you ship across India?",
     "answer": "Yes — free shipping on orders above ₹799 anywhere in India. Dispatch within 48 hours, delivery in 3–7 days depending on location.",
     "category": "shipping"},
    {"question": "Can I return or exchange?",
     "answer": "Unopened bottles can be returned within 7 days of delivery. Please email hello@karijeeva.in with your order number.",
     "category": "shipping"},
    {"question": "Why the premium price?",
     "answer": "Small batches, unrefined oil, glass or food-grade tin packaging, direct-from-farm sourcing, and no margin stacked on top of a middleman. The math favours the farmer.",
     "category": "product"},
    # ── Phase 9 — additional FAQs (brings total to 20) ──
    {"question": "How is my order tracked after it ships?",
     "answer": "Once dispatched, you will receive an email and SMS with the AWB number and carrier. You can also track in-flight from your account at /account/orders or from /track-order using your order number and email.",
     "category": "orders"},
    {"question": "Do you deliver internationally?",
     "answer": "Not yet. We ship pan-India only during the MVP launch. International delivery is on our post-launch roadmap.",
     "category": "shipping"},
    {"question": "What if my order arrives damaged or leaked?",
     "answer": "Write to support@karijeeva.in within 48 hours of delivery with your order number and a short unboxing photo or video. We will send a replacement or issue a full refund — your choice.",
     "category": "returns"},
    {"question": "Can I cancel an order after placing it?",
     "answer": "Yes, before dispatch — use the Cancel option from your order page or track-order page. After dispatch, raise a return request on delivery for unopened bottles within 7 days.",
     "category": "returns"},
    {"question": "Can I subscribe for a monthly bottle?",
     "answer": "Our Subscribe & Save programme is launching soon — 15% off, free shipping, skip anytime. Join the waitlist at /subscribe-save.",
     "category": "subscriptions"},
    {"question": "Do you sell gift cards?",
     "answer": "Gift cards are coming soon. Sign up on /gift-cards and we will email you the minute they launch.",
     "category": "subscriptions"},
    {"question": "Is the oil vegan and gluten-free?",
     "answer": "Yes. Single-ingredient, plant-based, gluten-free, dairy-free, soy-free. Nothing but cold-pressed coconut oil.",
     "category": "ingredients"},
    {"question": "How do I reset my account password?",
     "answer": "Sign in at /login and use the reset link, or write to support@karijeeva.in if the email on file is no longer accessible. We verify identity before making any account change.",
     "category": "account"},
    {"question": "Is my payment information safe?",
     "answer": "Yes. Payments are processed by Razorpay (PCI-DSS Level 1). We never see or store your card details. Session cookies are httpOnly and admin operations are audit-logged.",
     "category": "account"},
    {"question": "Do you handle bulk or wholesale orders?",
     "answer": "Yes — write to support@karijeeva.in with your requirement (quantity, delivery pincode, timeline). We respond within one working day with pricing and freight.",
     "category": "orders"},
]


# ---------- Site settings ----------
SITE_SETTINGS = {
    "_singleton": True,
    "hero_headline": "Pure. Pressed. Powerful.",
    "hero_sub": "From coconut grove to your kitchen — small-batch cold-pressed oil, the way it was always meant to be.",
    "tagline": "Karijeeva stands for pure, honest, and powerful natural wellness — bringing you closer to life in its most authentic form.",
    "vision_statement": (
        "At Karijeeva, we envision a world where wellness is returned to its purest form — "
        "honest, natural, and deeply powerful. We exist to reconnect people with the true essence "
        "of life by creating products that are rooted in nature, crafted with integrity, and "
        "designed to nourish both body and mind. Karijeeva is more than wellness — it is a way of "
        "living that honors simplicity, transparency, and the strength of nature."
    ),
    "hero_image": IMG["hero_wide"],
    "press_logos": [
        {"name": "Vogue India",   "subtitle": "A new Indian luxury."},
        {"name": "Femina",        "subtitle": "The bottle your kitchen was waiting for."},
        {"name": "The Hindu",     "subtitle": "A revival of chekku oil, done right."},
        {"name": "Times Food",    "subtitle": "Deeply honest, deeply aromatic."},
        {"name": "Mint Lounge",   "subtitle": "The quiet luxury of a single-ingredient brand."},
    ],
    "trust_stats": [
        {"value": "1,200+", "label": "5-star reviews"},
        {"value": "<30°C",   "label": "Press temperature"},
        {"value": "3 days",  "label": "Grove to bottle"},
        {"value": "100%",    "label": "Single ingredient"},
    ],
    "contact": {
        "address": "Kadle Global Pvt Ltd, Bengaluru, Karnataka 560001, India",
        "email":   "support@karijeeva.in",
        "phone":   "+91 80 4860 4860",
        "hours":   "Mon–Sat · 9:30 AM – 6:30 PM IST",
    },
    # ── Phase 9 — company metadata used by footer, legal pages, invoices ──
    "company_name":       "Kadle Global Pvt Ltd",
    "cin":                "U62099KA2025PTC207992",
    "registered_address": "Bengaluru, Karnataka, India",
    "support_email":      "support@karijeeva.in",
    "legal_email":        "legal@karijeeva.in",
    "privacy_email":      "privacy@karijeeva.in",
    "support_phone":      "+91 80 4860 4860",
    "hours_ist":          "Mon–Sat · 9:30 AM – 6:30 PM IST",
    "fssai_license":      "10024001000000",
    "parent_site_url":    "https://kadleglobal.com",
    "instagram_url":      "https://instagram.com/karijeeva",
    "facebook_url":       "https://facebook.com/karijeeva",
    "youtube_url":        "https://youtube.com/@karijeeva",
    "whatsapp_url":       "https://wa.me/918048604860",
    "linkedin_url":       "https://linkedin.com/company/kadle-global",
}


# ---------- Coupon (WELCOME10) ----------
COUPON_WELCOME10 = {
    "code": "WELCOME10",
    "type": "percent",
    "value": 10,
    "min_order": 499,
    "max_uses": 10000,
    "used_count": 0,
    "active": True,
    "created_at": NOW,
    "description": "10% off your first order over ₹499",
}


async def seed():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    try:
        # Products — preserve existing id across re-seeds
        for p in PRODUCTS:
            existing = await db.products.find_one({"slug": p["slug"]}, {"id": 1})
            pid = existing["id"] if existing and existing.get("id") else str(uuid.uuid4())
            doc = {**p, "id": pid, "updated_at": NOW}
            await db.products.update_one(
                {"slug": p["slug"]},
                {"$set": doc, "$setOnInsert": {"created_at": NOW}},
                upsert=True,
            )
        # Variants (replace all variants for idempotency of counts/prices)
        await db.product_variants.delete_many({})
        for slug, price in PRODUCT_BASE_PRICES.items():
            for v in variants_for(slug, price):
                await db.product_variants.insert_one(v)

        # Recipes
        for r in RECIPES:
            doc = {**r, "id": str(uuid.uuid4())}
            await db.recipes.update_one({"slug": r["slug"]}, {"$set": doc}, upsert=True)

        # Blog
        for b in BLOG_POSTS:
            doc = {**b, "id": str(uuid.uuid4()), "word_count": md_words(b["content_md"])}
            await db.blog_posts.update_one({"slug": b["slug"]}, {"$set": doc}, upsert=True)

        # Testimonials
        await db.testimonials.delete_many({})
        for t in TESTIMONIALS:
            doc = {**t, "id": str(uuid.uuid4())}
            await db.testimonials.insert_one(doc)

        # FAQs
        await db.faqs.delete_many({})
        for f in FAQS:
            doc = {**f, "id": str(uuid.uuid4())}
            await db.faqs.insert_one(doc)

        # Site settings
        await db.site_settings.update_one({"_singleton": True}, {"$set": SITE_SETTINGS}, upsert=True)

        # Coupon
        await db.coupons.update_one({"code": "WELCOME10"}, {"$set": COUPON_WELCOME10}, upsert=True)

        # Seed reviews (Phase 4/6) — 40 verified reviews per product = 120 total
        # Deterministic IDs → idempotent on re-run
        import hashlib
        import random
        from datetime import timedelta as _td
        from datetime import datetime as _dt
        from datetime import timezone as _tz

        REVIEW_AUTHORS = [
            ("Priya S.",   "Bengaluru"), ("Ramesh K.", "Chennai"), ("Anjali M.", "Mumbai"),
            ("Vikram R.",  "Pune"),      ("Meera N.",  "Kochi"),   ("Karthik I.","Hyderabad"),
            ("Lakshmi P.", "Coimbatore"),("Arjun D.",  "Delhi"),   ("Sita V.",   "Mysuru"),
            ("Rohan B.",   "Mumbai"),    ("Kavya A.",  "Trivandrum"),("Naveen G.","Bengaluru"),
            ("Divya R.",   "Chennai"),   ("Suresh T.", "Madurai"), ("Pooja J.",  "Hyderabad"),
            ("Harish L.",  "Bengaluru"), ("Nikita S.", "Pune"),    ("Vinay M.",  "Delhi"),
            ("Radhika U.", "Kochi"),     ("Manoj C.",  "Chennai"), ("Tara V.",   "Bengaluru"),
            ("Ajay P.",    "Mumbai"),    ("Shruti N.", "Ahmedabad"),("Rahul K.",  "Bengaluru"),
            ("Deepa S.",   "Kochi"),     ("Ganesh M.", "Mangaluru"),("Sneha B.",  "Pune"),
            ("Arvind R.",  "Chennai"),   ("Isha T.",   "Delhi"),   ("Balaji N.", "Trichy"),
            ("Neha A.",    "Gurugram"),  ("Prakash V.","Bengaluru"),("Jyoti L.",  "Hyderabad"),
            ("Siddharth P.","Mumbai"),   ("Ananya K.", "Bengaluru"),("Rajat N.",  "Pune"),
            ("Swati R.",   "Chennai"),   ("Yash H.",   "Ahmedabad"),("Chitra M.", "Kochi"),
            ("Darshan K.", "Bengaluru"),
        ]
        RB_TITLES = {
            "virgin-cold-pressed-coconut-oil": [
                "Smells like my grandmother's kitchen", "Dosa drizzle, transformed", "Finally found real cold-pressed",
                "Champi oil perfection", "Back to my childhood", "Aroma is unbeatable",
                "Zero adulteration, you can tell", "Pure and pungent in the best way", "Upgraded my breakfast",
                "My hair is singing", "Oil pulling routine approved", "Tempering never tasted better",
                "The one I recommend to everyone", "Clean, honest oil", "Better than brands 2x the price",
                "Solidifies in winter — a good sign", "Pairs beautifully with avial", "A pantry staple now",
                "Gold standard", "Works wonders on scalp",
            ],
            "wood-pressed-coconut-oil": [
                "True chekku smell", "Slow pressing tastes different", "Nuttier than modern cold-press",
                "Onam-ready oil", "Reminds me of village mills", "Sunday avial oil",
                "Depth of flavour is unmatched", "Ox-pressed and authentic", "My mother approved",
                "Third-generation Malayali approved", "Festive oil for us now", "A drizzle transforms everything",
                "The real thing", "Traditional method, real results", "Worth the premium",
                "Finish for rasam is gorgeous", "Took me home in one sniff", "Kerala kitchen essential",
                "Heritage in a bottle", "Small batch quality",
            ],
            "cooking-coconut-oil-family-pack": [
                "Cooks three meals a day for us", "Family pack pricing, single-ingredient quality", "Stable smoke point, consistent frying",
                "Plantain chips are perfect", "No smell burnout even after long frying", "Perfect for tempering at scale",
                "Lasts a family of five a full month", "Value without compromise", "Great base oil for everyday cooking",
                "Seasons my cast-iron tawa beautifully", "Honest oil, honest price", "My kids can smell the difference",
                "Kerala-style beef fry legend", "Deep fried pappadams, chef's kiss", "Reliable, every batch the same",
                "Bulk buy, zero regret", "Pairs with any Indian recipe", "My new pantry workhorse",
                "From onam sadya to Sunday breakfast", "Works across every South Indian dish",
            ],
        }
        RB_BODIES = [
            "I've tried five brands over the last two years looking for something close to the oil I grew up with. Karijeeva is the first that actually smells and tastes right — you can sense the cold-press integrity the moment it hits a hot tawa. Drizzled it on my morning dosas and my whole kitchen smelled of Kerala before 8am. Worth every rupee.",
            "Ordered the 500ml to give it a fair test. Delivered in four days, packaging was neat, oil was clear and cloudy in all the right ways. Used it for tempering curry leaves and mustard and the aroma was pronounced — my chutney had a different character from the first bite. Will reorder.",
            "Converted from a supermarket refined brand after my mother visited and refused to cook with what I had. We opened a bottle of Karijeeva side by side with my old bottle and the difference was laughable — this one actually smells of coconut. My avial finally tastes like hers.",
            "Excellent for oil pulling. A tablespoon every morning for two weeks and I can feel the difference in my gums and breath. Solidifies below 24°C which I take as a good sign of purity. Bottle design is understated and premium.",
            "I bake with coconut oil often and this one is the best I've used. Substituted butter 1:1 in my banana bread and the crumb came out dense and fragrant. The coconut flavour comes through without dominating the banana — which is harder to do than it sounds.",
            "Family of four, we go through a bottle a month. The price is a stretch from what we paid earlier but every time I open it the aroma reminds me why we switched. The kids haven't noticed the cost change but they've definitely noticed how much better everything smells now.",
            "Used it for a Sunday champi and my scalp felt lighter for the rest of the week. Warmed a few tablespoons, massaged for ten minutes, left it on for an hour, washed with mild shampoo. Simple ritual, real benefit. My hair fall has noticeably reduced over a month.",
            "Delivery was a bit slow but once it arrived the product delivered on every claim. I compared the smoke point by frying plantain chips — no breakdown, the chips came out golden and crisp with a clean coconut note. Buying the 1L next time.",
            "I'm a home cook who takes my oils seriously. This is the first cold-pressed I've found in India that doesn't have a faintly burnt undertone. Small batch does matter. Used it to season my cast-iron tawa and the non-stick surface built up in three weekend cooks.",
            "Aroma is the giveaway for quality and this one has it in spades. My mother-in-law, who is hard to impress, asked where I got it after tasting the coconut chutney I tempered with it. That alone was worth the ₹500.",
            "Tried the wood-pressed variant and it is a genuinely different oil — deeper, nuttier, slightly more expensive. Used it for a festival avial and the whole table commented on the flavour without knowing why. Chekku oil has my heart now.",
            "Customer service was responsive when I had a question about the pressing date. The bottle I received was pressed two weeks before shipping which is about as fresh as it gets for retail. This brand is transparent in a refreshing way.",
            "A little goes a long way. I was worried about the price but I'm genuinely using less because the flavour is more concentrated. A teaspoon in my chutney now does what a tablespoon of refined oil used to.",
            "Noticed visible improvement in my hair texture after three weekly champi sessions. Skin feels softer when I use it as a moisturiser after a bath. The lauric acid claims aren't marketing fluff — my body can tell.",
            "I run a small tiffin service and switched all my tempering to this. My regulars commented within a week. The cost per meal went up by ₹4 and I haven't heard a single complaint — if anything, orders are up.",
            "The glass bottle is beautiful and sits on my kitchen counter without embarrassment. Aesop-level packaging for an oil. This brand clearly cares about the whole experience, not just the product.",
            "Packaging arrived with the bottle tightly sealed, no leaks, cushioned well. The oil was crystal clear. Tempered mustard seeds for my first test — they popped in under 15 seconds which is faster than my previous oil. Heat distribution seems better.",
            "Made two weekends of Kerala breakfasts from my Karijeeva bottle — appam+stew, puttu+kadala, dosa+chutney, idiyappam+egg roast. Every dish tasted a shade more authentic than usual. My parents video-called and could smell it through the screen (they claim).",
            "I had a minor issue with my order and their support team responded within the day. Sent a replacement without fuss. That kind of service is rare in D2C and I'm likely going to stay a repeat customer just for that.",
            "The only feedback — a small measuring scoop would be lovely for gifting sets. Otherwise a flawless product. Already ordered the family pack for my mother.",
        ]
        RATING_DISTRIBUTION = [5]*28 + [4]*9 + [3]*2 + [2]*1  # 40 total, avg ≈ 4.6
        base_day = _dt.now(_tz.utc) - _td(days=365)

        # Clear only seeded reviews so cosmetic ones and tests aren't clobbered
        await db.reviews.delete_many({"seed": True})
        total_reviews_inserted = 0
        for p in PRODUCTS:
            p_doc = await db.products.find_one({"slug": p["slug"]}, {"id": 1, "slug": 1})
            if not p_doc:
                continue
            titles = RB_TITLES.get(p["slug"], RB_TITLES["virgin-cold-pressed-coconut-oil"])
            rng = random.Random(hash(p["slug"]) & 0xFFFFFFFF)
            for i in range(40):
                det = hashlib.sha1(f"{p['slug']}#{i}".encode()).hexdigest()[:16]
                author, location = REVIEW_AUTHORS[(i + hash(p["slug"])) % len(REVIEW_AUTHORS)]
                title = titles[i % len(titles)]
                body = RB_BODIES[i % len(RB_BODIES)]
                rating = RATING_DISTRIBUTION[i % len(RATING_DISTRIBUTION)]
                day_offset = int(rng.uniform(0, 360))
                created = (base_day + _td(days=day_offset)).isoformat()
                await db.reviews.update_one(
                    {"id": f"seed-{det}"},
                    {"$set": {
                        "id": f"seed-{det}",
                        "product_id": p_doc.get("id") or p_doc["slug"],
                        "product_slug": p_doc["slug"],
                        "user_id": None,
                        "user_name": author,
                        "location": location,
                        "rating": rating,
                        "title": title,
                        "body": body,
                        "is_verified_buyer": True,
                        "is_approved": True,
                        "seed": True,
                        "created_at": created,
                    }},
                    upsert=True,
                )
                total_reviews_inserted += 1

        # Recompute product avg_rating + review_count from real docs
        for p in PRODUCTS:
            p_doc = await db.products.find_one({"slug": p["slug"]}, {"id": 1, "slug": 1})
            if not p_doc:
                continue
            rows = await db.reviews.find(
                {"product_id": {"$in": [p_doc.get("id"), p_doc["slug"]]}, "is_approved": True},
                {"_id": 0, "rating": 1},
            ).to_list(5000)
            count = len(rows)
            avg = round(sum(r["rating"] for r in rows) / count, 2) if count else 0
            await db.products.update_one({"slug": p["slug"]}, {"$set": {"avg_rating": avg, "review_count": count}})

        print(f"  reviews:     {total_reviews_inserted} (seeded, idempotent)")

        # Seed ADMIN user (never overwrite if exists)
        admin_email = "admin@karijeeva.in"
        existing_admin = await db.users.find_one({"email": admin_email})
        if not existing_admin:
            import bcrypt
            pw_hash = bcrypt.hashpw(b"KarijeevaAdmin@2025", bcrypt.gensalt(rounds=12)).decode("utf-8")
            await db.users.insert_one({
                "id": str(uuid.uuid4()),
                "email": admin_email,
                "name": "Karijeeva Admin",
                "password_hash": pw_hash,
                "role": "admin",
                "created_at": NOW,
            })
            print(f"  admin user seeded:  {admin_email} / KarijeevaAdmin@2025")
        else:
            # Ensure role is admin even if user pre-existed
            await db.users.update_one({"email": admin_email}, {"$set": {"role": "admin"}})
            print(f"  admin user exists:  {admin_email} (role ensured)")

        print("Seed complete.")
        print(f"  products:    {await db.products.count_documents({})}")
        print(f"  variants:    {await db.product_variants.count_documents({})}")
        print(f"  recipes:     {await db.recipes.count_documents({})}")
        print(f"  blog_posts:  {await db.blog_posts.count_documents({})}")
        print(f"  testimonials:{await db.testimonials.count_documents({})}")
        print(f"  faqs:        {await db.faqs.count_documents({})}")
        print(f"  coupons:     {await db.coupons.count_documents({})}")
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(seed())
