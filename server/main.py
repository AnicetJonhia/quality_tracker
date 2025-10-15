import models
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from db.base import Base
from db.session import engine
from api.v1 import auth, user, nce, notification, delivery, project, survey, core, file



Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

app.add_middleware(
    CORSMiddleware,
    #allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def include_routers_with_prefix(app: FastAPI, routers: list, prefix: str = "/api"):
    for router in routers:
        app.include_router(router, prefix=prefix)

routers = [
    auth.router,
    user.router,
    nce.router,
    notification.router,
    delivery.router,
    project.router,
    survey.router,
    core.router,
    file.router
]

include_routers_with_prefix(app, routers)


@app.get("/")
def read_root():
    return {"message": "QualityTracker API", "version": "1.0.0", "documentation:": "/docs"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)
