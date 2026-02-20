# Push this project to GitHub (weyoudev/Adminconsole)

Run these commands in **Git Bash** or a terminal where **Git** is installed (e.g. VS Code terminal, CMD with Git in PATH).

## 1. Open terminal in project root

```bash
cd e:\WeYouApp
```

## 2. Initialize Git (if not already)

```bash
git init
```

## 3. Add the GitHub remote

```bash
git remote add origin https://github.com/weyoudev/Adminconsole.git
```

If `origin` already exists and points elsewhere, either remove it first or use another name:

```bash
git remote remove origin
git remote add origin https://github.com/weyoudev/Adminconsole.git
```

## 4. Stage all files (respects .gitignore)

```bash
git add .
```

## 5. First commit

```bash
git commit -m "Initial commit: Laundry Admin console"
```

## 6. Push to GitHub

**If the repo is empty and you want to use `main`:**

```bash
git branch -M main
git push -u origin main
```

**If the repo already has commits (e.g. README) and you want to push over it:**

```bash
git branch -M main
git push -u origin main --force
```

---

### Authentication

- **HTTPS:** Git will ask for your GitHub username and a **Personal Access Token** (not your password). Create a token at: GitHub → Settings → Developer settings → Personal access tokens.
- **SSH:** If you use SSH keys, use the SSH URL instead:
  ```bash
  git remote add origin git@github.com:weyoudev/Adminconsole.git
  ```

### Pushing only the admin app

If you want the GitHub repo to contain **only** the `apps/admin-web` folder (no api, customer-web, etc.), you would need a separate clone, move only that app into a new repo, and push that. The steps above push the **entire WeYouApp** monorepo to `Adminconsole`.
