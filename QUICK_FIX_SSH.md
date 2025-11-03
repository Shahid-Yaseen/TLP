# Quick Fix for SSH Authentication Error

## The Problem
GitHub Actions cannot authenticate with your droplet. The error `ssh: unable to authenticate, attempted methods [none publickey]` means the SSH key is not working.

## Quick Fix (5 minutes)

### Step 1: Generate SSH Key (if you don't have one)

```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions_deploy

# Press Enter when asked for passphrase (no passphrase for GitHub Actions)
```

### Step 2: Add Public Key to Droplet

```bash
# Replace YOUR_DROPLET_IP with your actual droplet IP
cat ~/.ssh/github_actions_deploy.pub | ssh root@YOUR_DROPLET_IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh"
```

### Step 3: Test Connection Locally

```bash
# Test that it works
ssh -i ~/.ssh/github_actions_deploy root@YOUR_DROPLET_IP

# If you get logged in, it works! Type 'exit' to leave.
```

### Step 4: Get Private Key for GitHub

```bash
# Copy the ENTIRE private key (including BEGIN and END lines)
cat ~/.ssh/github_actions_deploy
```

**IMPORTANT:** Copy the ENTIRE output, including:
- `-----BEGIN RSA PRIVATE KEY-----`
- All the middle lines
- `-----END RSA PRIVATE KEY-----`

### Step 5: Update GitHub Secret

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Find **SSH_PRIVATE_KEY** and click **Update** (or create it if it doesn't exist)
4. **DELETE everything** in the value field
5. **Paste the ENTIRE private key** you copied in Step 4
6. **Make sure it's formatted correctly** (each line on its own line, not all on one line)
7. Click **Update secret**

### Step 6: Verify Secret Format

After saving, when you view the secret, it should look like:
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
(many lines of base64 data)
...
-----END RSA PRIVATE KEY-----
```

NOT like this (all on one line):
```
-----BEGIN RSA PRIVATE KEY----- MIIEpAIBAAKCAQEA... ... -----END RSA PRIVATE KEY-----
```

### Step 7: Re-run GitHub Actions

1. Go to **Actions** tab in your repository
2. Click on the failed workflow run
3. Click **Re-run all jobs**

---

## Common Issues

### Issue: "Still getting authentication error"

**Check:**
1. Did you add the **public key** (`.pub` file) to the droplet? (Step 2)
2. Is the **private key** in GitHub Secrets complete? (Step 5)
3. Are the BEGIN and END lines included in the secret?
4. Did you test SSH locally? (Step 3)

**Fix:**
```bash
# Re-add public key to droplet
cat ~/.ssh/github_actions_deploy.pub | ssh root@YOUR_DROPLET_IP "cat >> ~/.ssh/authorized_keys"

# Verify it's there
ssh root@YOUR_DROPLET_IP "cat ~/.ssh/authorized_keys | grep github-actions"
```

### Issue: "Can't connect to droplet at all"

**Check:**
- Is the droplet IP correct?
- Is the droplet running?
- Is port 22 open in the firewall?

**Fix:**
```bash
# Check if you can ping the droplet
ping YOUR_DROPLET_IP

# Check if SSH port is open
nc -zv YOUR_DROPLET_IP 22
```

### Issue: "GitHub Secrets shows all on one line"

This sometimes happens when copying. The secret should have line breaks. Try:
1. Delete the secret
2. Create it again
3. Paste the key from a text editor (not directly from terminal)
4. Make sure each line is on its own line

---

## Verification

After fixing, the workflow should show:
```
✅ Test SSH Connection
  SSH connection successful!
  Connected as user: root
  Current directory: /root
  Hostname: tlp-production
```

If you see this, SSH authentication is working!

---

## Need More Help?

See `TROUBLESHOOTING_SSH.md` for detailed troubleshooting steps.

