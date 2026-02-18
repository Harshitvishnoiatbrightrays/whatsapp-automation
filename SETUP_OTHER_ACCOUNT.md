# Setup Remote for harshitvishnoi08 Account

## Problem
Git is using cached credentials and won't prompt for username/password.

## Solution: Use Personal Access Token

### Step 1: Create Personal Access Token

1. Go to https://github.com/settings/tokens
2. **Sign in as `harshitvishnoi08`**
3. Click "Generate new token (classic)"
4. Give it a name: "whatsapp-automation"
5. Select scope: **`repo`** (full control of private repositories)
6. Click "Generate token"
7. **Copy the token immediately** (you won't see it again!)

### Step 2: Update Remote with Token

**Option A: Use the script**
```bash
./setup-other-remote.sh YOUR_TOKEN_HERE
```

**Option B: Manual command**
```bash
git remote set-url other https://YOUR_TOKEN@github.com/harshitvishnoi08/whatsapp-automation.git
```

Replace `YOUR_TOKEN` with the token you copied.

### Step 3: Push to Other Account

```bash
git push other main
```

## Alternative: Use SSH (More Secure)

If you prefer SSH:

1. Generate SSH key:
   ```bash
   ssh-keygen -t ed25519 -C "vishnoih10@gmail.com" -f ~/.ssh/id_ed25519_harshitvishnoi08
   ```

2. Add to SSH agent:
   ```bash
   ssh-add ~/.ssh/id_ed25519_harshitvishnoi08
   ```

3. Add public key to GitHub:
   - Copy: `cat ~/.ssh/id_ed25519_harshitvishnoi08.pub`
   - GitHub → Settings → SSH and GPG keys → New SSH key

4. Update remote to use SSH:
   ```bash
   git remote set-url other git@github.com:harshitvishnoi08/whatsapp-automation.git
   ```

5. Push:
   ```bash
   git push other main
   ```
