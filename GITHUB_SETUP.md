# How to Push Wet3.Camp to GitHub

This guide provides step-by-step instructions for pushing your Wet3.Camp project to GitHub.

## Prerequisites

- GitHub account (create one at https://github.com if you don't have one)
- Git installed on your computer (https://git-scm.com)
- Terminal/Command prompt access
- SSH key (optional but recommended for easier authentication)

## Step-by-Step Guide

### Step 1: Create a GitHub Repository

1. Go to https://github.com/new
2. Sign in to your GitHub account
3. Fill in the repository details:
   - **Repository name**: `wet3.camp`
   - **Description**: `Premium booking platform with featured carousel and live profiles`
   - **Privacy**: Choose "Public" (visible to everyone) or "Private" (visible only to you)
   - **Do NOT check**: "Initialize this repository with a README", "Add .gitignore", or "Choose a license"
4. Click **"Create repository"**

### Step 2: Initialize Git Locally

Open your terminal and navigate to your project directory:

```bash
cd /path/to/wet3.camp
```

If you haven't already initialized Git, run:

```bash
git init
```

### Step 3: Add Your Files to Git

Stage all files for commit:

```bash
git add .
```

Verify files are staged:

```bash
git status
```

You should see all files listed in green as "Changes to be committed".

### Step 4: Create Your First Commit

```bash
git commit -m "Initial commit: Premium booking platform with carousel and live profiles"
```

### Step 5: Connect to GitHub

Add the remote repository (replace `yourusername` with your GitHub username):

```bash
git remote add origin https://github.com/yourusername/wet3.camp.git
```

Verify the remote is added:

```bash
git remote -v
```

### Step 6: Rename Branch to Main (if needed)

Some systems default to `master`, but GitHub uses `main`. Rename if necessary:

```bash
git branch -M main
```

### Step 7: Push to GitHub

```bash
git push -u origin main
```

The `-u` flag sets the upstream branch, so future pushes only need `git push`.

**If you get an authentication error**, see the "Authentication" section below.

### Step 8: Verify on GitHub

Go to https://github.com/yourusername/wet3.camp

Your code should now be visible on GitHub!

## Authentication Methods

### HTTPS (Easiest for Beginners)

If using HTTPS URLs, GitHub will prompt for authentication:

1. Click on "Access tokens" or use "Personal Access Tokens" from GitHub Settings
2. Create a personal access token (classic or fine-grained)
3. Use your GitHub username and token as password when prompted

Or use GitHub CLI:

```bash
gh auth login
```

### SSH (Recommended for Regular Use)

1. **Generate SSH key** (if you don't have one):
```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
# Press Enter for all prompts to use defaults
```

2. **Add SSH key to GitHub**:
   - Copy your public key: `cat ~/.ssh/id_ed25519.pub`
   - Go to GitHub Settings → SSH and GPG Keys → New SSH key
   - Paste the key and save

3. **Update your remote URL** (if you used HTTPS):
```bash
git remote set-url origin git@github.com:yourusername/wet3.camp.git
```

4. **Test the connection**:
```bash
ssh -T git@github.com
```

## Making Updates

After your initial push, updating is simple:

### Quick Update (5 minutes)

```bash
# Make your changes in the code

# Stage changes
git add .

# Commit with a message
git commit -m "Feature: Added live profile animations"

# Push to GitHub
git push
```

### Best Practices for Commit Messages

- **Feature**: `git commit -m "Feature: Add user authentication"`
- **Bug Fix**: `git commit -m "Fix: Correct sidebar toggle on mobile"`
- **Update**: `git commit -m "Update: Improve carousel performance"`
- **Documentation**: `git commit -m "Docs: Update installation instructions"`

## Common Commands

```bash
# Check what's changed
git status

# View detailed changes
git diff

# See commit history
git log --oneline

# Undo changes to a file
git restore filename.tsx

# View a specific commit
git show abc1234

# Create a new branch for features
git checkout -b feature/awesome-feature

# Switch branches
git checkout main

# Merge a branch
git merge feature/awesome-feature

# Delete a branch
git branch -d feature/awesome-feature
```

## Troubleshooting

### Error: "Permission denied (publickey)"

**Solution**: SSH key authentication failed. Either:
1. Use HTTPS instead: `git remote set-url origin https://github.com/yourusername/wet3.camp.git`
2. Set up SSH keys properly (see SSH section above)

### Error: "fatal: 'origin' does not appear to be a 'git' repository"

**Solution**: You need to add the remote:
```bash
git remote add origin https://github.com/yourusername/wet3.camp.git
```

### Error: "Updates were rejected because the tip of your current branch is behind"

**Solution**: Pull latest changes first:
```bash
git pull origin main
# Resolve any conflicts if they exist
git push
```

### I Forgot My GitHub Password

**Solution**: Use Personal Access Tokens:
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token (classic)
3. Use this token as your password when prompted

## Alternative: Using GitHub CLI

GitHub provides a command-line tool that makes this easier:

### Install GitHub CLI
- **macOS**: `brew install gh`
- **Windows**: `choco install gh`
- **Linux**: See https://github.com/cli/cli#installation

### Authenticate
```bash
gh auth login
# Follow the interactive prompts
```

### Create and Push Repo
```bash
cd /path/to/wet3.camp

# Initialize git if needed
git init
git add .
git commit -m "Initial commit: Premium booking platform"

# Create repo and push in one command
gh repo create wet3.camp --source=. --remote=origin --push --public
```

## Next Steps

### 1. Deploy to Vercel (Free)
```bash
npm install -g vercel
vercel
# Link to your GitHub repo for auto-deployment
```

### 2. Enable GitHub Pages (Free Hosting)
Go to repository Settings → Pages → Select "main" branch

### 3. Add Collaborators
Settings → Collaborators → Add people to work together

### 4. Set Up Branch Protection
Settings → Branches → Add rule to protect "main" branch from direct pushes

### 5. Enable GitHub Actions
Add automated testing/deployment workflows

## Additional Resources

- Git Documentation: https://git-scm.com/doc
- GitHub Help: https://docs.github.com
- GitHub CLI: https://cli.github.com
- Conventional Commits: https://www.conventionalcommits.org

## Quick Reference Cheat Sheet

```bash
# First time setup
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/wet3.camp.git
git branch -M main
git push -u origin main

# Regular updates
git add .
git commit -m "Your message"
git push

# Check status anytime
git status
git log --oneline

# Undo mistakes
git restore <file>        # Undo changes to specific file
git reset HEAD~1          # Undo last commit (keep changes)
git revert HEAD~1         # Undo last commit (create new commit)
```

---

**Need Help?**
- Visit: https://github.com/yourusername/wet3.camp/issues
- Search existing issues for solutions
- Create a new issue with details about your problem
