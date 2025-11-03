# Troubleshooting SSH Authentication for GitHub Actions

## Error: `ssh: unable to authenticate, attempted methods [none publickey]`

This error means GitHub Actions cannot authenticate with your Digital Ocean droplet using the SSH key.

---

## Solution 1: Verify SSH Key Format in GitHub Secrets

### Step 1: Check Your SSH Private Key Format

The SSH private key in GitHub Secrets must include:
- The BEGIN and END headers
- All newlines preserved
- No extra spaces or characters

**Correct format:**
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA... (many lines of base64 encoded data) ...
-----END RSA PRIVATE KEY-----
```

### Step 2: Verify the Key in GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click on **SSH_PRIVATE_KEY** secret
4. Click **Update** to view the key

**Check:**
- Does it start with `-----BEGIN RSA PRIVATE KEY-----`?
- Does it end with `-----END RSA PRIVATE KEY-----`?
- Are there newlines between each line? (each line should be on its own line)

### Step 3: Re-add the SSH Key (If Needed)

If the format looks wrong, regenerate and re-add:

**On your local machine:**
```bash
# Generate new SSH key (if you don't have one)
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# View the private key (copy this ENTIRE output)
cat ~/.ssh/github_actions_deploy
```

**Copy the ENTIRE output** including:
- First line: `-----BEGIN RSA PRIVATE KEY-----`
- All middle lines (base64 data)
- Last line: `-----END RSA PRIVATE KEY-----`

**In GitHub:**
1. Go to **Settings** → **Secrets** → **Actions**
2. Click **SSH_PRIVATE_KEY** → **Update**
3. Paste the ENTIRE key (including BEGIN and END lines)
4. Click **Update secret**

---

## Solution 2: Verify Public Key is on Droplet

### Step 1: Get Your Public Key

**On your local machine:**
```bash
# View the public key
cat ~/.ssh/github_actions_deploy.pub

# Or if you used a different name:
cat ~/.ssh/id_rsa.pub
```

### Step 2: Add Public Key to Droplet

**Option A: Using SSH from your local machine**
```bash
# Copy public key to droplet
cat ~/.ssh/github_actions_deploy.pub | ssh root@YOUR_DROPLET_IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

# Replace YOUR_DROPLET_IP with your actual IP
```

**Option B: Manually on the droplet**
```bash
# SSH into droplet with your regular key
ssh root@YOUR_DROPLET_IP

# Once connected, create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Edit authorized_keys file
nano ~/.ssh/authorized_keys

# Paste your public key (from cat ~/.ssh/github_actions_deploy.pub)
# Press Ctrl+X, then Y, then Enter to save

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys
```

### Step 3: Verify the Key is Added

**On the droplet:**
```bash
# Check authorized_keys file
cat ~/.ssh/authorized_keys

# Should show your public key (starts with ssh-rsa or ssh-ed25519)
```

---

## Solution 3: Test SSH Connection Manually

### Test from Local Machine

```bash
# Test SSH connection using the private key
ssh -i ~/.ssh/github_actions_deploy root@YOUR_DROPLET_IP

# If it works, you should be logged into the droplet
# If it fails, check the error message
```

**Common issues:**
- "Permission denied (publickey)" - Public key not on droplet
- "Host key verification failed" - Type `yes` to accept
- "Connection refused" - Droplet not accessible or firewall blocking

---

## Solution 4: Update GitHub Actions Workflow (If Using Password Auth)

If you're using password authentication instead of SSH keys (not recommended but possible):

**Update the workflow to use password:**
```yaml
- name: Deploy to Digital Ocean Droplet
  uses: appleboy/scp-action@master
  with:
    host: ${{ secrets.DROPLET_HOST }}
    username: ${{ secrets.DROPLET_USER }}
    password: ${{ secrets.DROPLET_PASSWORD }}  # Instead of key
    source: "api/*"
    target: "/opt/tlp/api"
    strip_components: 1
```

**Add DROPLET_PASSWORD secret in GitHub** (not recommended for security)

---

## Solution 5: Verify Droplet SSH Configuration

### Check SSH Service on Droplet

```bash
# SSH into droplet
ssh root@YOUR_DROPLET_IP

# Check SSH service status
sudo systemctl status ssh

# Check SSH configuration
sudo nano /etc/ssh/sshd_config

# Verify these settings:
# PubkeyAuthentication yes
# AuthorizedKeysFile .ssh/authorized_keys

# Restart SSH service if you made changes
sudo systemctl restart ssh
```

### Check Firewall

```bash
# Check if SSH port (22) is open
sudo ufw status

# If SSH is blocked, allow it:
sudo ufw allow 22/tcp
sudo ufw allow OpenSSH
```

---

## Solution 6: Use Alternative SSH Action

If `appleboy/scp-action` continues to have issues, try a different approach:

### Option A: Use ssh-action with explicit key

Update your workflow:

```yaml
- name: Deploy to Digital Ocean Droplet
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.DROPLET_HOST }}
    username: ${{ secrets.DROPLET_USER }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    script: |
      mkdir -p /opt/tlp/api
      
- name: Copy files
  uses: appleboy/scp-action@master
  with:
    host: ${{ secrets.DROPLET_HOST }}
    username: ${{ secrets.DROPLET_USER }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    source: "api/*"
    target: "/opt/tlp/api"
    strip_components: 1
```

### Option B: Use rsync instead

```yaml
- name: Setup SSH
  run: |
    mkdir -p ~/.ssh
    echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_rsa
    chmod 600 ~/.ssh/id_rsa
    ssh-keyscan -H ${{ secrets.DROPLET_HOST }} >> ~/.ssh/known_hosts
    
- name: Deploy files
  run: |
    rsync -avz --delete \
      -e "ssh -i ~/.ssh/id_rsa" \
      api/ \
      ${{ secrets.DROPLET_USER }}@${{ secrets.DROPLET_HOST }}:/opt/tlp/api/
```

---

## Quick Fix Checklist

Run through this checklist:

- [ ] SSH private key in GitHub Secrets includes `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`
- [ ] SSH private key in GitHub Secrets has newlines preserved (not all on one line)
- [ ] Public key is added to droplet's `~/.ssh/authorized_keys` file
- [ ] `authorized_keys` file has correct permissions (600)
- [ ] `.ssh` directory has correct permissions (700)
- [ ] SSH service is running on droplet (`systemctl status ssh`)
- [ ] Firewall allows SSH (port 22)
- [ ] Can manually SSH from local machine using the key: `ssh -i ~/.ssh/github_actions_deploy root@YOUR_DROPLET_IP`
- [ ] GitHub Secrets are set correctly:
  - [ ] `DROPLET_HOST` is correct (IP or domain)
  - [ ] `DROPLET_USER` is correct (usually `root`)
  - [ ] `SSH_PRIVATE_KEY` contains the full private key

---

## Step-by-Step Fix (Recommended)

### 1. Generate New SSH Key Pair

```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# When prompted, press Enter for no passphrase (or set one if preferred)
```

### 2. Add Public Key to Droplet

```bash
# Copy public key to droplet
cat ~/.ssh/github_actions_deploy.pub | ssh root@YOUR_DROPLET_IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh"
```

### 3. Test Connection

```bash
# Test SSH connection
ssh -i ~/.ssh/github_actions_deploy root@YOUR_DROPLET_IP

# If successful, you're logged in. Type 'exit' to leave.
```

### 4. Get Private Key for GitHub

```bash
# Display private key (copy ENTIRE output)
cat ~/.ssh/github_actions_deploy
```

### 5. Update GitHub Secret

1. Go to GitHub repository → **Settings** → **Secrets** → **Actions**
2. Click **SSH_PRIVATE_KEY** → **Update**
3. **Delete the old key completely**
4. Paste the ENTIRE private key (including BEGIN and END lines)
5. Make sure each line is on its own line (not all on one line)
6. Click **Update secret**

### 6. Verify Secret Format

After updating, the secret should look like this when you view it:
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
(many lines)
...
-----END RSA PRIVATE KEY-----
```

### 7. Re-run GitHub Actions

1. Go to **Actions** tab
2. Click on the failed workflow
3. Click **Re-run all jobs**

---

## Common Mistakes

1. **Copying only part of the key** - Must include BEGIN and END lines
2. **All on one line** - GitHub may strip newlines, but they should be preserved
3. **Wrong public key on droplet** - Public key must match the private key
4. **Wrong permissions** - `authorized_keys` must be 600, `.ssh` must be 700
5. **Wrong user** - If droplet user is not `root`, update `DROPLET_USER` secret
6. **Firewall blocking** - Port 22 must be open
7. **Wrong IP** - Verify `DROPLET_HOST` is correct

---

## Verification Commands

**On droplet, verify setup:**
```bash
# Check authorized_keys exists and has correct permissions
ls -la ~/.ssh/authorized_keys
# Should show: -rw------- (600 permissions)

# Check .ssh directory permissions
ls -ld ~/.ssh
# Should show: drwx------ (700 permissions)

# Check if your key is in authorized_keys
grep "github-actions" ~/.ssh/authorized_keys
# Should show your public key
```

**Test from GitHub Actions workflow (add as a test step):**
```yaml
- name: Test SSH Connection
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.DROPLET_HOST }}
    username: ${{ secrets.DROPLET_USER }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    script: |
      echo "SSH connection successful!"
      whoami
      pwd
```

---

## Still Having Issues?

If none of the above solutions work:

1. **Check GitHub Actions logs** for more detailed error messages
2. **Try SSH with verbose output** to see what's happening:
   ```bash
   ssh -v -i ~/.ssh/github_actions_deploy root@YOUR_DROPLET_IP
   ```
3. **Check Digital Ocean droplet logs**:
   ```bash
   sudo tail -f /var/log/auth.log
   ```
4. **Verify no IP restrictions** on droplet (check Digital Ocean firewall settings)
5. **Try creating a new droplet** and setting up from scratch

---

## Alternative: Use Digital Ocean API Token

If SSH continues to be problematic, you can use Digital Ocean's API for deployment, but this requires a different approach and is more complex. For most use cases, fixing SSH authentication is the better solution.

