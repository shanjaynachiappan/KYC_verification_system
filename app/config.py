from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    pep_csv_path: str = "./data/pep_list.csv"
    pep_match_threshold: int = 85
    adverse_media_json_path: str = "./data/adverse_media.json"
    adverse_media_match_threshold: int = 80
    # Setu -- shared across all products under one KYC account
    setu_client_id: str = "changeme"
    setu_client_secret: str = "changeme"
    setu_base_url: str = "https://dg-sandbox.setu.co"

    # Each Setu product has its own product-instance-id (shown on its dashboard page)
    setu_digilocker_product_id: str = "changeme"
    setu_pan_product_id: str = "changeme"

    setu_redirect_url: str = "http://localhost:5173/digilocker/callback"

    # Database
    database_url: str = "sqlite:///./kyc_demo.db"

    # AML
    opensanctions_csv_path: str = "./data/sanctions.csv"
    aml_match_threshold: int = 85
        # Daily.co video (agent-led KYC)
    daily_api_key: str = "changeme"
    daily_api_base_url: str = "https://api.daily.co/v1"

    # Agent-led KYC borderline thresholds
    face_match_confident_pct: float = 85.0
    face_match_reject_pct: float = 40.0
    deepfake_confident_pct: float = 85.0


settings = Settings()
