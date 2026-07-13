# Member B — eKYC / AML Service

Covers: Setu DigiLocker integration, AML/sanctions screening, database, cross-check logic,
orchestrator status endpoint. Runs as its own FastAPI service on port 8000.

---

## 1. File structure

```
member-b-ekyc-aml/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, wires everything together
│   ├── config.py            # reads .env
│   ├── database.py          # SQLAlchemy engine/session
│   ├── models.py            # DB tables: User, DigilockerRequest, Document, AMLResult, VerificationStatus
│   ├── schemas.py           # Pydantic request/response shapes
│   ├── digilocker.py        # Setu DigiLocker API client
│   ├── pan.py                # Setu PAN verification API client
│   ├── face_match.py         # OpenCV quality checks + DeepFace(ArcFace) selfie-vs-Aadhaar-photo match
│   ├── decisioning.py        # Combines cross-check + face-match + AML into one final_status
│   ├── aml.py                # OpenSanctions loader + RapidFuzz matching
│   └── routers/
│       ├── __init__.py
│       ├── users.py         # POST /users/  -> start a session
│       ├── ekyc.py          # DigiLocker init/status/fetch + cross-check (Aadhaar name vs PAN name)
│       ├── pan.py           # POST /pan/verify
│       ├── face.py          # POST /face/match
│       ├── aml.py           # POST /aml/screen
│       └── status.py        # GET /status/{user_id}, GET /status/
├── data/
│   └── sanctions.csv        # <- you put the downloaded OpenSanctions file here
├── requirements.txt
├── .env.example
└── README.md
```

---

## 2. Setup steps

```bash
cd member-b-ekyc-aml
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# now edit .env and fill in the Setu sandbox credentials (see step 3)
```

**Heads up on install size/time**: `deepface` pulls in `tensorflow` as a dependency, which is a
large download (~500MB+) and can take several minutes on a slow connection. Budget time for this
on Day 1, don't leave it for Day 3. First time you actually call `/face/match`, DeepFace also
downloads the ArcFace model weights (~100MB) and caches them in `~/.deepface/weights` — that
first call will be slow (10-30s), every call after is fast.

**Known gotcha**: `opencv-python` version 5.x removed/changed the classic `cv2.CascadeClassifier`
API used for face detection in `face_match.py`. `requirements.txt` pins `opencv-python==4.10.0.84`
specifically for this reason — don't let pip auto-upgrade it.

---

## 3. Setu sandbox credentials

**Already filled into `.env.example`** for this team's "tech knights" sandbox account:
- `SETU_CLIENT_ID` / `SETU_CLIENT_SECRET` — shared across all products under one KYC account
- `SETU_DIGILOCKER_PRODUCT_ID` — from the DigiLocker product's dashboard page
- `SETU_PAN_PRODUCT_ID` — from the PAN product's dashboard page

Each Setu product (DigiLocker, PAN) has its **own product-instance-id**, but shares the same
client-id/secret — that's why config.py has two separate product-id fields instead of one.

**`SETU_REDIRECT_URL` must be a publicly reachable URL** — DigiLocker redirects the user's
browser here after they grant consent. For local dev, run `ngrok http 5173` (assuming
Member C's React app runs on port 5173) and put the ngrok URL + `/digilocker/callback` here.
Update it in `.env` before demo day, since ngrok URLs change every restart on the free tier.

### PAN sandbox test values (no real PAN needed for demo)
- `ABCDE1234A` → returns a valid PAN response (John Doe)
- `ABCDE1234B` → returns "found but invalid" response
- Any other value → 404 PAN not found

---

## 4. Get real AML/sanctions data (OpenSanctions)

1. Go to https://www.opensanctions.org/datasets/ and open the **"default"** consolidated dataset
2. Download the **simple CSV / "targets.simple.csv"** export (free, no signup required for this format)
3. Save it as `data/sanctions.csv` in this project
4. If the column names in the file you download don't match `name` / `topics` / `datasets`,
   open `app/aml.py` and adjust the `COLUMN_MAP` dict at the top to match — that's the only
   place you'd need to touch
5. Until you've downloaded the real file, `app/aml.py` automatically falls back to a tiny
   3-name sample list so the rest of the team isn't blocked — you'll see a `source: "sample-fallback"`
   in results, which tells you it's not using the real dataset yet

---

## 5. Run it

```bash
uvicorn app.main:app --reload --port 8000
```

- API docs (Swagger, auto-generated): http://localhost:8000/docs
- Health check: http://localhost:8000/health

Use `/docs` to manually test every endpoint below without needing the frontend at all —
useful for demoing your part independently before Member C wires it up.

---

## 6. API endpoints (this is the contract Member C's frontend calls)

| Method | Path | Purpose |
|---|---|---|
| POST | `/users/` | Start a new onboarding session, returns `user_id` |
| POST | `/ekyc/digilocker/init/{user_id}` | Creates Setu request, returns `redirect_url` to send user's browser to |
| GET | `/ekyc/digilocker/status/{request_id}` | Poll until `consent_status == "authenticated"` |
| POST | `/ekyc/digilocker/fetch-aadhaar/{request_id}` | Pulls real Aadhaar data (name/DOB/address/photo) once authenticated |
| POST | `/ekyc/cross-check` | Compares Member A's OCR name vs DigiLocker name |
| POST | `/pan/verify` | Verifies a PAN number via Setu/NSDL, returns full_name/category |
| POST | `/face/match` | Compares live selfie against the Aadhaar photo (from DigiLocker), not any uploaded doc |
| POST | `/aml/screen` | Screens a name against sanctions/PEP data |
| GET | `/status/{user_id}` | Current orchestrator state + final verdict |
| GET | `/status/` | List of all demo users (for Admin Overview screen) |

---

## 7. Final status decisioning (combined, order-independent)

`final_status` is no longer AML-only — it's computed from all three checks together by
`app/decisioning.py`, called after each check updates its own field, so it works correctly
regardless of which check finishes first:

| Condition | Result |
|---|---|
| Aadhaar name vs PAN name mismatch | `flagged` immediately, even if other checks haven't run |
| Selfie doesn't match Aadhaar photo | `flagged` immediately, even if other checks haven't run |
| Cross-check + face-match both pass, AML hits a sanctions/PEP entry | `pending` — needs human review, not auto-rejected (matches how PEP/adverse-media hits are meant to be handled — see AML row) |
| All three checks pass clean | `verified` |
| Not all three checks have run yet | `final_status` stays `null`, `state` reflects progress (e.g. `"aml_checked"`) |

Tested with 7 scenarios including order-independence (AML running before the identity checks
finish) — all pass.

## 8. Actual flow (updated — no OCR/document-upload involved)

Your team's real flow is number+OTP based, not photo-upload based:

1. **Member C** frontend calls `POST /users/` on Screen 1 → gets `user_id`
2. User enters Aadhaar number → `POST /ekyc/digilocker/init/{user_id}` → redirect to Setu/DigiLocker → OTP → `GET /ekyc/digilocker/status/{request_id}` polled until `authenticated` → `POST /ekyc/digilocker/fetch-aadhaar/{request_id}` pulls real name/DOB/address/**photo**
3. User enters PAN number → `POST /pan/verify` → returns verified name from NSDL
4. `POST /ekyc/cross-check` compares the Aadhaar name against the PAN name (no OCR involved at all — both names come from government-backed APIs directly)
5. User takes a live selfie → `POST /face/match` compares it against the **Aadhaar photo fetched in step 2** (never against an uploaded PAN/Aadhaar card image)
6. `POST /aml/screen` runs in parallel/after, screening the verified name
7. `GET /status/{user_id}` gives the combined final state

**Member A's OCR/OpenCV module is not part of this flow** — it would only be needed as a fallback
for users without OTP-linked Aadhaar mobiles, or for passport-based users. Confirm with your team
whether that fallback path is in scope before building it.

---

## 9. Quick manual test flow (no frontend needed)

```bash
# 1. create a user
curl -X POST http://localhost:8000/users/

# 2. start digilocker flow (copy the redirect_url and open it in a browser, enter Aadhaar+OTP)
curl -X POST http://localhost:8000/ekyc/digilocker/init/<user_id>

# 3. after granting consent in the browser, poll status
curl http://localhost:8000/ekyc/digilocker/status/<request_id>

# 4. once authenticated, fetch aadhaar data (name, DOB, address, photo)
curl -X POST http://localhost:8000/ekyc/digilocker/fetch-aadhaar/<request_id>

# 5. verify PAN (use ABCDE1234A for a valid sandbox test PAN)
curl -X POST http://localhost:8000/pan/verify \
  -H "Content-Type: application/json" \
  -d '{"user_id": "<user_id>", "pan": "ABCDE1234A"}'

# 6. cross-check Aadhaar name vs PAN name
curl -X POST http://localhost:8000/ekyc/cross-check \
  -H "Content-Type: application/json" \
  -d '{"user_id": "<user_id>"}'

# 7. face match -- selfie_base64 should be a real base64-encoded JPEG/PNG of a face
curl -X POST http://localhost:8000/face/match \
  -H "Content-Type: application/json" \
  -d '{"user_id": "<user_id>", "selfie_base64": "<base64 string here>"}'

# 8. run AML screening
curl -X POST http://localhost:8000/aml/screen \
  -H "Content-Type: application/json" \
  -d '{"user_id": "<user_id>", "name": "Jack Doe"}'

# 9. check final status
curl http://localhost:8000/status/<user_id>
```

---

## 10. Known things to fix before demo day

- [ ] Confirm real Setu sandbox credentials work (test with a real sandbox Aadhaar test number if Setu provides one)
- [ ] Download the real OpenSanctions CSV, confirm `COLUMN_MAP` matches
- [ ] Set the real ngrok URL in `SETU_REDIRECT_URL` the morning of the demo (it changes on restart)
- [ ] Tighten CORS `allow_origins` from `"*"` to Member C's actual dev URL if time permits
