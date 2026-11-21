# GB ELITEX

**THE FUTURE THINKS BEFORE YOU DO.**

Adaptive Connectivity Intelligence Platform — early development preview, version `0.1.0`.

GB ELITEX is being developed as a diagnostics and monitoring layer for connectivity that a person or organisation already has. It is **not** a mobile base station, cellular core, ISP, satellite service, or replacement for a telecom operator.

## What this starter release does

- Animated branded splash screen with a reduced-motion accessibility fallback.
- Responsive web dashboard and installable PWA shell.
- FastAPI backend with `/api/health`, `/api/ping`, `/api/download`, and `/api/upload`.
- User-triggered, size-limited test of the browser-to-GB ELITEX hosting path.
- Six RTT samples, average/min RTT, a simple jitter estimate, and bounded upload/download throughput samples.
- Upload data is measured and discarded; it is not written to a database.
- Render Blueprint (`render.yaml`) and a GitHub Actions test workflow.

## Important measurement limitation

The current test measures the network path between the user's browser and the **GB ELITEX server**. It does not measure a mobile operator's entire network, compare multiple independent ISPs, detect cellular radio signal strength, prove an ISP fault, perform ICMP ping/traceroute/DNS diagnostics to several independent targets, or test 4G/5G/satellite interfaces directly. The browser's `navigator.connection` values are best-effort device estimates and are shown only when the browser exposes them.

Do not present the current dashboard as a validated carrier-wide speed test. The next engineering milestone is a multi-target measurement agent with clearly identified endpoints, DNS/HTTPS/RTT checks, a consent-aware history store, and evidence-based diagnosis messages.

## Run locally

Requirements: Python 3.10+ (Python 3.12 is used in the Render configuration file).

```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux/Termux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open `http://127.0.0.1:8000`. API docs are at `http://127.0.0.1:8000/api/docs`.

Run checks:

```bash
pip install -r requirements-dev.txt
pytest -q
```

## Publish to GitHub

1. Sign in to GitHub and create a **new empty repository** named `gb-elitex` (do not pre-add a README or `.gitignore`).
2. Extract this ZIP on your computer or in Termux.
3. Open a terminal in the extracted `gb-elitex` folder and run:

```bash
git init
git branch -M main
git add .
git commit -m "Initial GB ELITEX V1 foundation"
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/gb-elitex.git
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your GitHub username. Git will ask you to authenticate using the method configured on your device. Never paste a GitHub password or token into chat or commit it to this repository.

## Deploy on Render

This project includes `render.yaml` for Render Blueprints.

1. Sign in to Render and choose **New → Blueprint**.
2. Connect the GitHub account and select the `gb-elitex` repository.
3. Review the service named `gb-elitex` and its Python runtime, build command, start command, and `/api/health` health check.
4. Create/Apply the Blueprint. Render will build and deploy the service.
5. Open the assigned `https://<your-service>.onrender.com` address. Confirm that `/api/health` returns JSON with `status: ok`.

Official references:
- Render FastAPI deployment: https://render.com/docs/deploy-fastapi
- Render Blueprint specification: https://render.com/docs/blueprint-spec
- Render health checks: https://render.com/docs/health-checks
- GitHub: https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository

A successful deployment has not happened merely because this ZIP was created. It occurs after the repository is pushed and Render completes a successful deploy.

## Project structure

```text
gb-elitex/
├── app/
│   ├── __init__.py
│   ├── main.py
│   └── static/
│       ├── index.html
│       ├── styles.css
│       ├── app.js
│       ├── icon.svg
│       ├── manifest.webmanifest
│       └── service-worker.js
├── tests/test_api.py
├── .github/workflows/tests.yml
├── .gitignore
├── .python-version
├── .env.example
├── Procfile
├── render.yaml
├── requirements.txt
├── requirements-dev.txt
└── main.py
```

## Next development milestones

1. **MVP measurement agent:** multiple independent targets, DNS and HTTPS checks, repeatable timing samples, documented limits, endpoint labels, and data-use estimates.
2. **Evidence-led diagnosis:** explain what results suggest, show supporting measurements and uncertainty, and allow "insufficient evidence" rather than guessing.
3. **History and reports:** consent-aware user/site/device records, export, retention settings, and deletion controls.
4. **Linux edge probe:** a small computer on a customer-authorised network, with local checks and safe offline buffering.
5. **Supported router/modem integrations:** read health and link state only from documented, authorised interfaces before considering path-selection features.
6. **Hardware research:** choose processor, modem, antennas, battery, enclosure, thermal design and compliance only after software validation and measured requirements.

## Privacy and safety baseline

- No account system or persistent user database is included in this preview.
- No location, message content, passwords, or browsing history is requested.
- The upload test is capped at 1 MiB and the frontend sends 64 KiB; the payload is discarded after counting bytes.
- Download test is capped at 1 MiB and currently sends 256 KiB from the UI.
- Tests are manually initiated; avoid repeated testing on mobile data if data cost matters.
- Before adding telemetry, accounts, location, router control, radio hardware or public connectivity services, perform a security/privacy review and check applicable Tanzanian regulatory requirements with TCRA and qualified advisers.

## Status

This is a first software foundation, not a production-ready telecom product. Measurements, diagnosis quality, security, scale, hardware design, and regulatory readiness require further engineering and field validation.
