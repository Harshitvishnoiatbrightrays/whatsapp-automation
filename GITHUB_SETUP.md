# GitHub Setup Guide

## Option 1: Set Local Git Config (For this repository only)

Run these commands with your other GitHub account details:

```bash
git config user.name "Your Other GitHub Username"
git config user.email "your-other-email@example.com"
```

## Option 2: Authentication Methods

### Method A: Personal Access Token (Recommended for HTTPS)

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate a new token with `repo` permissions
3. Copy the token
4. When pushing, use the token as your password (username is your GitHub username)

### Method B: SSH Key (Recommended for multiple accounts)

1. Generate SSH key for this account:
   ```bash
   ssh-keygen -t ed25519 -C "your-other-email@example.com" -f ~/.ssh/id_ed25519_other
   ```

2. Add to SSH agent:
   ```bash
   ssh-add ~/.ssh/id_ed25519_other
   ```

3. Add public key to GitHub:
   - Copy: `cat ~/.ssh/id_ed25519_other.pub`
   - GitHub → Settings → SSH and GPG keys → New SSH key

4. Configure SSH to use different key for different GitHub accounts:
   Create/edit `~/.ssh/config`:
   ```
   Host github-other
     HostName github.com
     User git
     IdentityFile ~/.ssh/id_ed25519_other
   ```

5. Use SSH URL when adding remote:
   ```bash
   git remote add origin git@github-other:USERNAME/REPO.git
   ```

## Quick Setup Commands

After setting up authentication, run:

```bash
# Add remote (replace with your repository URL)
git remote add origin https://github.com/YOUR_USERNAME/whatsapp-automation.git
# OR for SSH:
# git remote add origin git@github-other:YOUR_USERNAME/whatsapp-automation.git

# Push to GitHub
git push -u origin main
```
