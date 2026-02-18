# Quick Push to Other Account

Since you have collaborator access, you need to use a Personal Access Token from your **Harshitvishnoiatbrightrays** account.

## Steps:

1. **Create Personal Access Token:**
   - Go to https://github.com/settings/tokens (sign in as Harshitvishnoiatbrightrays)
   - Click "Generate new token (classic)"
   - Name: "whatsapp-automation-push"
   - Select scope: **`repo`**
   - Generate and copy the token

2. **Update remote with token:**
   ```bash
   git remote set-url other https://YOUR_TOKEN@github.com/harshitvishnoi08/whatsapp-automation.git
   ```

3. **Push:**
   ```bash
   git push other main
   ```

## Or use the script:
```bash
./setup-other-remote.sh YOUR_TOKEN
git push other main
```
