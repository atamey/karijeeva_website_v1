from fastapi import FastAPI, APIRouter, HTTPException, Response, Request, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import bcrypt
import jwt
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import razorpay


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Razorpay
RAZORPAY_KEY_ID = os.environ['RAZORPAY_KEY_ID']
RAZORPAY_KEY_SECRET = os.environ['RAZORPAY_KEY_SECRET']
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

SITE_PUBLIC_URL = os.environ.get('SITE_PUBLIC_URL', 'http://localhost:3000').rstrip('/')
RAZORPAY_WEBHOOK_SECRET = os.environ.get('RAZORPAY_WEBHOOK_SECRET', '')

# JWT
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"
JWT_TTL_DAYS = int(os.environ.get("JWT_TTL_DAYS", "7"))

app = FastAPI(
    title="Karijeeva API",
    version="0.3.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# =====================================================================
# Helpers
# =====================================================================
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def make_jwt(user_id: str, email: str, role: str = "customer") -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=JWT_TTL_DAYS)
    payload = {"sub": user_id, "email": email, "role": role, "exp": exp, "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_jwt(token: str) -> Dict[str, Any]:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])


def set_auth_cookie(resp: Response, token: str):
    resp.set_cookie(
        key="access_token", value=token, httponly=True,
        samesite="lax", secure=True,
        max_age=JWT_TTL_DAYS * 86400, path="/",
    )


async def get_current_user(request: Request) -> Dict[str, Any]:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_jwt(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_current_user_optional(request: Request) -> Optional[Dict[str, Any]]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def gen_order_number() -> str:
    return f"KRJ-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"


# =====================================================================
# Models
# =====================================================================
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


# Payments (Phase 0)
class CreateOrderRequest(BaseModel):
    amount_inr: float = Field(..., gt=0)
    receipt: Optional[str] = None
    notes: Optional[Dict[str, Any]] = None


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentOrderDoc(BaseModel):
    id: str
    razorpay_order_id: str
    amount_inr: float
    amount_paise: int
    currency: str
    status: str
    receipt: Optional[str] = None
    notes: Optional[Dict[str, Any]] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None


class NewsletterSubscribeRequest(BaseModel):
    email: EmailStr
    source: Optional[str] = "footer"


class ContactRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    phone: Optional[str] = None
    subject: Optional[str] = Field(None, max_length=160)
    message: str = Field(..., min_length=1, max_length=5000)


class ProductListResponse(BaseModel):
    products: List[Dict[str, Any]]
    count: int


# Auth
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    user: Dict[str, Any]
    access_token: str


# Coupons
class CouponValidateRequest(BaseModel):
    code: str
    subtotal: float = Field(..., ge=0)


# Orders
class AddressModel(BaseModel):
    full_name: str
    phone: str
    line1: str
    line2: Optional[str] = ""
    city: str
    state: str
    pincode: str = Field(..., min_length=6, max_length=6)
    country: str = "India"


class OrderItemIn(BaseModel):
    variant_id: str
    quantity: int = Field(..., gt=0)


class OrderCreateRequest(BaseModel):
    items: List[OrderItemIn]
    address: AddressModel
    guest_email: Optional[EmailStr] = None
    guest_phone: Optional[str] = None
    coupon_code: Optional[str] = None


class OrderVerifyRequest(BaseModel):
    order_id: str  # our internal order id
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


# Reviews
class ReviewCreateRequest(BaseModel):
    product_id: str
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = Field(None, max_length=80)
    body: str = Field(..., min_length=20, max_length=1500)


# Phase 4 — Wishlist / Requests
class WishlistAddRequest(BaseModel):
    variant_id: str


class OrderRequestPayload(BaseModel):
    type: str = Field(..., pattern="^(cancel|return)$")
    reason: str = Field(..., min_length=1, max_length=120)
    note: Optional[str] = Field(None, max_length=2000)


# =====================================================================
# Health / root
# =====================================================================
@api_router.get("/health")
async def health():
    return {"status": "ok"}


@api_router.get("/")
async def root():
    return {"message": "Karijeeva API"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    rows = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for r in rows:
        if isinstance(r.get('timestamp'), str):
            r['timestamp'] = datetime.fromisoformat(r['timestamp'])
    return rows


# =====================================================================
# Phase 0 — Razorpay POC (untouched behaviour, shared razorpay_client)
# =====================================================================
@api_router.post("/payments/create-order", response_model=CreateOrderResponse)
async def create_payment_order(payload: CreateOrderRequest):
    try:
        amount_paise = int(round(payload.amount_inr * 100))
        if amount_paise < 100:
            raise HTTPException(status_code=400, detail="Minimum amount is ₹1")
        receipt = (payload.receipt or f"rcpt_{uuid.uuid4().hex[:16]}")[:40]
        rz_order = razorpay_client.order.create(data={
            "amount": amount_paise, "currency": "INR", "receipt": receipt,
            "payment_capture": 1,
            **({"notes": payload.notes} if payload.notes else {}),
        })
        iso = now_iso()
        await db.payment_orders.insert_one({
            "id": str(uuid.uuid4()),
            "razorpay_order_id": rz_order["id"],
            "amount_inr": payload.amount_inr,
            "amount_paise": amount_paise,
            "currency": "INR",
            "status": "created",
            "receipt": receipt,
            "notes": payload.notes or {},
            "razorpay_payment_id": None,
            "razorpay_signature": None,
            "created_at": iso, "updated_at": iso,
        })
        return CreateOrderResponse(order_id=rz_order["id"], amount=amount_paise, currency="INR", key_id=RAZORPAY_KEY_ID)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("create_payment_order failed")
        raise HTTPException(status_code=500, detail=f"Failed to create order: {e}")


@api_router.post("/payments/verify")
async def verify_payment(payload: VerifyPaymentRequest):
    params = {
        "razorpay_order_id": payload.razorpay_order_id,
        "razorpay_payment_id": payload.razorpay_payment_id,
        "razorpay_signature": payload.razorpay_signature,
    }
    iso = now_iso()
    try:
        razorpay_client.utility.verify_payment_signature(params)
    except razorpay.errors.SignatureVerificationError:
        await db.payment_orders.update_one(
            {"razorpay_order_id": payload.razorpay_order_id},
            {"$set": {"status": "failed", "razorpay_payment_id": payload.razorpay_payment_id,
                      "razorpay_signature": payload.razorpay_signature, "updated_at": iso}},
        )
        raise HTTPException(status_code=400, detail={"verified": False, "error": "Signature verification failed"})
    await db.payment_orders.update_one(
        {"razorpay_order_id": payload.razorpay_order_id},
        {"$set": {"status": "paid", "razorpay_payment_id": payload.razorpay_payment_id,
                  "razorpay_signature": payload.razorpay_signature, "updated_at": iso}},
    )
    return {"verified": True, "status": "paid"}


@api_router.get("/payments/order/{razorpay_order_id}", response_model=PaymentOrderDoc)
async def get_payment_order(razorpay_order_id: str):
    doc = await db.payment_orders.find_one({"razorpay_order_id": razorpay_order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    return doc


# =====================================================================
# Phase 1 — Newsletter + Contact
# =====================================================================
@api_router.post("/newsletter/subscribe")
async def newsletter_subscribe(payload: NewsletterSubscribeRequest):
    email_norm = payload.email.strip().lower()
    iso = now_iso()
    existing = await db.newsletter_subscribers.find_one({"email": email_norm}, {"_id": 0})
    if existing:
        await db.newsletter_subscribers.update_one({"email": email_norm}, {"$set": {"last_seen_at": iso}})
        return {"success": True, "already_subscribed": True}
    await db.newsletter_subscribers.insert_one({
        "id": str(uuid.uuid4()), "email": email_norm, "subscribed_at": iso,
        "last_seen_at": iso, "source": payload.source or "footer",
    })
    coupon = await db.coupons.find_one({"code": "WELCOME10", "active": True}, {"_id": 0})
    if coupon:
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
        return {
            "success": True, "welcome_code": coupon["code"],
            "discount_desc": coupon.get("description", "10% off your first order over ₹499"),
            "expires_at": expires_at,
        }
    return {"success": True}


@api_router.post("/contact")
async def submit_contact(payload: ContactRequest):
    doc = {
        "id": str(uuid.uuid4()),
        "name": payload.name.strip(),
        "email": payload.email.strip().lower(),
        "phone": (payload.phone or "").strip(),
        "subject": (payload.subject or "").strip(),
        "message": payload.message.strip(),
        "created_at": now_iso(),
        "status": "new",
    }
    await db.contact_messages.insert_one(doc)
    return {"success": True, "id": doc["id"]}


# =====================================================================
# Phase 2 — Catalog / Recipes / Blog / Testimonials / FAQs / SEO
# =====================================================================
@api_router.get("/products", response_model=ProductListResponse)
async def list_products(category: Optional[str] = None, featured: Optional[bool] = None, sort: Optional[str] = None):
    query: Dict[str, Any] = {"is_active": True}
    if category:
        query["category"] = category
    if featured is not None:
        query["is_featured"] = featured
    products = await db.products.find(query, {"_id": 0}).to_list(200)
    for p in products:
        variants = await db.product_variants.find({"product_slug": p["slug"]}, {"_id": 0}).to_list(50)
        variants.sort(key=lambda v: v["price"])
        p["variants"] = variants
        prices = [v["price"] for v in variants] or [0]
        p["price_range"] = {"min": min(prices), "max": max(prices)}
    if sort == "price-asc":
        products.sort(key=lambda p: p["price_range"]["min"])
    elif sort == "price-desc":
        products.sort(key=lambda p: p["price_range"]["max"], reverse=True)
    elif sort == "rating":
        products.sort(key=lambda p: p.get("avg_rating", 0), reverse=True)
    elif sort == "newest":
        products.sort(key=lambda p: p.get("created_at", ""), reverse=True)
    return {"products": products, "count": len(products)}


@api_router.get("/products/{slug}")
async def get_product(slug: str):
    product = await db.products.find_one({"slug": slug, "is_active": True}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    variants = await db.product_variants.find({"product_slug": slug}, {"_id": 0}).to_list(50)
    variants.sort(key=lambda v: v["price"])
    recipes = await db.recipes.find({"pairs_with_product_slug": slug}, {"_id": 0}).to_list(20)
    faqs = await db.faqs.find({"category": {"$in": ["product", "cooking", "wellness"]}}, {"_id": 0}).to_list(20)
    reviews = await db.reviews.find(
        {"product_id": {"$in": [product.get("id"), product["slug"]]}, "is_approved": True}, {"_id": 0}
    ).to_list(200)
    reviews.sort(key=lambda r: r.get("created_at", ""), reverse=True)
    product["variants"] = variants
    product["pairs_with_recipes"] = recipes
    product["reviews"] = reviews
    product["related_faqs"] = faqs[:5]
    prices = [v["price"] for v in variants] or [0]
    product["price_range"] = {"min": min(prices), "max": max(prices)}
    return product


@api_router.get("/recipes")
async def list_recipes():
    recipes = await db.recipes.find({}, {"_id": 0}).to_list(200)
    return {"recipes": recipes, "count": len(recipes)}


@api_router.get("/recipes/{slug}")
async def get_recipe(slug: str):
    recipe = await db.recipes.find_one({"slug": slug}, {"_id": 0})
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    pair = recipe.get("pairs_with_product_slug")
    if pair:
        recipe["pairs_with_product"] = await db.products.find_one({"slug": pair}, {"_id": 0})
    return recipe


@api_router.get("/blog")
async def list_blog(category: Optional[str] = None):
    query = {"category": category} if category else {}
    posts = await db.blog_posts.find(query, {"_id": 0, "content_md": 0}).to_list(200)
    posts.sort(key=lambda p: p.get("published_at", ""), reverse=True)
    return {"posts": posts, "count": len(posts)}


@api_router.get("/blog/{slug}")
async def get_blog_post(slug: str):
    post = await db.blog_posts.find_one({"slug": slug}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    related = await db.blog_posts.find(
        {"category": post.get("category"), "slug": {"$ne": slug}}, {"_id": 0, "content_md": 0}
    ).to_list(3)
    post["related"] = related
    return post


@api_router.get("/testimonials")
async def list_testimonials():
    items = await db.testimonials.find({}, {"_id": 0}).to_list(100)
    return {"testimonials": items, "count": len(items)}


@api_router.get("/faqs")
async def list_faqs(category: Optional[str] = None):
    query = {"category": category} if category else {}
    items = await db.faqs.find(query, {"_id": 0}).to_list(200)
    return {"faqs": items, "count": len(items)}


@api_router.get("/site-settings")
async def get_site_settings():
    doc = await db.site_settings.find_one({"_singleton": True}, {"_id": 0})
    return doc or {}


@api_router.get("/sitemap.xml")
async def sitemap():
    base = SITE_PUBLIC_URL
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    urls = [
        {"loc": f"{base}/", "priority": "1.0"},
        {"loc": f"{base}/products", "priority": "0.9"},
        {"loc": f"{base}/about", "priority": "0.7"},
        {"loc": f"{base}/blog", "priority": "0.8"},
        {"loc": f"{base}/recipes", "priority": "0.8"},
        {"loc": f"{base}/contact", "priority": "0.5"},
        {"loc": f"{base}/cold-pressed-coconut-oil-benefits", "priority": "0.9"},
    ]
    async for p in db.products.find({"is_active": True}, {"_id": 0, "slug": 1}):
        urls.append({"loc": f"{base}/products/{p['slug']}", "priority": "0.9"})
    async for b in db.blog_posts.find({}, {"_id": 0, "slug": 1}):
        urls.append({"loc": f"{base}/blog/{b['slug']}", "priority": "0.7"})
    async for r in db.recipes.find({}, {"_id": 0, "slug": 1}):
        urls.append({"loc": f"{base}/recipes/{r['slug']}", "priority": "0.7"})
    body = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        body.append(f'  <url><loc>{u["loc"]}</loc><lastmod>{today}</lastmod><changefreq>weekly</changefreq><priority>{u["priority"]}</priority></url>')
    body.append('</urlset>')
    return Response(content="\n".join(body), media_type="application/xml")


@api_router.get("/robots.txt")
async def robots():
    text = (
        "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /razorpay-poc\n"
        "Disallow: /design-system\nDisallow: /checkout\nDisallow: /account\n"
        f"Sitemap: {SITE_PUBLIC_URL}/api/sitemap.xml\n"
    )
    return Response(content=text, media_type="text/plain")


# =====================================================================
# Phase 3 — Auth
# =====================================================================
@api_router.post("/auth/register", response_model=AuthResponse)
async def auth_register(payload: RegisterRequest, response: Response):
    email_norm = payload.email.strip().lower()
    if await db.users.find_one({"email": email_norm}):
        raise HTTPException(status_code=409, detail="An account already exists with this email")
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": email_norm,
        "name": payload.name.strip(),
        "password_hash": hash_password(payload.password),
        "role": "customer",
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    token = make_jwt(user_doc["id"], email_norm, user_doc.get("role", "customer"))
    set_auth_cookie(response, token)
    safe = {k: v for k, v in user_doc.items() if k not in ("_id", "password_hash")}
    return {"user": safe, "access_token": token}


@api_router.post("/auth/login", response_model=AuthResponse)
async def auth_login(payload: LoginRequest, response: Response, request: Request):
    email_norm = payload.email.strip().lower()
    # Lightweight brute-force limiter: 5 failed attempts per IP per minute
    ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else "unknown")
    window_start = (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()
    recent_fail = await db.auth_attempts.count_documents({"ip": ip, "ok": False, "created_at": {"$gte": window_start}})
    if recent_fail >= 5:
        raise HTTPException(status_code=429, detail="Too many attempts, please wait a minute")
    user = await db.users.find_one({"email": email_norm})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        await db.auth_attempts.insert_one({"ip": ip, "email": email_norm, "ok": False, "created_at": now_iso()})
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.auth_attempts.insert_one({"ip": ip, "email": email_norm, "ok": True, "created_at": now_iso()})
    token = make_jwt(user["id"], email_norm, user.get("role", "customer"))
    set_auth_cookie(response, token)
    safe = {k: v for k, v in user.items() if k not in ("_id", "password_hash")}
    return {"user": safe, "access_token": token}


@api_router.post("/auth/logout")
async def auth_logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"success": True}


@api_router.get("/auth/me")
async def auth_me(user: Dict[str, Any] = Depends(get_current_user)):
    return {"user": user}


# =====================================================================
# Phase 3 — Geo (pincode lookup proxy — India Post)
# =====================================================================
@api_router.get("/geo/pincode/{pin}")
async def pincode_lookup(pin: str):
    if not (pin.isdigit() and len(pin) == 6):
        raise HTTPException(status_code=400, detail="Pincode must be 6 digits")
    cached = await db.pincode_cache.find_one({"pin": pin}, {"_id": 0})
    if cached:
        return cached["data"]
    url = f"https://api.postalpincode.in/pincode/{pin}"
    try:
        async with httpx.AsyncClient(timeout=8.0) as c:
            r = await c.get(url)
            r.raise_for_status()
            raw = r.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Pincode service unavailable")
    if not raw or not isinstance(raw, list) or raw[0].get("Status") != "Success":
        raise HTTPException(status_code=404, detail="Pincode not found")
    offices = raw[0].get("PostOffice") or []
    if not offices:
        raise HTTPException(status_code=404, detail="Pincode has no post offices")
    first = offices[0]
    data = {
        "pin": pin,
        "city": first.get("District") or first.get("Block") or "",
        "state": first.get("State", ""),
        "country": first.get("Country", "India"),
        "offices": [o.get("Name") for o in offices[:10]],
    }
    await db.pincode_cache.update_one({"pin": pin}, {"$set": {"pin": pin, "data": data, "cached_at": now_iso()}}, upsert=True)
    return data


# =====================================================================
# Phase 3 — Coupons
# =====================================================================
@api_router.post("/coupons/validate")
async def validate_coupon(payload: CouponValidateRequest, response: Response):
    """Return HTTP 200 with `{valid:false, message}` for soft-invalid cases
    (below-min, expired, over-used, unknown-code). Frontend renders as inline
    message; server errors are reserved for actual server errors."""
    code = payload.code.strip().upper()
    coupon = await db.coupons.find_one({"code": code}, {"_id": 0})
    if not coupon or not coupon.get("active"):
        response.status_code = 404
        return {"valid": False, "code": code, "message": "Coupon not found"}
    if coupon.get("used_count", 0) >= coupon.get("max_uses", 999999):
        return {"valid": False, "code": code, "message": "Coupon has reached its usage limit"}
    expires_at = coupon.get("expires_at")
    if expires_at and datetime.fromisoformat(expires_at) < datetime.now(timezone.utc):
        return {"valid": False, "code": code, "message": "Coupon has expired"}
    min_order = coupon.get("min_order", 0)
    if payload.subtotal < min_order:
        short = int(min_order - payload.subtotal)
        return {
            "valid": False, "code": code,
            "message": f"Minimum order ₹{int(min_order)} required" + (f" (add ₹{short} more)" if short > 0 else ""),
        }
    if coupon["type"] == "percent":
        discount = round(payload.subtotal * (coupon["value"] / 100.0), 2)
    else:  # flat
        discount = min(coupon["value"], payload.subtotal)
    return {
        "valid": True, "code": code, "type": coupon["type"],
        "discount_value": coupon["value"],
        "final_discount_amount": discount,
        "message": coupon.get("description", "Coupon applied"),
    }


# =====================================================================
# Phase 3 — Orders
# =====================================================================
def _compute_totals(items_resolved, coupon_final_discount: float) -> Dict[str, float]:
    subtotal = sum(i["total_price"] for i in items_resolved)
    discount = round(min(coupon_final_discount, subtotal), 2)
    taxable = subtotal - discount
    gst = round(taxable * 0.05, 2)
    shipping = 0 if taxable >= 999 else 49
    total = round(taxable + gst + shipping, 2)
    return {"subtotal": round(subtotal, 2), "discount": discount, "gst": gst, "shipping": shipping, "total": total}


@api_router.post("/orders/create")
async def order_create(
    payload: OrderCreateRequest,
    response: Response,
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
):
    # 1. Resolve & price-verify each item server-side
    resolved: List[Dict[str, Any]] = []
    for it in payload.items:
        variant = await db.product_variants.find_one({"id": it.variant_id}, {"_id": 0})
        if not variant:
            raise HTTPException(status_code=400, detail=f"Variant {it.variant_id} not found")
        if variant["stock"] < it.quantity:
            raise HTTPException(status_code=400, detail=f"Only {variant['stock']} available for {variant['sku']}")
        product = await db.products.find_one({"slug": variant["product_slug"]}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=400, detail="Product not found for variant")
        resolved.append({
            "variant_id": variant["id"],
            "product_id": product.get("id") or product.get("slug"),
            "product_slug": product["slug"],
            "product_name": product["name"],
            "variant_size": variant["size"],
            "sku": variant["sku"],
            "quantity": it.quantity,
            "unit_price": variant["price"],
            "total_price": variant["price"] * it.quantity,
            "image": (product.get("gallery") or [""])[0],
        })

    # 2. Validate coupon if given
    coupon_discount = 0.0
    coupon_doc = None
    if payload.coupon_code:
        code = payload.coupon_code.strip().upper()
        coupon_doc = await db.coupons.find_one({"code": code, "active": True}, {"_id": 0})
        if not coupon_doc:
            raise HTTPException(status_code=400, detail="Coupon is not valid")
        if coupon_doc.get("used_count", 0) >= coupon_doc.get("max_uses", 999999):
            raise HTTPException(status_code=400, detail="Coupon usage limit reached")
        subtotal = sum(i["total_price"] for i in resolved)
        if subtotal < coupon_doc.get("min_order", 0):
            raise HTTPException(status_code=400, detail="Coupon min-order not met")
        if coupon_doc["type"] == "percent":
            coupon_discount = round(subtotal * (coupon_doc["value"] / 100.0), 2)
        else:
            coupon_discount = min(coupon_doc["value"], subtotal)

    totals = _compute_totals(resolved, coupon_discount)
    amount_paise = int(round(totals["total"] * 100))
    if amount_paise < 100:
        raise HTTPException(status_code=400, detail="Order amount too small")

    # 3. Create Razorpay order
    order_number = gen_order_number()
    try:
        rz_order = razorpay_client.order.create(data={
            "amount": amount_paise, "currency": "INR",
            "receipt": order_number[:40], "payment_capture": 1,
            "notes": {"order_number": order_number, "user_id": user["id"] if user else "guest"},
        })
    except Exception as e:
        logger.exception("Razorpay order creation failed")
        raise HTTPException(status_code=500, detail=f"Could not create Razorpay order: {e}")

    # 4. Persist our order
    order_doc = {
        "id": str(uuid.uuid4()),
        "order_number": order_number,
        "user_id": user["id"] if user else None,
        "guest_email": (payload.guest_email or (user.get("email") if user else "")).lower() if (payload.guest_email or user) else "",
        "guest_phone": payload.guest_phone or payload.address.phone,
        "address_snapshot": payload.address.model_dump(),
        "items": resolved,
        "subtotal": totals["subtotal"],
        "discount_amount": totals["discount"],
        "coupon_code": (payload.coupon_code or "").upper() if payload.coupon_code else None,
        "gst_amount": totals["gst"],
        "shipping_amount": totals["shipping"],
        "total": totals["total"],
        "status": "pending_payment",
        "razorpay_order_id": rz_order["id"],
        "razorpay_payment_id": None,
        "razorpay_signature": None,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.orders.insert_one(order_doc)

    return {
        "order_id": order_doc["id"],
        "order_number": order_number,
        "amount": amount_paise,
        "currency": "INR",
        "razorpay_order_id": rz_order["id"],
        "key_id": RAZORPAY_KEY_ID,
        "totals": totals,
    }


@api_router.post("/orders/verify")
async def order_verify(payload: OrderVerifyRequest):
    order = await db.orders.find_one({"id": payload.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["razorpay_order_id"] != payload.razorpay_order_id:
        raise HTTPException(status_code=400, detail="Order mismatch")

    iso = now_iso()
    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": payload.razorpay_order_id,
            "razorpay_payment_id": payload.razorpay_payment_id,
            "razorpay_signature": payload.razorpay_signature,
        })
    except razorpay.errors.SignatureVerificationError as e:
        # POLICY: keep order at pending_payment so user can retry.
        # Audit trail stored in payment_attempts for Phase 5 admin review.
        await db.payment_attempts.insert_one({
            "id": str(uuid.uuid4()),
            "order_id": order["id"],
            "razorpay_order_id": payload.razorpay_order_id,
            "attempted_payment_id": payload.razorpay_payment_id,
            "signature_valid": False,
            "error": str(e) or "Signature verification failed",
            "created_at": iso,
        })
        await db.orders.update_one({"id": order["id"]}, {"$set": {"updated_at": iso}})
        raise HTTPException(status_code=400, detail={"verified": False, "error": "Signature verification failed"})

    # Decrement stock atomically
    for item in order["items"]:
        await db.product_variants.update_one(
            {"id": item["variant_id"]},
            {"$inc": {"stock": -item["quantity"]}},
        )
        await db.inventory_logs.insert_one({
            "id": str(uuid.uuid4()),
            "variant_id": item["variant_id"],
            "change": -item["quantity"],
            "reason": "sale",
            "reference": order["id"],
            "created_at": iso,
        })

    # Consume coupon
    if order.get("coupon_code"):
        await db.coupons.update_one(
            {"code": order["coupon_code"]},
            {"$inc": {"used_count": 1}},
        )

    await db.orders.update_one({"id": order["id"]}, {"$set": {
        "status": "paid",
        "razorpay_payment_id": payload.razorpay_payment_id,
        "razorpay_signature": payload.razorpay_signature,
        "updated_at": iso,
    }})

    return {"verified": True, "status": "paid", "order_id": order["id"], "order_number": order["order_number"]}


@api_router.get("/orders/mine")
async def orders_mine(user: Dict[str, Any] = Depends(get_current_user)):
    rows = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    rows.sort(key=lambda r: r.get("created_at", ""), reverse=True)
    return {"orders": rows, "count": len(rows)}


@api_router.get("/orders/{order_id}")
async def orders_get(
    order_id: str,
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    # Owner: logged-in user, OR guest email matches query param
    if user and order.get("user_id") == user["id"]:
        return order
    q_email = request.query_params.get("email", "").strip().lower()
    if order.get("guest_email") and q_email == order["guest_email"]:
        return order
    # For a clean confirmation page right after payment, allow access
    # by order_number as a short-lived token (first 30 min after creation)
    try:
        created = datetime.fromisoformat(order["created_at"])
        if (datetime.now(timezone.utc) - created).total_seconds() < 1800:
            return order
    except Exception:
        pass
    raise HTTPException(status_code=403, detail="Not authorised to view this order")


@api_router.post("/orders/{order_id}/cancel")
async def orders_cancel(order_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["status"] != "pending_payment":
        raise HTTPException(status_code=400, detail=f"Cannot cancel order with status '{order['status']}'")
    await db.orders.update_one({"id": order_id}, {"$set": {"status": "cancelled", "updated_at": now_iso()}})
    return {"success": True}


# =====================================================================
# Phase 3 — Reviews
# =====================================================================
@api_router.post("/reviews")
async def reviews_create(payload: ReviewCreateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    # Verified-buyer check: must have a paid order containing a variant of this product
    product = await db.products.find_one(
        {"$or": [{"id": payload.product_id}, {"slug": payload.product_id}]},
        {"_id": 0},
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    has_bought = await db.orders.find_one({
        "user_id": user["id"],
        "status": {"$in": ["paid", "processing", "shipped", "delivered"]},
        "items.product_slug": product["slug"],
    })
    if not has_bought:
        raise HTTPException(status_code=403, detail="Only verified buyers can review this product")

    doc = {
        "id": str(uuid.uuid4()),
        "product_id": product.get("id") or product["slug"],
        "product_slug": product["slug"],
        "user_id": user["id"],
        "user_name": user["name"],
        "rating": payload.rating,
        "title": (payload.title or "").strip(),
        "body": payload.body.strip(),
        "is_verified_buyer": True,
        "is_approved": False,  # moderation in Phase 5
        "created_at": now_iso(),
    }
    await db.reviews.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "review": doc}


@api_router.get("/reviews")
async def reviews_list(product_id: str):
    product = await db.products.find_one(
        {"$or": [{"id": product_id}, {"slug": product_id}]}, {"_id": 0}
    )
    if not product:
        return {"reviews": [], "count": 0}
    rows = await db.reviews.find(
        {"product_id": {"$in": [product.get("id"), product["slug"]]}, "is_approved": True},
        {"_id": 0},
    ).to_list(200)
    rows.sort(key=lambda r: r.get("created_at", ""), reverse=True)
    return {"reviews": rows, "count": len(rows)}


# =====================================================================
# Phase 4 — Wishlist
# =====================================================================
async def _live_variant_with_product(variant_id: str) -> Optional[Dict[str, Any]]:
    v = await db.product_variants.find_one({"id": variant_id}, {"_id": 0})
    if not v:
        return None
    p = await db.products.find_one({"slug": v["product_slug"]}, {"_id": 0})
    if not p:
        return None
    return {
        "variant_id": v["id"],
        "product_id": p.get("id") or p["slug"],
        "product_slug": p["slug"],
        "product_name": p["name"],
        "variant_size": v["size"],
        "sku": v["sku"],
        "price": v["price"],
        "mrp": v["mrp"],
        "in_stock": v.get("stock", 0) > 0,
        "stock": v.get("stock", 0),
        "image": (p.get("gallery") or [""])[0],
    }


@api_router.get("/wishlist")
async def wishlist_list(user: Dict[str, Any] = Depends(get_current_user)):
    rows = await db.wishlists.find({"user_id": user["id"]}, {"_id": 0}).to_list(500)
    rows.sort(key=lambda r: r.get("created_at", ""), reverse=True)
    enriched = []
    for r in rows:
        live = await _live_variant_with_product(r["variant_id"])
        if not live:
            continue
        enriched.append({**r, **live})
    return {"items": enriched, "count": len(enriched)}


@api_router.post("/wishlist")
async def wishlist_add(payload: WishlistAddRequest, user: Dict[str, Any] = Depends(get_current_user)):
    live = await _live_variant_with_product(payload.variant_id)
    if not live:
        raise HTTPException(status_code=404, detail="Variant not found")
    snapshot = {
        "name": live["product_name"], "slug": live["product_slug"],
        "image": live["image"], "price": live["price"], "mrp": live["mrp"],
        "size": live["variant_size"],
    }
    iso = now_iso()
    existing = await db.wishlists.find_one(
        {"user_id": user["id"], "variant_id": payload.variant_id}, {"_id": 0}
    )
    if existing:
        return {"success": True, "already": True, "item": {**existing, **live}}
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "variant_id": payload.variant_id,
        "product_id": live["product_id"],
        "product_snapshot": snapshot,
        "created_at": iso,
    }
    await db.wishlists.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "already": False, "item": {**doc, **live}}


@api_router.delete("/wishlist/{variant_id}")
async def wishlist_remove(variant_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    res = await db.wishlists.delete_one({"user_id": user["id"], "variant_id": variant_id})
    return {"success": res.deleted_count > 0}


@api_router.post("/wishlist/{variant_id}/move-to-cart")
async def wishlist_move_to_cart(variant_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    live = await _live_variant_with_product(variant_id)
    if not live:
        raise HTTPException(status_code=404, detail="Variant not found")
    await db.wishlists.delete_one({"user_id": user["id"], "variant_id": variant_id})
    # Return payload for the frontend to push into its own cart context
    return {
        "success": True,
        "cart_item": {
            "variant_id": live["variant_id"],
            "product_id": live["product_id"],
            "product_name": live["product_name"],
            "variant_size": live["variant_size"],
            "sku": live["sku"],
            "image": live["image"],
            "unit_price": live["price"],
            "mrp": live["mrp"],
            "slug": live["product_slug"],
            "quantity": 1,
        },
    }


# =====================================================================
# Phase 4 — Order requests (cancel / return intent)
# =====================================================================
async def _assert_order_access(order: Dict[str, Any], user: Optional[Dict[str, Any]], q_email: str) -> None:
    if user and order.get("user_id") == user["id"]:
        return
    if order.get("guest_email") and q_email.strip().lower() == order["guest_email"]:
        return
    raise HTTPException(status_code=404, detail="Order not found")


@api_router.post("/orders/{order_id}/request")
async def order_request(
    order_id: str,
    payload: OrderRequestPayload,
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    await _assert_order_access(order, user, request.query_params.get("email", ""))

    if payload.type == "cancel" and order["status"] not in ("paid", "processing", "pending_payment"):
        raise HTTPException(status_code=400, detail=f"Cannot cancel an order in '{order['status']}' state")
    if payload.type == "return" and order["status"] != "delivered":
        raise HTTPException(status_code=400, detail="Returns are only available after delivery")

    doc = {
        "id": str(uuid.uuid4()),
        "order_id": order["id"],
        "order_number": order["order_number"],
        "user_id": order.get("user_id"),
        "guest_email": order.get("guest_email"),
        "type": payload.type,
        "reason": payload.reason.strip(),
        "note": (payload.note or "").strip(),
        "status": "open",
        "created_at": now_iso(),
    }
    await db.order_requests.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "request": doc}


# =====================================================================
# Phase 4 — Invoice (HTML)
# =====================================================================
def _rupees(n) -> str:
    try:
        return f"₹{float(n):,.2f}"
    except Exception:
        return f"₹{n}"


@api_router.get("/orders/{order_id}/invoice.html")
async def order_invoice_html(
    order_id: str,
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    await _assert_order_access(order, user, request.query_params.get("email", ""))

    settings = await db.site_settings.find_one({"_singleton": True}, {"_id": 0}) or {}
    contact = settings.get("contact", {})
    addr = order.get("address_snapshot", {})
    items_html = "".join(
        f"<tr><td>{i.get('product_name','')} <span class='sz'>· {i.get('variant_size','')}</span></td>"
        f"<td class='num'>{i.get('quantity',0)}</td>"
        f"<td class='num'>{_rupees(i.get('unit_price',0))}</td>"
        f"<td class='num'>{_rupees(i.get('total_price',0))}</td></tr>"
        for i in (order.get("items") or [])
    )

    created_str = ""
    try:
        created_str = datetime.fromisoformat(order["created_at"]).strftime("%d %b %Y, %I:%M %p")
    except Exception:
        created_str = order.get("created_at", "")

    html = f"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<title>Invoice · {order['order_number']} · Karijeeva</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  @page {{ size: A4; margin: 18mm; }}
  * {{ box-sizing: border-box; }}
  body {{ font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#2A2A2A; margin:0; padding:40px; background:#FDFAF4; }}
  .sheet {{ max-width:820px; margin:0 auto; background:#fff; padding:56px 48px; border:1px solid rgba(200,133,26,0.18); box-shadow:0 2px 24px rgba(26,92,42,0.06); }}
  .brand {{ display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid rgba(200,133,26,0.25); padding-bottom:24px; }}
  .brand h1 {{ font-family:'Fraunces', Georgia, serif; font-size:32px; color:#1A5C2A; margin:0; letter-spacing:0.02em; }}
  .brand .tag {{ font-family:'Instrument Serif', serif; font-style:italic; color:#C8851A; font-size:14px; letter-spacing:0.2em; text-transform:uppercase; margin-top:4px; }}
  .meta {{ text-align:right; font-size:12px; color:#5C3D1A; line-height:1.6; }}
  .section {{ margin-top:32px; }}
  .section h3 {{ font-family:'Fraunces', Georgia, serif; font-size:13px; letter-spacing:0.22em; text-transform:uppercase; color:#C8851A; margin:0 0 12px; }}
  .addr {{ font-size:14px; color:#2A2A2A; line-height:1.55; }}
  table {{ width:100%; border-collapse:collapse; margin-top:24px; }}
  thead th {{ text-align:left; font-family:'Inter', sans-serif; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#5C3D1A; border-bottom:2px solid #1A5C2A; padding:10px 8px; }}
  tbody td {{ padding:14px 8px; border-bottom:1px solid rgba(200,133,26,0.14); font-size:14px; }}
  td.num, th.num {{ text-align:right; font-variant-numeric: tabular-nums; }}
  .sz {{ color:#7F6B4E; font-size:12px; }}
  .totals {{ margin-top:24px; margin-left:auto; width:260px; font-size:14px; }}
  .totals .row {{ display:flex; justify-content:space-between; padding:6px 0; }}
  .totals .grand {{ border-top:2px solid #1A5C2A; margin-top:8px; padding-top:12px; font-family:'Fraunces', Georgia, serif; font-size:20px; color:#1A5C2A; }}
  footer {{ margin-top:48px; padding-top:20px; border-top:1px solid rgba(200,133,26,0.2); text-align:center; font-size:11px; color:#7F6B4E; letter-spacing:0.08em; }}
  .print-btn {{ position:fixed; top:20px; right:20px; background:#1A5C2A; color:#C8851A; border:0; font-family:'Inter',sans-serif; font-size:12px; letter-spacing:0.22em; text-transform:uppercase; padding:12px 22px; border-radius:999px; cursor:pointer; box-shadow:0 6px 24px rgba(26,92,42,0.28); }}
  @media print {{ .print-btn {{ display:none; }} body {{ background:#fff; padding:0; }} .sheet {{ box-shadow:none; border:0; padding:0; }} }}
</style>
</head><body>
  <button class="print-btn" onclick="window.print()">Download / Print</button>
  <div class="sheet">
    <header class="brand">
      <div>
        <h1>Karijeeva</h1>
        <div class="tag">Pure · Pressed · Powerful</div>
      </div>
      <div class="meta">
        <div><strong>Invoice</strong> {order['order_number']}</div>
        <div>{created_str}</div>
        <div style="margin-top:6px;">Kadle Global Pvt Ltd</div>
        <div>GSTIN: 29AABCT1234A1ZK</div>
        <div>FSSAI: 10012345678</div>
      </div>
    </header>
    <div class="section" style="display:flex; gap:48px;">
      <div style="flex:1">
        <h3>Billed &amp; shipped to</h3>
        <div class="addr">
          <strong>{addr.get('full_name','')}</strong><br/>
          {addr.get('line1','')} {addr.get('line2') or ''}<br/>
          {addr.get('city','')}, {addr.get('state','')} {addr.get('pincode','')}<br/>
          {addr.get('country','India')}<br/>
          {addr.get('phone','')}
        </div>
      </div>
      <div style="flex:1">
        <h3>From</h3>
        <div class="addr">
          <strong>Karijeeva by Kadle Global Pvt Ltd</strong><br/>
          {contact.get('address','42 Indiranagar 6th Main, Bengaluru 560038')}<br/>
          {contact.get('email','hello@karijeeva.in')}<br/>
          {contact.get('phone','')}
        </div>
      </div>
    </div>

    <table>
      <thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Unit</th><th class="num">Total</th></tr></thead>
      <tbody>{items_html}</tbody>
    </table>

    <div class="totals">
      <div class="row"><span>Subtotal</span><span>{_rupees(order.get('subtotal',0))}</span></div>
      {'<div class="row"><span>Discount' + (f" ({order['coupon_code']})" if order.get('coupon_code') else '') + '</span><span>-' + _rupees(order.get('discount_amount',0)) + '</span></div>' if (order.get('discount_amount') or 0) > 0 else ''}
      <div class="row"><span>GST (5%)</span><span>{_rupees(order.get('gst_amount',0))}</span></div>
      <div class="row"><span>Shipping</span><span>{_rupees(order.get('shipping_amount',0))}</span></div>
      <div class="row grand"><span>Total paid</span><span>{_rupees(order.get('total',0))}</span></div>
    </div>

    <footer>
      Thank you for cooking with Karijeeva. This is a system-generated invoice.<br/>
      Questions? hello@karijeeva.in
    </footer>
  </div>
</body></html>"""
    return Response(content=html, media_type="text/html; charset=utf-8")


# =====================================================================
# Razorpay webhook (Phase 6) — HMAC signature verify + event log
# =====================================================================
@api_router.post("/payments/webhook", include_in_schema=True)
async def razorpay_webhook(request: Request):
    import hmac
    import hashlib
    raw = await request.body()
    sig = request.headers.get("x-razorpay-signature", "")
    valid = False
    if RAZORPAY_WEBHOOK_SECRET:
        expected = hmac.new(RAZORPAY_WEBHOOK_SECRET.encode(), raw, hashlib.sha256).hexdigest()
        valid = hmac.compare_digest(expected, sig)

    try:
        body = await request.json()
    except Exception:
        body = {}

    event = body.get("event", "unknown")
    iso = now_iso()
    await db.razorpay_webhook_events.insert_one({
        "id": str(uuid.uuid4()),
        "event": event,
        "payload": body,
        "signature_valid": valid,
        "received_at": iso,
    })

    if not valid:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    # Best-effort status sync
    try:
        payload_data = (body.get("payload") or {})
        if event == "payment.captured":
            p = (payload_data.get("payment") or {}).get("entity") or {}
            order_id = p.get("order_id")
            if order_id:
                await db.orders.update_one(
                    {"razorpay_order_id": order_id, "status": "pending_payment"},
                    {"$set": {"status": "paid", "razorpay_payment_id": p.get("id"), "updated_at": iso}},
                )
        elif event in ("refund.processed", "refund.failed"):
            r = (payload_data.get("refund") or {}).get("entity") or {}
            await db.refunds.update_one(
                {"razorpay_refund_id": r.get("id")},
                {"$set": {"status": "processed" if event == "refund.processed" else "failed", "updated_at": iso}},
            )
    except Exception:
        logger.exception("webhook handler side effect failed")

    return {"ok": True, "event": event}


# =====================================================================
# Client error log (Phase 6)
# =====================================================================
class ClientErrorReport(BaseModel):
    message: str = Field(..., max_length=2000)
    stack: Optional[str] = Field(None, max_length=8000)
    url: Optional[str] = Field(None, max_length=800)
    user_agent: Optional[str] = Field(None, max_length=400)
    component: Optional[str] = Field(None, max_length=160)


@api_router.post("/errors/client")
async def client_error_log(payload: ClientErrorReport, request: Request):
    ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else "")
    await db.client_errors.insert_one({
        "id": str(uuid.uuid4()),
        "message": payload.message,
        "stack": payload.stack,
        "url": payload.url,
        "user_agent": payload.user_agent or request.headers.get("user-agent", ""),
        "component": payload.component,
        "ip": ip,
        "created_at": now_iso(),
    })
    # Cap at last 1000 entries
    total = await db.client_errors.count_documents({})
    if total > 1000:
        to_drop = total - 1000
        old = await db.client_errors.find({}, {"_id": 1}).sort("created_at", 1).limit(to_drop).to_list(to_drop)
        if old:
            await db.client_errors.delete_many({"_id": {"$in": [x["_id"] for x in old]}})
    return {"ok": True}


# =====================================================================
# Wire router + CORS
# =====================================================================
app.include_router(api_router)

# Phase 5 — Admin API (mounted AFTER api_router so /api/admin/* routes resolve
# via the same ingress. require_admin is role-gated; see admin_api.py).
from admin_api import mount_admin  # noqa: E402
admin_router = mount_admin(db, get_current_user)
app.include_router(admin_router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================================
# Phase 6 — Security headers + global exception handler
# =====================================================================
CSP = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.razorpay.com https://fonts.googleapis.com https://api.razorpay.com; "
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
    "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com; "
    "img-src 'self' data: blob: https:; "
    "connect-src 'self' https: wss:; "
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com; "
    "object-src 'none'; "
    "base-uri 'self'; "
    "form-action 'self' https://api.razorpay.com;"
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=(self \"https://api.razorpay.com\")"
    response.headers["Content-Security-Policy"] = CSP
    return response


from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


@app.exception_handler(HTTPException)
async def http_exc_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    # Keep legacy `detail` key so existing frontend error handlers keep working,
    # and add a consistent `error` envelope alongside.
    return JSONResponse(status_code=exc.status_code, content={
        "detail": detail,
        "error": {
            "code": f"http_{exc.status_code}",
            "message": detail if isinstance(detail, str) else "Request failed",
            "detail": detail if not isinstance(detail, str) else None,
        },
    }, headers=getattr(exc, "headers", None))


@app.exception_handler(RequestValidationError)
async def validation_exc_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={
        "detail": exc.errors(),
        "error": {"code": "validation_error", "message": "Invalid request", "detail": exc.errors()},
    })


@app.exception_handler(Exception)
async def generic_exc_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error for %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={
        "detail": "Internal server error",
        "error": {"code": "internal_error", "message": "Something went wrong on our side. Please try again shortly."},
    })


@app.on_event("startup")
async def ensure_indexes():
    try:
        await db.users.create_index("email", unique=True)
        await db.orders.create_index("order_number", unique=True)
        await db.orders.create_index([("user_id", 1), ("created_at", -1)])
        await db.reviews.create_index([("product_id", 1), ("is_approved", 1)])
        await db.product_variants.create_index("id", unique=True)
        await db.coupons.create_index("code", unique=True)
        await db.wishlists.create_index([("user_id", 1), ("variant_id", 1)], unique=True)
        await db.wishlists.create_index([("user_id", 1), ("created_at", -1)])
        await db.order_requests.create_index([("order_id", 1), ("created_at", -1)])
        await db.payment_attempts.create_index([("order_id", 1), ("created_at", -1)])
        await db.admin_audit_logs.create_index([("created_at", -1)])
        await db.admin_audit_logs.create_index([("admin_email", 1), ("created_at", -1)])
        await db.auth_attempts.create_index([("ip", 1), ("created_at", -1)])
        await db.auth_attempts.create_index("created_at", expireAfterSeconds=3600)
    except Exception:
        logger.exception("Index creation failed (non-fatal)")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
