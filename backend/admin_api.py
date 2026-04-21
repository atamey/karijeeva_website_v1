"""
Karijeeva admin API — all endpoints under /api/admin, role-gated.

Depends on `db`, `get_current_user`, `make_jwt`, `hash_password`, `now_iso`,
`razorpay_client`, `RAZORPAY_KEY_ID` exported by server.py. We avoid circular
imports by accepting these as a factory `mount_admin(db, deps)`.
"""
from __future__ import annotations
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
import csv
import io
import re
import uuid

from fastapi import APIRouter, HTTPException, Depends, Request, Response
from pydantic import BaseModel, Field, EmailStr


# ---------- Pydantic request models ----------
class AdminStatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None


class AdminShippingUpdate(BaseModel):
    awb: str = Field(..., min_length=1, max_length=64)
    carrier: str = Field(..., min_length=1, max_length=80)
    url: Optional[str] = None
    note: Optional[str] = None


class VariantIn(BaseModel):
    size: str
    sku: str
    price: float
    mrp: float
    stock: int = 0


class ProductIn(BaseModel):
    slug: Optional[str] = None
    name: str = Field(..., min_length=1)
    short_desc: str = ""
    long_desc: str = ""
    category: str = "wellness"
    tags: List[str] = []
    benefits: List[Dict[str, Any]] = []
    how_to_use: List[str] = []
    ingredients: str = ""
    gallery: List[str] = []
    is_featured: bool = False
    is_new_launch: bool = False
    is_active: bool = True
    variants: List[VariantIn] = []


class InventoryUpdate(BaseModel):
    new_stock: int = Field(..., ge=0)
    reason: str = Field(..., pattern="^(restock|adjustment|damaged|audit|sale)$")
    note: Optional[str] = None


class ReviewAction(BaseModel):
    action: str = Field(..., pattern="^(approve|reject|delete)$")
    reason: Optional[str] = None


class CouponIn(BaseModel):
    code: str = Field(..., min_length=2, max_length=32)
    type: str = Field(..., pattern="^(flat|percent)$")
    value: float = Field(..., gt=0)
    min_order: float = 0
    max_uses: int = 10000
    active: bool = True
    expires_at: Optional[str] = None  # ISO
    description: Optional[str] = ""


class RequestStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(open|in_review|resolved|declined)$")
    admin_note: Optional[str] = None


class SettingsPatch(BaseModel):
    tagline: Optional[str] = None
    vision_statement: Optional[str] = None
    hero_headline: Optional[str] = None
    hero_sub: Optional[str] = None
    hero_image: Optional[str] = None
    press_logos: Optional[List[Dict[str, Any]]] = None
    trust_stats: Optional[List[Dict[str, Any]]] = None
    contact: Optional[Dict[str, Any]] = None


class ContactRead(BaseModel):
    status: str = Field(..., pattern="^(new|read|resolved)$")


# ---------- Helpers ----------
def slugify(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"[\s_]+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s.strip("-") or f"item-{uuid.uuid4().hex[:6]}"


def pick_ip(request: Request) -> str:
    return request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else "")


# ---------- Factory ----------
def mount_admin(db, get_current_user):
    """Returns an APIRouter with all admin routes, with db + auth dep injected.

    `get_current_user` MUST be the FastAPI dependency that yields the current
    user dict (email, id, role). We re-fetch role from the DB to reject tampered
    tokens on privileged ops.
    """

    admin_router = APIRouter(prefix="/admin", tags=["admin"])

    async def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        # Re-fetch to prevent stale/escalated tokens
        fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
        if not fresh or fresh.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        return fresh

    async def audit(admin: Dict[str, Any], request: Request, action: str, target_type: str, target_id: str, diff: Optional[Dict[str, Any]] = None):
        await db.admin_audit_logs.insert_one({
            "id": str(uuid.uuid4()),
            "admin_user_id": admin["id"],
            "admin_email": admin["email"],
            "action": action,
            "target_type": target_type,
            "target_id": str(target_id),
            "diff": diff or {},
            "ip": pick_ip(request),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    # =======================================================
    # Dashboard
    # =======================================================
    @admin_router.get("/dashboard/stats")
    async def dashboard_stats(admin: Dict[str, Any] = Depends(require_admin)):
        today = datetime.now(timezone.utc).date().isoformat()
        paid_statuses = ["paid", "processing", "shipped", "out_for_delivery", "delivered"]
        pipeline_all = [{"$match": {"status": {"$in": paid_statuses}}}, {"$group": {"_id": None, "total": {"$sum": "$total"}, "count": {"$sum": 1}}}]
        agg_all = await db.orders.aggregate(pipeline_all).to_list(1)
        revenue_all = agg_all[0]["total"] if agg_all else 0
        paid_count = agg_all[0]["count"] if agg_all else 0

        revenue_today_pipeline = [
            {"$match": {"status": {"$in": paid_statuses}, "created_at": {"$regex": f"^{today}"}}},
            {"$group": {"_id": None, "total": {"$sum": "$total"}}},
        ]
        r_today = await db.orders.aggregate(revenue_today_pipeline).to_list(1)
        revenue_today = r_today[0]["total"] if r_today else 0

        total_orders = await db.orders.count_documents({})
        pending_payment = await db.orders.count_documents({"status": "pending_payment"})
        aov = round(revenue_all / paid_count, 2) if paid_count else 0
        conversion = round(paid_count / total_orders * 100, 1) if total_orders else 0

        low_stock = await db.product_variants.count_documents({"stock": {"$lte": 10}})
        pending_reviews = await db.reviews.count_documents({"is_approved": False})
        open_requests = await db.order_requests.count_documents({"status": "open"})
        new_messages = await db.contact_messages.count_documents({"status": "new"})
        newsletter_count = await db.newsletter_subscribers.count_documents({})

        return {
            "revenue_all_time": round(revenue_all, 2),
            "revenue_today": round(revenue_today, 2),
            "total_orders": total_orders,
            "paid_orders": paid_count,
            "pending_payment_orders": pending_payment,
            "aov": aov,
            "conversion_pct": conversion,
            "low_stock_count": low_stock,
            "pending_reviews_count": pending_reviews,
            "open_requests_count": open_requests,
            "new_messages_count": new_messages,
            "newsletter_count": newsletter_count,
        }

    @admin_router.get("/dashboard/trend")
    async def dashboard_trend(days: int = 30, admin: Dict[str, Any] = Depends(require_admin)):
        if days < 1 or days > 365:
            days = 30
        from_dt = (datetime.now(timezone.utc) - timedelta(days=days - 1)).date()
        paid_statuses = ["paid", "processing", "shipped", "out_for_delivery", "delivered"]
        rows = await db.orders.find(
            {"status": {"$in": paid_statuses}, "created_at": {"$gte": from_dt.isoformat()}},
            {"_id": 0, "created_at": 1, "total": 1},
        ).to_list(10000)
        buckets = {(from_dt + timedelta(days=i)).isoformat(): {"revenue": 0.0, "orders": 0} for i in range(days)}
        for r in rows:
            d = r["created_at"][:10]
            if d in buckets:
                buckets[d]["revenue"] += r["total"]
                buckets[d]["orders"] += 1
        trend = [{"date": k, "revenue": round(v["revenue"], 2), "orders": v["orders"]} for k, v in buckets.items()]
        return {"trend": trend}

    @admin_router.get("/dashboard/latest")
    async def dashboard_latest(admin: Dict[str, Any] = Depends(require_admin)):
        orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)
        reviews = await db.reviews.find({"is_approved": False}, {"_id": 0}).sort("created_at", -1).to_list(5)
        return {"orders": orders, "pending_reviews": reviews}

    # =======================================================
    # Orders
    # =======================================================
    @admin_router.get("/orders")
    async def orders_list(
        request: Request,
        status: Optional[str] = None,
        q: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        page: int = 1,
        page_size: int = 25,
        admin: Dict[str, Any] = Depends(require_admin),
    ):
        q_doc: Dict[str, Any] = {}
        if status and status != "all":
            q_doc["status"] = status
        if q:
            q_doc["$or"] = [
                {"order_number": {"$regex": re.escape(q), "$options": "i"}},
                {"guest_email": {"$regex": re.escape(q), "$options": "i"}},
                {"address_snapshot.phone": {"$regex": re.escape(q), "$options": "i"}},
                {"address_snapshot.full_name": {"$regex": re.escape(q), "$options": "i"}},
            ]
        if from_date:
            q_doc.setdefault("created_at", {})["$gte"] = from_date
        if to_date:
            q_doc.setdefault("created_at", {})["$lte"] = to_date + "T23:59:59+00:00"

        total = await db.orders.count_documents(q_doc)
        skip = max(0, (page - 1) * page_size)
        rows = await (
            db.orders.find(q_doc, {"_id": 0, "razorpay_signature": 0})
            .sort("created_at", -1)
            .skip(skip)
            .limit(max(1, min(100, page_size)))
            .to_list(page_size)
        )
        return {"orders": rows, "page": page, "page_size": page_size, "total": total}

    # CSV export MUST be defined BEFORE /orders/{order_id} to avoid route conflict
    @admin_router.get("/orders/export.csv")
    async def admin_orders_csv(
        status: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        admin: Dict[str, Any] = Depends(require_admin),
    ):
        q: Dict[str, Any] = {}
        if status and status != "all":
            q["status"] = status
        if from_date:
            q.setdefault("created_at", {})["$gte"] = from_date
        if to_date:
            q.setdefault("created_at", {})["$lte"] = to_date + "T23:59:59+00:00"
        rows = await db.orders.find(q, {"_id": 0}).sort("created_at", -1).to_list(10000)
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerow([
            "order_number", "created_at", "status", "customer_name", "customer_email", "phone",
            "items_count", "subtotal", "discount", "gst", "shipping", "total", "coupon_code",
            "razorpay_order_id", "razorpay_payment_id", "city", "state", "pincode",
        ])
        for o in rows:
            addr = o.get("address_snapshot", {}) or {}
            w.writerow([
                o.get("order_number", ""), o.get("created_at", ""), o.get("status", ""),
                addr.get("full_name", ""), o.get("guest_email", ""), addr.get("phone", ""),
                len(o.get("items", [])),
                o.get("subtotal", 0), o.get("discount_amount", 0), o.get("gst_amount", 0),
                o.get("shipping_amount", 0), o.get("total", 0), o.get("coupon_code") or "",
                o.get("razorpay_order_id", ""), o.get("razorpay_payment_id") or "",
                addr.get("city", ""), addr.get("state", ""), addr.get("pincode", ""),
            ])
        return Response(content=buf.getvalue(), media_type="text/csv",
                        headers={"Content-Disposition": f'attachment; filename="orders-{datetime.now().strftime("%Y%m%d")}.csv"'})

    @admin_router.get("/orders/{order_id}")
    async def admin_order_detail(order_id: str, admin: Dict[str, Any] = Depends(require_admin)):
        order = await db.orders.find_one({"id": order_id}, {"_id": 0})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        attempts = await db.payment_attempts.find({"order_id": order_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
        requests_ = await db.order_requests.find({"order_id": order_id}, {"_id": 0}).sort("created_at", -1).to_list(20)
        return {"order": order, "payment_attempts": attempts, "requests": requests_}

    ALLOWED_STATUS = {
        "pending_payment", "paid", "processing", "shipped",
        "out_for_delivery", "delivered", "cancelled", "refunded",
    }

    @admin_router.patch("/orders/{order_id}/status")
    async def admin_order_status(order_id: str, payload: AdminStatusUpdate, request: Request, admin: Dict[str, Any] = Depends(require_admin)):
        if payload.status not in ALLOWED_STATUS:
            raise HTTPException(status_code=400, detail="Invalid status")
        order = await db.orders.find_one({"id": order_id}, {"_id": 0})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        updates = {"status": payload.status, "updated_at": datetime.now(timezone.utc).isoformat()}
        if payload.status == "refunded":
            updates["refund_note"] = payload.note or ""
            updates["refunded_at"] = datetime.now(timezone.utc).isoformat()
        await db.orders.update_one({"id": order_id}, {"$set": updates})
        await audit(admin, request, "order.status", "order", order_id, {"from": order["status"], "to": payload.status, "note": payload.note})
        return {"success": True, "status": payload.status}

    @admin_router.patch("/orders/{order_id}/shipping")
    async def admin_order_shipping(order_id: str, payload: AdminShippingUpdate, request: Request, admin: Dict[str, Any] = Depends(require_admin)):
        order = await db.orders.find_one({"id": order_id}, {"_id": 0})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        tracking = {"awb": payload.awb, "carrier": payload.carrier, "url": payload.url or ""}
        new_status = "shipped" if order["status"] in ("processing", "paid") else order["status"]
        await db.orders.update_one({"id": order_id}, {"$set": {
            "tracking": tracking,
            "status": new_status,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }})
        await audit(admin, request, "order.shipping", "order", order_id, {"tracking": tracking, "note": payload.note})
        return {"success": True, "tracking": tracking, "status": new_status}

    # =======================================================
    # Products & variants
    # =======================================================
    @admin_router.get("/products")
    async def admin_products_list(q: Optional[str] = None, category: Optional[str] = None,
                                   include_inactive: bool = True,
                                   admin: Dict[str, Any] = Depends(require_admin)):
        query: Dict[str, Any] = {}
        if not include_inactive:
            query["is_active"] = True
        if category and category != "all":
            query["category"] = category
        if q:
            query["$or"] = [
                {"name": {"$regex": re.escape(q), "$options": "i"}},
                {"slug": {"$regex": re.escape(q), "$options": "i"}},
                {"tags": {"$regex": re.escape(q), "$options": "i"}},
            ]
        rows = await db.products.find(query, {"_id": 0}).to_list(500)
        # join variants
        slugs = [r["slug"] for r in rows]
        variants = await db.product_variants.find({"product_slug": {"$in": slugs}}, {"_id": 0}).to_list(2000)
        by_slug: Dict[str, List[Dict[str, Any]]] = {}
        for v in variants:
            by_slug.setdefault(v["product_slug"], []).append(v)
        for r in rows:
            r["variants"] = sorted(by_slug.get(r["slug"], []), key=lambda x: x.get("price", 0))
        rows.sort(key=lambda r: (not r.get("is_active"), -float(r.get("is_featured") or 0), r.get("name", "")))
        return {"products": rows, "count": len(rows)}

    @admin_router.get("/products/{product_id}")
    async def admin_product_detail(product_id: str, admin: Dict[str, Any] = Depends(require_admin)):
        p = await db.products.find_one({"$or": [{"id": product_id}, {"slug": product_id}]}, {"_id": 0})
        if not p:
            raise HTTPException(status_code=404, detail="Product not found")
        p["variants"] = await db.product_variants.find({"product_slug": p["slug"]}, {"_id": 0}).to_list(50)
        p["variants"].sort(key=lambda v: v.get("price", 0))
        return p

    @admin_router.post("/products")
    async def admin_product_create(payload: ProductIn, request: Request, admin: Dict[str, Any] = Depends(require_admin)):
        slug = slugify(payload.slug or payload.name)
        if await db.products.find_one({"slug": slug}):
            raise HTTPException(status_code=409, detail="A product with this slug already exists")
        doc = payload.model_dump(exclude={"variants"})
        doc.update({
            "id": str(uuid.uuid4()),
            "slug": slug,
            "avg_rating": 0,
            "review_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        await db.products.insert_one(doc)
        for v in payload.variants:
            await db.product_variants.insert_one({
                "id": str(uuid.uuid4()),
                "product_slug": slug,
                "size": v.size, "sku": v.sku,
                "price": v.price, "mrp": v.mrp, "stock": v.stock,
            })
        await audit(admin, request, "product.create", "product", doc["id"], {"slug": slug, "name": doc["name"]})
        doc.pop("_id", None)
        return {"success": True, "product": doc}

    @admin_router.patch("/products/{product_id}")
    async def admin_product_update(product_id: str, payload: Dict[str, Any], request: Request, admin: Dict[str, Any] = Depends(require_admin)):
        p = await db.products.find_one({"$or": [{"id": product_id}, {"slug": product_id}]}, {"_id": 0})
        if not p:
            raise HTTPException(status_code=404, detail="Product not found")
        payload.pop("slug", None)  # slug is immutable after create
        payload.pop("variants", None)
        payload.pop("_id", None)
        payload["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.products.update_one({"id": p["id"]}, {"$set": payload})
        await audit(admin, request, "product.update", "product", p["id"], {"fields": list(payload.keys())})
        return {"success": True}

    @admin_router.delete("/products/{product_id}")
    async def admin_product_delete(product_id: str, request: Request, admin: Dict[str, Any] = Depends(require_admin)):
        p = await db.products.find_one({"$or": [{"id": product_id}, {"slug": product_id}]}, {"_id": 0})
        if not p:
            raise HTTPException(status_code=404, detail="Product not found")
        # soft delete
        new_active = not p.get("is_active", True)
        await db.products.update_one({"id": p["id"]}, {"$set": {"is_active": new_active, "updated_at": datetime.now(timezone.utc).isoformat()}})
        await audit(admin, request, "product.soft_delete" if not new_active else "product.restore", "product", p["id"], {"is_active": new_active})
        return {"success": True, "is_active": new_active}

    @admin_router.post("/products/{product_id}/variants")
    async def admin_variant_create(product_id: str, payload: VariantIn, request: Request, admin: Dict[str, Any] = Depends(require_admin)):
        p = await db.products.find_one({"$or": [{"id": product_id}, {"slug": product_id}]}, {"_id": 0})
        if not p:
            raise HTTPException(status_code=404, detail="Product not found")
        doc = {"id": str(uuid.uuid4()), "product_slug": p["slug"], **payload.model_dump()}
        await db.product_variants.insert_one(doc)
        await audit(admin, request, "variant.create", "variant", doc["id"], {"product": p["slug"], "size": doc["size"]})
        doc.pop("_id", None)
        return {"success": True, "variant": doc}

    @admin_router.patch("/variants/{variant_id}")
    async def admin_variant_update(variant_id: str, payload: Dict[str, Any], request: Request, admin: Dict[str, Any] = Depends(require_admin)):
        v = await db.product_variants.find_one({"id": variant_id}, {"_id": 0})
        if not v:
            raise HTTPException(status_code=404, detail="Variant not found")
        payload.pop("id", None)
        payload.pop("product_slug", None)
        payload.pop("_id", None)
        await db.product_variants.update_one({"id": variant_id}, {"$set": payload})
        await audit(admin, request, "variant.update", "variant", variant_id, {"fields": list(payload.keys())})
        return {"success": True}

    @admin_router.delete("/variants/{variant_id}")
    async def admin_variant_delete(variant_id: str, request: Request, admin: Dict[str, Any] = Depends(require_admin)):
        res = await db.product_variants.delete_one({"id": variant_id})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Variant not found")
        await audit(admin, request, "variant.delete", "variant", variant_id, {})
        return {"success": True}

    # =======================================================
    # Inventory
    # =======================================================
    @admin_router.get("/inventory")
    async def admin_inventory(low_only: bool = False, q: Optional[str] = None, admin: Dict[str, Any] = Depends(require_admin)):
        query: Dict[str, Any] = {}
        if low_only:
            query["stock"] = {"$lte": 25}
        if q:
            query["$or"] = [
                {"sku": {"$regex": re.escape(q), "$options": "i"}},
                {"product_slug": {"$regex": re.escape(q), "$options": "i"}},
            ]
        variants = await db.product_variants.find(query, {"_id": 0}).to_list(1000)
        slugs = list({v["product_slug"] for v in variants})
        products = await db.products.find({"slug": {"$in": slugs}}, {"_id": 0, "slug": 1, "name": 1, "gallery": 1}).to_list(500)
        pmap = {p["slug"]: p for p in products}
        enriched = []
        for v in variants:
            p = pmap.get(v["product_slug"], {})
            enriched.append({**v, "product_name": p.get("name"), "product_image": (p.get("gallery") or [""])[0]})
        enriched.sort(key=lambda r: (r.get("stock", 0), r.get("product_name", "")))
        return {"variants": enriched, "count": len(enriched)}

    @admin_router.patch("/inventory/{variant_id}")
    async def admin_inventory_update(variant_id: str, payload: InventoryUpdate, request: Request, admin: Dict[str, Any] = Depends(require_admin)):
        v = await db.product_variants.find_one({"id": variant_id}, {"_id": 0})
        if not v:
            raise HTTPException(status_code=404, detail="Variant not found")
        old = v.get("stock", 0)
        change = payload.new_stock - old
        await db.product_variants.update_one({"id": variant_id}, {"$set": {"stock": payload.new_stock}})
        await db.inventory_logs.insert_one({
            "id": str(uuid.uuid4()),
            "variant_id": variant_id,
            "change": change,
            "new_stock": payload.new_stock,
            "reason": payload.reason,
            "note": payload.note or "",
            "admin_email": admin["email"],
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        await audit(admin, request, "inventory.update", "variant", variant_id, {"from": old, "to": payload.new_stock, "reason": payload.reason})
        return {"success": True, "stock": payload.new_stock, "change": change}

    @admin_router.get("/inventory/logs")
    async def admin_inventory_logs(variant_id: Optional[str] = None, reason: Optional[str] = None,
                                    from_date: Optional[str] = None, to_date: Optional[str] = None,
                                    admin: Dict[str, Any] = Depends(require_admin)):
        q: Dict[str, Any] = {}
        if variant_id:
            q["variant_id"] = variant_id
        if reason:
            q["reason"] = reason
        if from_date:
            q.setdefault("created_at", {})["$gte"] = from_date
        if to_date:
            q.setdefault("created_at", {})["$lte"] = to_date + "T23:59:59+00:00"
        rows = await db.inventory_logs.find(q, {"_id": 0}).sort("created_at", -1).to_list(2000)
        return {"logs": rows, "count": len(rows)}

    # =======================================================
    # Customers
    # =======================================================
    @admin_router.get("/customers")
    async def admin_customers(q: Optional[str] = None, page: int = 1, page_size: int = 50,
                               admin: Dict[str, Any] = Depends(require_admin)):
        query: Dict[str, Any] = {"role": {"$ne": "admin"}}
        if q:
            query["$or"] = [
                {"email": {"$regex": re.escape(q), "$options": "i"}},
                {"name": {"$regex": re.escape(q), "$options": "i"}},
            ]
        total = await db.users.count_documents(query)
        skip = max(0, (page - 1) * page_size)
        rows = await db.users.find(query, {"_id": 0, "password_hash": 0}).sort("created_at", -1).skip(skip).limit(page_size).to_list(page_size)
        user_ids = [r["id"] for r in rows]
        # order aggregates
        agg = await db.orders.aggregate([
            {"$match": {"user_id": {"$in": user_ids}, "status": {"$in": ["paid", "processing", "shipped", "delivered"]}}},
            {"$group": {"_id": "$user_id", "orders": {"$sum": 1}, "total": {"$sum": "$total"}, "last": {"$max": "$created_at"}}},
        ]).to_list(len(user_ids))
        agg_map = {a["_id"]: a for a in agg}
        for r in rows:
            a = agg_map.get(r["id"], {})
            r["orders_count"] = a.get("orders", 0)
            r["total_spent"] = round(a.get("total", 0), 2)
            r["last_order_at"] = a.get("last")
        return {"customers": rows, "total": total, "page": page, "page_size": page_size}

    @admin_router.get("/customers/export.csv")
    async def admin_customers_csv(admin: Dict[str, Any] = Depends(require_admin)):
        rows = await db.users.find({"role": {"$ne": "admin"}}, {"_id": 0, "password_hash": 0}).to_list(10000)
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerow(["name", "email", "role", "created_at"])
        for r in rows:
            w.writerow([r.get("name", ""), r.get("email", ""), r.get("role", ""), r.get("created_at", "")])
        return Response(content=buf.getvalue(), media_type="text/csv",
                        headers={"Content-Disposition": 'attachment; filename="customers.csv"'})

    @admin_router.get("/customers/{user_id}")
    async def admin_customer_detail(user_id: str, admin: Dict[str, Any] = Depends(require_admin)):
        u = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
        if not u:
            raise HTTPException(status_code=404, detail="Customer not found")
        orders = await db.orders.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
        reviews = await db.reviews.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
        wishlist = await db.wishlists.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
        return {"user": u, "orders": orders, "reviews": reviews, "wishlist": wishlist}

    # =======================================================
    # Reviews moderation
    # =======================================================
    async def _recompute_product_ratings(product_id: str):
        p = await db.products.find_one({"$or": [{"id": product_id}, {"slug": product_id}]}, {"_id": 0})
        if not p:
            return
        approved = await db.reviews.find(
            {"product_id": {"$in": [p.get("id"), p.get("slug")]}, "is_approved": True},
            {"_id": 0, "rating": 1},
        ).to_list(5000)
        count = len(approved)
        avg = round(sum(r["rating"] for r in approved) / count, 2) if count else 0
        await db.products.update_one({"slug": p["slug"]}, {"$set": {"avg_rating": avg, "review_count": count}})

    @admin_router.get("/reviews")
    async def admin_reviews(status: str = "pending", admin: Dict[str, Any] = Depends(require_admin)):
        if status == "pending":
            q = {"is_approved": False, "$or": [{"rejected": {"$exists": False}}, {"rejected": False}]}
        elif status == "approved":
            q = {"is_approved": True}
        elif status == "rejected":
            q = {"rejected": True}
        else:
            q = {}
        rows = await db.reviews.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
        return {"reviews": rows, "count": len(rows)}

    @admin_router.patch("/reviews/{review_id}")
    async def admin_review_action(review_id: str, payload: ReviewAction, request: Request, admin: Dict[str, Any] = Depends(require_admin)):
        r = await db.reviews.find_one({"id": review_id}, {"_id": 0})
        if not r:
            raise HTTPException(status_code=404, detail="Review not found")
        if payload.action == "approve":
            await db.reviews.update_one({"id": review_id}, {"$set": {"is_approved": True, "rejected": False, "reviewed_at": datetime.now(timezone.utc).isoformat()}})
        elif payload.action == "reject":
            await db.reviews.update_one({"id": review_id}, {"$set": {"is_approved": False, "rejected": True, "reject_reason": payload.reason or "", "reviewed_at": datetime.now(timezone.utc).isoformat()}})
        else:  # delete
            await db.reviews.delete_one({"id": review_id})
        await _recompute_product_ratings(r["product_id"])
        await audit(admin, request, f"review.{payload.action}", "review", review_id, {"reason": payload.reason})
        return {"success": True}

    # =======================================================
    # Coupons
    # =======================================================
    @admin_router.get("/coupons")
    async def admin_coupons_list(admin: Dict[str, Any] = Depends(require_admin)):
        rows = await db.coupons.find({}, {"_id": 0}).to_list(500)
        return {"coupons": rows, "count": len(rows)}

    @admin_router.post("/coupons")
    async def admin_coupon_create(payload: CouponIn, request: Request, admin: Dict[str, Any] = Depends(require_admin)):
        code = payload.code.strip().upper()
        if await db.coupons.find_one({"code": code}):
            raise HTTPException(status_code=409, detail="Coupon code already exists")
        doc = payload.model_dump()
        doc["code"] = code
        doc["used_count"] = 0
        doc["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.coupons.insert_one(doc)
        await audit(admin, request, "coupon.create", "coupon", code, {"type": doc["type"], "value": doc["value"]})
        doc.pop("_id", None)
        return {"success": True, "coupon": doc}

    @admin_router.patch("/coupons/{code}")
    async def admin_coupon_update(code: str, payload: Dict[str, Any], request: Request, admin: Dict[str, Any] = Depends(require_admin)):
        code = code.upper()
        c = await db.coupons.find_one({"code": code}, {"_id": 0})
        if not c:
            raise HTTPException(status_code=404, detail="Coupon not found")
        payload.pop("code", None)
        payload.pop("used_count", None)
        payload.pop("_id", None)
        await db.coupons.update_one({"code": code}, {"$set": payload})
        await audit(admin, request, "coupon.update", "coupon", code, {"fields": list(payload.keys())})
        return {"success": True}

    @admin_router.delete("/coupons/{code}")
    async def admin_coupon_delete(code: str, request: Request, admin: Dict[str, Any] = Depends(require_admin)):
        code = code.upper()
        res = await db.coupons.delete_one({"code": code})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Coupon not found")
        await audit(admin, request, "coupon.delete", "coupon", code, {})
        return {"success": True}

    @admin_router.get("/coupons/{code}/stats")
    async def admin_coupon_stats(code: str, admin: Dict[str, Any] = Depends(require_admin)):
        code = code.upper()
        c = await db.coupons.find_one({"code": code}, {"_id": 0})
        if not c:
            raise HTTPException(status_code=404, detail="Coupon not found")
        paid_statuses = ["paid", "processing", "shipped", "out_for_delivery", "delivered"]
        agg = await db.orders.aggregate([
            {"$match": {"coupon_code": code, "status": {"$in": paid_statuses}}},
            {"$group": {"_id": None, "uses": {"$sum": 1}, "discount_given": {"$sum": "$discount_amount"}, "last": {"$max": "$created_at"}}},
        ]).to_list(1)
        stats = agg[0] if agg else {"uses": 0, "discount_given": 0, "last": None}
        return {"coupon": c, "stats": {
            "uses": stats.get("uses", 0),
            "discount_given": round(stats.get("discount_given", 0) or 0, 2),
            "last_used_at": stats.get("last"),
        }}

    # =======================================================
    # Newsletter / Requests / Contact / Settings / Audit
    # =======================================================
    @admin_router.get("/newsletter")
    async def admin_newsletter(q: Optional[str] = None, admin: Dict[str, Any] = Depends(require_admin)):
        query: Dict[str, Any] = {}
        if q:
            query["email"] = {"$regex": re.escape(q), "$options": "i"}
        rows = await db.newsletter_subscribers.find(query, {"_id": 0}).sort("subscribed_at", -1).to_list(10000)
        return {"subscribers": rows, "count": len(rows)}

    @admin_router.get("/newsletter/export.csv")
    async def admin_newsletter_csv(admin: Dict[str, Any] = Depends(require_admin)):
        rows = await db.newsletter_subscribers.find({}, {"_id": 0}).to_list(10000)
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerow(["email", "source", "subscribed_at"])
        for r in rows:
            w.writerow([r.get("email", ""), r.get("source", ""), r.get("subscribed_at", "")])
        return Response(content=buf.getvalue(), media_type="text/csv",
                        headers={"Content-Disposition": 'attachment; filename="newsletter.csv"'})

    @admin_router.get("/requests")
    async def admin_requests(status: Optional[str] = None, admin: Dict[str, Any] = Depends(require_admin)):
        q = {"status": status} if status and status != "all" else {}
        rows = await db.order_requests.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)
        return {"requests": rows, "count": len(rows)}

    @admin_router.patch("/requests/{request_id}")
    async def admin_request_update(request_id: str, payload: RequestStatusUpdate, request: Request, admin: Dict[str, Any] = Depends(require_admin)):
        r = await db.order_requests.find_one({"id": request_id}, {"_id": 0})
        if not r:
            raise HTTPException(status_code=404, detail="Request not found")
        await db.order_requests.update_one({"id": request_id}, {"$set": {
            "status": payload.status,
            "admin_note": payload.admin_note or "",
            "resolved_at": datetime.now(timezone.utc).isoformat(),
        }})
        await audit(admin, request, "request.update", "order_request", request_id, {"status": payload.status})
        return {"success": True}

    @admin_router.get("/contact")
    async def admin_contact(status: Optional[str] = None, admin: Dict[str, Any] = Depends(require_admin)):
        q = {"status": status} if status and status != "all" else {}
        rows = await db.contact_messages.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)
        return {"messages": rows, "count": len(rows)}

    @admin_router.patch("/contact/{msg_id}")
    async def admin_contact_update(msg_id: str, payload: ContactRead, request: Request, admin: Dict[str, Any] = Depends(require_admin)):
        r = await db.contact_messages.find_one({"id": msg_id}, {"_id": 0})
        if not r:
            raise HTTPException(status_code=404, detail="Message not found")
        await db.contact_messages.update_one({"id": msg_id}, {"$set": {"status": payload.status}})
        await audit(admin, request, "contact.update", "contact_message", msg_id, {"status": payload.status})
        return {"success": True}

    @admin_router.get("/settings")
    async def admin_settings_get(admin: Dict[str, Any] = Depends(require_admin)):
        doc = await db.site_settings.find_one({"_singleton": True}, {"_id": 0}) or {}
        return doc

    @admin_router.patch("/settings")
    async def admin_settings_patch(payload: SettingsPatch, request: Request, admin: Dict[str, Any] = Depends(require_admin)):
        updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
        if not updates:
            return {"success": True}
        await db.site_settings.update_one({"_singleton": True}, {"$set": updates}, upsert=True)
        await audit(admin, request, "settings.update", "settings", "singleton", {"fields": list(updates.keys())})
        return {"success": True}

    @admin_router.get("/audit")
    async def admin_audit_list(
        action: Optional[str] = None,
        admin_email: Optional[str] = None,
        target_type: Optional[str] = None,
        page: int = 1, page_size: int = 100,
        admin: Dict[str, Any] = Depends(require_admin),
    ):
        q: Dict[str, Any] = {}
        if action:
            q["action"] = {"$regex": re.escape(action), "$options": "i"}
        if admin_email:
            q["admin_email"] = admin_email
        if target_type:
            q["target_type"] = target_type
        total = await db.admin_audit_logs.count_documents(q)
        rows = await db.admin_audit_logs.find(q, {"_id": 0}).sort("created_at", -1).skip(max(0, (page - 1) * page_size)).limit(min(500, page_size)).to_list(page_size)
        return {"logs": rows, "total": total}

    # =======================================================
    # Refund (real Razorpay)
    # =======================================================
    @admin_router.post("/orders/{order_id}/refund")
    async def admin_order_refund(order_id: str, payload: Dict[str, Any], request: Request, admin: Dict[str, Any] = Depends(require_admin)):
        from server import razorpay_client  # lazy import to avoid cycle
        order = await db.orders.find_one({"id": order_id}, {"_id": 0})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        if not order.get("razorpay_payment_id"):
            raise HTTPException(status_code=400, detail="Order has no captured payment to refund")
        if order["status"] not in ("paid", "processing", "shipped", "out_for_delivery", "delivered"):
            raise HTTPException(status_code=400, detail=f"Cannot refund in '{order['status']}' state")

        order_total_paise = int(round(order["total"] * 100))
        amount_paise = int(payload.get("amount_paise") or order_total_paise)
        if amount_paise <= 0 or amount_paise > order_total_paise:
            raise HTTPException(status_code=400, detail="Invalid refund amount")
        is_full = amount_paise == order_total_paise

        rz_kwargs: Dict[str, Any] = {"amount": amount_paise, "speed": payload.get("speed") or "normal"}
        if payload.get("reason"):
            rz_kwargs["notes"] = {"reason": payload["reason"], "admin": admin["email"], **(payload.get("notes") or {})}

        try:
            rz_refund = razorpay_client.payment.refund(order["razorpay_payment_id"], rz_kwargs)
        except Exception as e:
            # Still record the failed attempt
            await db.refunds.insert_one({
                "id": str(uuid.uuid4()), "order_id": order_id,
                "razorpay_payment_id": order["razorpay_payment_id"],
                "razorpay_refund_id": None, "amount_paise": amount_paise,
                "status": "failed", "reason": payload.get("reason"),
                "admin_user_id": admin["id"], "error": str(e),
                "raw_response": None, "created_at": datetime.now(timezone.utc).isoformat(),
            })
            await audit(admin, request, "order.refund.failed", "order", order_id, {"amount_paise": amount_paise, "error": str(e)})
            raise HTTPException(status_code=502, detail=f"Razorpay refund failed: {e}")

        await db.refunds.insert_one({
            "id": str(uuid.uuid4()), "order_id": order_id,
            "razorpay_payment_id": order["razorpay_payment_id"],
            "razorpay_refund_id": rz_refund.get("id"),
            "amount_paise": amount_paise,
            "status": "processed",
            "reason": payload.get("reason"),
            "admin_user_id": admin["id"],
            "raw_response": rz_refund,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        new_status = "refunded" if is_full else "partial_refund"
        await db.orders.update_one({"id": order_id}, {"$set": {
            "status": new_status,
            "refunded_amount_paise": (order.get("refunded_amount_paise") or 0) + amount_paise,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }})
        await audit(admin, request, "order.refund", "order", order_id, {"amount_paise": amount_paise, "refund_id": rz_refund.get("id"), "full": is_full})
        return {"success": True, "refund": {"id": rz_refund.get("id"), "amount_paise": amount_paise, "status": rz_refund.get("status", "processed")}, "order_status": new_status}

    @admin_router.get("/refunds")
    async def admin_refunds(order_id: Optional[str] = None, admin: Dict[str, Any] = Depends(require_admin)):
        q = {"order_id": order_id} if order_id else {}
        rows = await db.refunds.find(q, {"_id": 0, "raw_response": 0}).sort("created_at", -1).to_list(500)
        return {"refunds": rows, "count": len(rows)}

    # =======================================================
    # Wire
    # =======================================================
    return admin_router
