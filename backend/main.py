# backend/main.py
from fastapi import FastAPI
from leads_router import router as leads_router

app = FastAPI()
app.include_router(leads_router)
