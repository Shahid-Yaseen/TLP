# SSH Verification - Permissions Fixed ✓

Your permissions are now correct! Let's verify the remaining configuration.

## ✅ Completed
- [x] Public key in `authorized_keys` - ✓ Found
- [x] `.ssh` directory permissions (700) - ✓ Correct
- [x] `authorized_keys` file permissions (600) - ✓ Correct

## Next: Verify SSH Service Configuration

Run these commands on your droplet:

```bash
# 1. Check SSH service is running
sudo systemctl status ssh

# 2. Verify PubkeyAuthentication is enabled
sudo grep "^PubkeyAuthentication" /etc/ssh/sshd_config

# Should show: PubkeyAuthentication yes
# If it shows "no" or is commented out, fix it:
sudo nano /etc/ssh/sshd_config
# Find: #PubkeyAuthentication yes
# Change to: PubkeyAuthentication yes
# Save (Ctrl+X, Y, Enter)
# Then restart: sudo systemctl restart ssh

# 3. Verify AuthorizedKeysFile path
sudo grep "^AuthorizedKeysFile" /etc/ssh/sshd_config

# Should show: AuthorizedKeysFile .ssh/authorized_keys
```

## Test SSH Connection Locally

From your **local machine** (not the droplet):

```bash
# Test SSH connection with your private key
ssh -i ~/.ssh/github_actions_deploy root@YOUR_DROPLET_IP

# If successful, you'll be logged in. Type 'exit' to leave.
# If it fails, check the error message.
```

## Verify GitHub Secret Format

The most common remaining issue is the GitHub Secret format. 

### Check Your Private Key Format

On your local machine:

```bash
# View your private key
cat ~/.ssh/github_actions_deploy | head -1
# Should show: -----BEGIN RSA PRIVATE KEY-----

cat ~/.ssh/github_actions_deploy | tail -1
# Should show: -----END RSA PRIVATE KEY-----
```

### Update GitHub Secret (If Needed)

1. Go to GitHub → Your Repository → **Settings** → **Secrets and variables** → **Actions**
2. Find `SSH_PRIVATE_KEY` and click **Update**
3. **Delete all existing content**
4. Copy your ENTIRE private key:
   ```bash
   cat ~/.ssh/github_actions_deploy
   ```
5. Paste it into GitHub Secret
6. **Important**: Make sure each line is on its own line (not all on one line)
7. Click **Update secret**

### Verify Secret Format

After updating, the secret should look like this when viewed:
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
(many lines)
...
-----END RSA PRIVATE KEY-----
```

**NOT** like this (all on one line):
```
-----BEGIN RSA PRIVATE KEY----- MIIEpAIBAAKCAQEA... ... -----END RSA PRIVATE KEY-----
```

## Quick Test Script for Droplet

Run this complete verification on your droplet:

```bash
#!/bin/bash
echo "=== SSH Configuration Verification ==="
echo ""

echo "1. Permissions:"
ls -ld ~/.ssh
ls -l ~/.ssh/authorized_keys
echo ""

echo "2. SSH Service:"
sudo systemctl status ssh --no-pager | head -3
echo ""

echo "3. SSH Configuration:"
sudo grep "^PubkeyAuthentication" /etc/ssh/sshd_config
sudo grep "^AuthorizedKeysFile" /etc/ssh/sshd_config
echo ""

echo "4. GitHub Actions Key:"
grep -c "github-actions-deploy" ~/.ssh/authorized_keys && echo "✓ Found" || echo "✗ Not found"
echo ""

echo "5. Firewall:"
sudo ufw status | grep -E "(22|OpenSSH)"
echo ""

echo "=== Verification Complete ==="
```

Save as `verify.sh`, make executable (`chmod +x verify.sh`), and run it.

## Test GitHub Actions

Once everything is verified:

1. **Commit and push** a small change to trigger the workflow:
   ```bash
   echo "# Test deployment" >> README.md
   git add README.md
   git commit -m "Test SSH connection"
   git push origin main
   ```

2. **Go to GitHub Actions** tab and watch the workflow

3. **Check the "Test SSH Connection" step** - it should now pass!

## Common Remaining Issues

### Issue: Local SSH works but GitHub Actions fails

**Cause**: GitHub Secret format issue
**Fix**: Re-add the secret with proper line breaks (see above)

### Issue: "Connection refused"

**Cause**: Firewall or SSH service not running
**Fix**: 
```bash
sudo systemctl start ssh
sudo ufw allow 22/tcp
```

### Issue: "Permission denied" even after fixing permissions

**Cause**: SSH service needs restart or config issue
**Fix**:
```bash
sudo systemctl restart ssh
# Verify config:
sudo sshd -t  # Test SSH config
```

## Success Indicators

You'll know it's working when:

1. ✅ Local SSH test works: `ssh -i ~/.ssh/github_actions_deploy root@IP`
2. ✅ GitHub Actions "Test SSH Connection" step passes
3. ✅ Deployment files are copied to droplet
4. ✅ Workflow completes successfully

## Next Steps After SSH Works

Once SSH authentication is working:

1. The workflow will automatically deploy files
2. Check deployment on droplet: `ls -la /opt/tlp/api`
3. Verify API is running: `pm2 status`
4. Test the application in browser

---

**You're almost there!** The permissions are fixed. Now verify SSH config and GitHub Secret format, and you should be good to go!

