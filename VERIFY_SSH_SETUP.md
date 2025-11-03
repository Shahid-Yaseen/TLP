# Verify SSH Setup on Droplet

Your public key is already in `authorized_keys`. Let's verify everything is configured correctly.

## Step 1: Verify File Permissions

Run these commands on your droplet:

```bash
# Check .ssh directory permissions (should be 700)
ls -ld ~/.ssh
# Should show: drwx------

# If not, fix it:
chmod 700 ~/.ssh

# Check authorized_keys permissions (should be 600)
ls -l ~/.ssh/authorized_keys
# Should show: -rw-------

# If not, fix it:
chmod 600 ~/.ssh/authorized_keys

# Check ownership
ls -la ~/.ssh/
# Should show root as owner (if logged in as root)
```

## Step 2: Verify SSH Service Configuration

```bash
# Check SSH service is running
sudo systemctl status ssh

# Check SSH configuration
sudo grep -E "^(PubkeyAuthentication|AuthorizedKeysFile)" /etc/ssh/sshd_config

# Should show:
# PubkeyAuthentication yes
# AuthorizedKeysFile .ssh/authorized_keys

# If PubkeyAuthentication is no, edit:
sudo nano /etc/ssh/sshd_config
# Change to: PubkeyAuthentication yes
# Save and restart: sudo systemctl restart ssh
```

## Step 3: Test SSH Connection Locally

From your local machine, test the connection:

```bash
# Test SSH with the private key
ssh -i ~/.ssh/github_actions_deploy -v root@YOUR_DROPLET_IP

# The -v flag shows verbose output to help diagnose issues
# Look for:
# - "Offering public key" - means key is being offered
# - "Server accepts key" - means key is accepted
```

## Step 4: Verify GitHub Secret Format

The private key in GitHub Secrets must match the public key. Check:

1. **Get your private key locally:**
```bash
cat ~/.ssh/github_actions_deploy
```

2. **Verify it includes:**
   - `-----BEGIN RSA PRIVATE KEY-----` at the start
   - Many lines of base64 data
   - `-----END RSA PRIVATE KEY-----` at the end

3. **In GitHub:**
   - Go to Settings → Secrets → Actions
   - Click on `SSH_PRIVATE_KEY`
   - Verify it matches your local private key

## Step 5: Check Droplet Firewall

```bash
# On droplet, check firewall
sudo ufw status

# Should show:
# 22/tcp                     ALLOW       Anywhere
# OpenSSH                    ALLOW       Anywhere

# If SSH is not allowed:
sudo ufw allow 22/tcp
sudo ufw allow OpenSSH
```

## Step 6: Verify Key Matching

The public key in `authorized_keys` should match your private key. To verify:

**On your local machine:**
```bash
# Extract the public key from your private key
ssh-keygen -y -f ~/.ssh/github_actions_deploy

# This should output the same key as in authorized_keys (the one with "github-actions-deploy")
```

**Compare with what's on the droplet:**
```bash
# On droplet
cat ~/.ssh/authorized_keys | grep github-actions
```

They should match!

## Step 7: Test from GitHub Actions

After verifying everything above, push a change to trigger the workflow:

```bash
# Make a small change
echo "# Test" >> README.md
git add README.md
git commit -m "Test SSH connection"
git push origin main
```

Then check the GitHub Actions workflow - the "Test SSH Connection" step should now pass.

## Common Issues and Fixes

### Issue: "Permission denied (publickey)"

**Check:**
1. Are file permissions correct? (Step 1)
2. Is PubkeyAuthentication enabled? (Step 2)
3. Does the private key match the public key? (Step 6)

### Issue: "Connection refused"

**Check:**
1. Is the droplet running?
2. Is port 22 open in firewall? (Step 5)
3. Can you ping the droplet IP?

### Issue: "Host key verification failed"

This is normal on first connection. Just means you need to accept the host key.

## Quick Verification Script

Run this on your droplet to verify everything:

```bash
#!/bin/bash
echo "=== SSH Configuration Check ==="
echo ""
echo "1. .ssh directory permissions:"
ls -ld ~/.ssh
echo ""
echo "2. authorized_keys permissions:"
ls -l ~/.ssh/authorized_keys
echo ""
echo "3. SSH service status:"
sudo systemctl status ssh --no-pager | head -3
echo ""
echo "4. PubkeyAuthentication:"
sudo grep "^PubkeyAuthentication" /etc/ssh/sshd_config
echo ""
echo "5. AuthorizedKeysFile:"
sudo grep "^AuthorizedKeysFile" /etc/ssh/sshd_config
echo ""
echo "6. GitHub Actions key in authorized_keys:"
grep -c "github-actions-deploy" ~/.ssh/authorized_keys && echo "✓ Found" || echo "✗ Not found"
echo ""
echo "7. Firewall status:"
sudo ufw status | grep -E "(22|OpenSSH)"
echo ""
echo "=== Check Complete ==="
```

Save as `check_ssh.sh`, make executable (`chmod +x check_ssh.sh`), and run it.

## Next Steps

Once all checks pass:
1. Verify GitHub Secret is correct
2. Test SSH connection locally
3. Push to trigger GitHub Actions
4. Monitor the workflow logs

The "Test SSH Connection" step in the workflow will confirm if everything is working!

