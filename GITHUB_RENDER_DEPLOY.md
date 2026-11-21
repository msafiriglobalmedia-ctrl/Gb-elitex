# Publish GB ELITEX to GitHub and Render

## A. GitHub repository

Create a new empty repository named `gb-elitex`. Keep it private or public according to your preference. Do not add a README, license, or `.gitignore` on GitHub because these are already included in this project.

From the extracted project directory:

```bash
git init
git branch -M main
git add .
git commit -m "Initial GB ELITEX V1 foundation"
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/gb-elitex.git
git push -u origin main
```

If you already initialized Git in this folder, do not run `git init` again. Use `git remote -v` to check an existing remote before adding a new one.

## B. Render Blueprint

1. Log in to Render.
2. Select **New → Blueprint**.
3. Connect GitHub and select `gb-elitex`.
4. Render reads `render.yaml`; inspect the service settings.
5. Apply the Blueprint and open the deployed URL when the build succeeds.
6. Check `https://YOUR-SERVICE.onrender.com/api/health`.

The expected response contains `"status":"ok"` and `"service":"GB ELITEX"`.

## C. If deploying as a normal Web Service instead

- Runtime: Python 3
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check path: `/api/health`

Do not share GitHub tokens, Render API keys, passwords, or account recovery codes. Deployment requires you to sign in to your own accounts and approve repository access.
