from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from API.Version_1.router import router as v1_router

app = FastAPI(title="UCAI Local LLM Server")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(v1_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "UCAI Local LLM Server Running"}
