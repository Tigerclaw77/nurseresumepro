from __future__ import annotations
import os, requests
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SERVICE_KEY  = os.environ["SUPABASE_SERVICE_KEY"]
RPC_URL = f"{SUPABASE_URL}/rest/v1/rpc/log_lead"
HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
}

router = APIRouter(prefix="/api", tags=["leads"])

class LeadIn(BaseModel):
    email: EmailStr
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    zip: Optional[str] = ""
    product_type: str  # "resume" | "cover"
    ats_score: Optional[float] = None
    consent_scopes: List[str] = ["service"]
    consent_version: Optional[str] = "pp-v1.0"
    gpc: Optional[bool] = False
    utm: Dict[str, Any] = {}
    referrer: Optional[str] = ""
    ip_trunc: Optional[str] = ""
    ua: Optional[str] = ""

class LeadOut(BaseModel):
    ok: bool
    id: str

@router.post("/lead", response_model=LeadOut)
async def post_lead(req: Request, body: LeadIn):
    payload = {
        "p_email": body.email.lower(),
        "p_first_name": body.first_name or "",
        "p_last_name": body.last_name or "",
        "p_city": body.city or "",
        "p_state": body.state or "",
        "p_zip": body.zip or "",
        "p_product_type": body.product_type,
        "p_ats_score": body.ats_score,
        "p_consent_scopes": body.consent_scopes or ["service"],
        "p_consent_version": body.consent_version or "pp-v1.0",
        "p_gpc": bool(body.gpc),
        "p_utm": body.utm or {},
        "p_referrer": body.referrer or "",
        "p_ip_trunc": body.ip_trunc or (req.client.host if req.client else ""),
        "p_ua": body.ua or req.headers.get("user-agent", "")[:200],
    }
    try:
        r = requests.post(RPC_URL, headers=HEADERS, json=payload, timeout=10)
        r.raise_for_status()
        lead_id = r.json()  # UUID from function
        return LeadOut(ok=True, id=str(lead_id))
    except requests.HTTPError as e:
        # surface brief details; don’t leak PII
        raise HTTPException(status_code=502, detail=f"lead write failed: {e.response.status_code}")
    except Exception:
        raise HTTPException(status_code=500, detail="lead write failed")
