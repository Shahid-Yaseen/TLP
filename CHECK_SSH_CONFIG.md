# Check SSH Configuration

Run this command on your droplet to check PubkeyAuthentication:

```bash
sudo grep "^PubkeyAuthentication" /etc/ssh/sshd_config
```

## Expected Output

**If it shows:**
```
PubkeyAuthentication yes
```
✅ **Perfect!** Public key authentication is enabled. No changes needed.

**If it shows:**
```
#PubkeyAuthentication yes
```
or
```
PubkeyAuthentication no
```
❌ **Need to fix it!** See instructions below.

**If it shows nothing:**
This means the line is commented out or missing. Also need to fix it.

## How to Fix (If Needed)

```bash
# 1. Edit SSH config
sudo nano /etc/ssh/sshd_config

# 2. Find the line with PubkeyAuthentication
# Press Ctrl+W to search, type: PubkeyAuthentication

# 3. Make sure it says:
PubkeyAuthentication yes

# If it's commented out (starts with #), remove the #
# If it says "no", change to "yes"
# If the line doesn't exist, add it

# 4. Save: Ctrl+X, then Y, then Enter

# 5. Test the config (make sure no syntax errors)
sudo sshd -t

# 6. If test passes, restart SSH
sudo systemctl restart ssh

# 7. Verify it's enabled
sudo grep "^PubkeyAuthentication" /etc/ssh/sshd_config
```

## Also Check AuthorizedKeysFile

```bash
sudo grep "^AuthorizedKeysFile" /etc/ssh/sshd_config
```

Should show:
```
AuthorizedKeysFile .ssh/authorized_keys
```

## Complete Verification

After fixing (if needed), run this complete check:

```bash
echo "=== SSH Configuration ==="
echo ""
echo "1. PubkeyAuthentication:"
sudo grep "^PubkeyAuthentication" /etc/ssh/sshd_config
echo ""
echo "2. AuthorizedKeysFile:"
sudo grep "^AuthorizedKeysFile" /etc/ssh/sshd_config
echo ""
echo "3. SSH Service Status:"
sudo systemctl is-active ssh
echo ""
echo "=== Done ==="
```

## Next Steps After Verification

Once PubkeyAuthentication is confirmed as "yes":

1. ✅ Test SSH connection locally
2. ✅ Verify GitHub Secret format
3. ✅ Test GitHub Actions workflow

