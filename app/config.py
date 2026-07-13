from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

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


settings = Settings()
