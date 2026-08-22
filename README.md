# Member B — eKYC / AML / Agent-Led KYC Service

Covers: Setu DigiLocker integration, AML/compliance screening (sanctions, PEP, adverse media,
source of funds), face-match + deepfake screening, agent-led KYC for borderline cases (live chat
+ video), database, cross-check logic, orchestrator status endpoint. Runs as its own FastAPI
service on port 8000.

---

## 1. File structure

```
member-b-ekyc-aml/
├── app/
│   ├── __init__.py
│   ├── main.py                # FastAPI app, wires everything together
│   ├── config.py               # reads .env
│   ├── database.py             # SQLAlchemy engine/session
│   ├── models.py                # DB tables: User, DigilockerRequest, Document, AMLResult,
│   │                             # VerificationStatus, AgentSession, AgentChatMessage
│   ├── schemas.py                # Pydantic request/response shapes (core eKYC + face + AML)
│   ├── schemas_agent.py          # Pydantic shapes for the agent-led KYC flow
│   ├── digilocker.py             # Setu DigiLocker API client
│   ├── pan.py                     # Setu PAN verification API client
│   ├── face_match.py              # OpenCV quality checks + DeepFace(ArcFace) selfie-vs-Aadhaar match
│   ├── decisioning.py             # Combines cross-check + face-match + AML into one final_status
│   ├── aml.py                     # Sanctions loader + RapidFuzz matching
│   ├── pep.py                     # PEP (Politically Exposed Person) screening — synthetic dataset
│   ├── adverse_media.py           # Adverse media / negative-news screening — synthetic dataset
│   ├── sof.py                     # Source of Funds risk scoring from applicant's own declaration
│   ├── ws_manager.py              # In-memory WebSocket room manager for agent-led KYC chat
│   ├── video.py                   # Daily.co REST wrapper — creates the video room per agent session
│   └── routers/
│       ├── __init__.py
│       ├── users.py            # POST /users/  -> start a session
│       ├── ekyc.py             # DigiLocker init/status/fetch + cross-check (Aadhaar name vs PAN name)
│       ├── pan.py               # POST /pan/verify
│       ├── face.py              # POST /face/match  (includes borderline-score → review_required)
│       ├── deepfake.py           # POST /deepfake/image
│       ├── aml.py                 # POST /aml/screen  (sanctions + PEP + adverse media + SOF)
│       ├── agent.py               # Agent-led KYC session lifecycle + live chat WebSocket
│       └── status.py               # GET /status/{user_id}, GET /status/
├── data/
│   ├── sanctions.csv           # synthetic demo sanctions list (swap for a real OpenSanctions export)
│   ├── pep_list.csv             # synthetic demo PEP dataset
│   └── adverse_media.json        # synthetic demo adverse-media dataset
├── requirements.txt
├── .env.example
└── README.md
```

Frontend-side additions (in `frontend_ans/src/`): `pages/AmlCheckPage.jsx`,
`pages/AgentKycPage.jsx`, `pages/AgentConsolePage.jsx`, `components/VideoCallFrame.jsx`,
`styles/aml-check.css`, `styles/agent-kyc.css`.

---

## 2. Setup steps

```bash
cd member-b-ekyc-aml
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# now edit .env and fill in:
#   - Setu sandbox credentials (see step 3)
#   - DAILY_API_KEY (see step 5 — video calls for agent-led KYC)
```

Frontend also needs the Daily.co video SDK:

```bash
cd frontend_ans
npm install @daily-co/daily-js
npm install
```

**Heads up on install size/time**: `deepface` pulls in `tensorflow` as a dependency, which is a
large download (~500MB+) and can take several minutes on a slow connection. Budget time for this
on Day 1, don't leave it for Day 3. First time you actually call `/face/match`, DeepFace also
downloads the ArcFace model weights (~100MB) and caches them in `~/.deepface/weights` — that
first call will be slow (10-30s), every call after is fast.

**Known gotcha**: `opencv-python` version 5.x removed/changed the classic `cv2.CascadeClassifier`
API used for face detection in `face_match.py`. `requirements.txt` pins `opencv-python==4.10.0.84`
specifically for this reason — don't let pip auto-upgrade it.

**After pulling schema changes** (new `AgentSession`/`AgentChatMessage` tables, new columns on
`AMLResult`/`VerificationStatus`): delete `kyc_demo.db` and restart uvicorn so it regenerates with
the new schema — `Base.metadata.create_all()` only creates missing tables, it doesn't alter
existing ones.

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

## 4. AML / compliance screening — sanctions, PEP, adverse media, source of funds

`POST /aml/screen` runs after liveness/face-match and covers four checks in one call:

| Check | What it does | Data source |
|---|---|---|
| **Sanctions** | Fuzzy-matches the verified name against a watchlist (RapidFuzz `token_sort_ratio`) | `data/sanctions.csv` — **synthetic**, swap for a real OpenSanctions export |
| **PEP** | Checks if the name matches a politically exposed person or close associate | `data/pep_list.csv` — **synthetic**, swap for a real PEP data provider |
| **Adverse media** | Checks the name against negative-news categories (fraud, money laundering, corruption, etc.) | `data/adverse_media.json` — **synthetic**, swap for a real news/media API |
| **Source of Funds (SOF)** | Applicant declares an income band + source of funds on the AML check screen; scored by a rule-based model in `app/sof.py` | Real applicant input — not simulated |

**None of the sanctions/PEP/adverse-media names are real people or real news stories** — they exist
purely so the matching engine (which mirrors how production tools like OpenSanctions/ComplyAdvantage
work) has something to run against. Swap the three data files for real provider feeds before any
production use — the matching code itself doesn't need to change.

Any single hit (sanctions/PEP/adverse-media match, or SOF risk = high) routes the applicant's
`final_status` to `pending` rather than an outright reject — matching real-world Enhanced Due
Diligence (EDD) practice, where only a hard sanctions match is close to an automatic block.

### Getting a real sanctions dataset (optional upgrade)
1. Go to https://www.opensanctions.org/datasets/ and open the **"default"** consolidated dataset
2. Download the **simple CSV / "targets.simple.csv"** export (free, no signup required)
3. Save it as `data/sanctions.csv`, replacing the synthetic version
4. If column names don't match what `app/aml.py` expects, adjust its `COLUMN_MAP` dict

---

## 5. Agent-led KYC — borderline face/liveness scores

Face-match and deepfake/liveness checks aren't just pass/fail — they carry a confidence score.
`/face/match` computes a `review_required` flag from two signals:

| Signal | Confident pass | Confident fail | Borderline |
|---|---|---|---|
| Face similarity (DeepFace/ArcFace) | ≥ 85% | < 40% | in between |
| Deepfake/liveness confidence | ≥ 85% (either label) | — | < 85% |

- **Confidently failing** → unchanged hard reject (retake selfie)
- **Confidently passing both** → unchanged auto-pass, straight to Final Review
- **Borderline** → `review_required = true` → after the AML check, the applicant is routed to
  `/verify/agent-kyc` instead of Final Review, for live human review

### How the live review works
1. Applicant lands on the Agent-Led KYC screen → `POST /agent/sessions` creates a session
   (`waiting`) and a Daily.co video room
2. A human agent, on a separate `/agent/console` screen, sees it in the waiting queue and claims it
   (`in_progress`) — this joins them into the same video room
3. Both sides get a live **video call** (via Daily.co's embeddable call UI) plus a **text chat**
   over WebSocket (`/agent/ws/{session_id}/{role}`) — every chat message is persisted
   (`AgentChatMessage`) as part of the audit trail
4. The agent submits **Approve** or **Reject** (`POST /agent/sessions/{id}/decision`) — this sets
   the session to `completed` and updates the applicant's `VerificationStatus.final_status`
   directly
5. The applicant's screen picks up the decision (WebSocket + a 4s poll as a fallback) and unlocks
   "Continue to Final Review"

### Setting up video (Daily.co)
1. Sign up free at https://dashboard.daily.co/ (no card required)
2. Get an API key at https://dashboard.daily.co/developers
3. Set `DAILY_API_KEY` in `.env`

If `DAILY_API_KEY` is left unset, `app/video.py` fails soft — the chat-only flow still works, the
video panel just shows a "not configured" placeholder instead of erroring out.

**Known limitation — no agent authentication.** `/agent/console` has no login; anyone with the URL
can act as an agent. Fine for a demo (open it in a second tab to play both roles), but this needs
real agent auth (separate login, role check, IP allowlist) before any production deployment.

---

## 6. Run it

```bash
uvicorn app.main:app --reload --port 8000
```

- API docs (Swagger, auto-generated): http://localhost:8000/docs
- Health check: http://localhost:8000/health
- Agent console (open in a second browser tab during a demo): http://localhost:5173/agent/console

Use `/docs` to manually test every endpoint below without needing the frontend at all —
useful for demoing your part independently before Member C wires it up.

---

## 7. API endpoints (this is the contract Member C's frontend calls)

| Method | Path | Purpose |
|---|---|---|
| POST | `/users/` | Start a new onboarding session, returns `user_id` |
| POST | `/ekyc/digilocker/init/{user_id}` | Creates Setu request, returns `redirect_url` to send user's browser to |
| GET | `/ekyc/digilocker/status/{request_id}` | Poll until `consent_status == "authenticated"` |
| POST | `/ekyc/digilocker/fetch-aadhaar/{request_id}` | Pulls real Aadhaar data (name/DOB/address/photo) once authenticated |
| POST | `/ekyc/cross-check` | Compares Member A's OCR name vs DigiLocker name |
| POST | `/pan/verify` | Verifies a PAN number via Setu/NSDL, returns full_name/category |
| POST | `/deepfake/image` | Checks selfie for AI-generated/manipulated content |
| POST | `/face/match` | Compares live selfie against the Aadhaar photo; returns `review_required` for borderline scores |
| POST | `/aml/screen` | Sanctions + PEP + adverse media + source-of-funds screening in one call |
| POST | `/agent/sessions` | Creates (or resumes) an agent-led KYC session + video room |
| GET | `/agent/sessions?status_filter=waiting` | Agent console's queue |
| GET | `/agent/sessions/{session_id}` | Poll a session's current status/decision |
| POST | `/agent/sessions/{session_id}/claim` | Agent claims a waiting session |
| POST | `/agent/sessions/{session_id}/decision` | Agent submits approve/reject + notes |
| GET | `/agent/sessions/{session_id}/messages` | Chat history for a session |
| WS | `/agent/ws/{session_id}/{role}` | Live chat channel — `role` is `applicant` or `agent` |
| GET | `/status/{user_id}` | Current orchestrator state + final verdict |
| GET | `/status/` | List of all demo users (for Admin Overview screen) |

---

## 8. Final status decisioning (combined, order-independent)

`final_status` is computed from all checks together by `app/decisioning.py`, called after each
check updates its own field, so it works correctly regardless of which check finishes first:

| Condition | Result |
|---|---|
| Aadhaar name vs PAN name mismatch | `flagged` immediately, even if other checks haven't run |
| Selfie doesn't match Aadhaar photo (confidently) | `flagged` immediately |
| Face/liveness score borderline | routed to agent-led KYC after AML — `final_status` set by the agent's decision (`verified`/`flagged`) |
| Cross-check + face-match pass, AML hits sanctions/PEP/adverse-media, or SOF risk = high | `pending` — needs human review, not auto-rejected |
| All checks pass clean, no borderline score | `verified` |
| Not all checks have run yet | `final_status` stays `null`, `state` reflects progress (e.g. `"aml_checked"`, `"agent_reviewed"`) |

---

## 9. Actual flow

1. **Member C** frontend calls `POST /users/` on Screen 1 → gets `user_id`
2. User enters Aadhaar number → `POST /ekyc/digilocker/init/{user_id}` → redirect to Setu/DigiLocker → OTP → `GET /ekyc/digilocker/status/{request_id}` polled until `authenticated` → `POST /ekyc/digilocker/fetch-aadhaar/{request_id}` pulls real name/DOB/address/**photo**
3. User enters PAN number → `POST /pan/verify` → returns verified name from NSDL
4. `POST /ekyc/cross-check` compares the Aadhaar name against the PAN name
5. User takes a live selfie → `POST /deepfake/image` checks authenticity → `POST /face/match` compares it against the **Aadhaar photo fetched in step 2**, returns `review_required` for borderline scores
6. `POST /aml/screen` — sanctions, PEP, adverse media, and declared source-of-funds
7. **If `review_required` was true**: applicant is connected to a live agent (`/agent/sessions` → video + chat) for manual approve/reject
8. `GET /status/{user_id}` gives the combined final state

**Member A's OCR/OpenCV module is not part of this flow** — it would only be needed as a fallback
for users without OTP-linked Aadhaar mobiles, or for passport-based users. Confirm with your team
whether that fallback path is in scope before building it.

---

## 10. Quick manual test flow (no frontend needed)

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

# 8. run AML + compliance screening
curl -X POST http://localhost:8000/aml/screen \
  -H "Content-Type: application/json" \
  -d '{"user_id": "<user_id>", "name": "Jack Doe", "declared_income_band": "\u20b95L\u201315L/yr", "declared_source": "Salaried employment"}'

# 9. (only if step 7 returned review_required: true) create an agent-led KYC session
curl -X POST http://localhost:8000/agent/sessions \
  -H "Content-Type: application/json" \
  -d '{"user_id": "<user_id>", "reason": "face_liveness_borderline_score"}'

# 10. check final status
curl http://localhost:8000/status/<user_id>
```

---

## 11. Known things to fix before demo day

- [ ] Confirm real Setu sandbox credentials work (test with a real sandbox Aadhaar test number if Setu provides one)
- [ ] Download the real OpenSanctions CSV, confirm `COLUMN_MAP` matches (optional — synthetic data works for a demo)
- [ ] Set the real ngrok URL in `SETU_REDIRECT_URL` the morning of the demo (it changes on restart)
- [ ] Set `DAILY_API_KEY` in `.env` if the agent-led KYC video panel is part of the demo
- [ ] Delete `kyc_demo.db` after pulling schema changes so new tables/columns get created
- [ ] Tighten CORS `allow_origins` from `"*"` to Member C's actual dev URL if time permits
- [ ] `/agent/console` has no authentication — acceptable for a demo, not for production