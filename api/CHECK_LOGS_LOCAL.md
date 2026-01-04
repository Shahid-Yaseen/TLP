# How to Check Server Logs (Local Development)

## Quick Commands

### View Recent Logs
```bash
# View last 50 lines
tail -50 api/server.log

# View last 100 lines
tail -100 api/server.log

# View last 200 lines
tail -200 api/server.log
```

### Follow Logs in Real-Time
```bash
# Watch logs as they come in (press Ctrl+C to stop)
tail -f api/server.log

# Follow logs and show last 50 lines first
tail -f -n 50 api/server.log
```

### Search for Errors
```bash
# Find all errors in the log
grep -i error api/server.log

# Find recent errors (last 100 lines)
tail -100 api/server.log | grep -i error

# Find errors with context (5 lines before and after)
grep -i error -A 5 -B 5 api/server.log | tail -50

# Find specific error types
grep -i "database\|connection" api/server.log | tail -20
grep -i "500\|404\|401" api/server.log | tail -20
```

### View Log File Size
```bash
# Check log file size
ls -lh api/server.log

# Count total lines
wc -l api/server.log
```

### Clear Log File
```bash
# Clear the log file (keeps the file but empties it)
> api/server.log

# Or backup and clear
cp api/server.log api/server.log.backup && > api/server.log
```

## Check Running Server Output

If the server is running in a terminal, you'll see output there. If it's running in the background:

```bash
# Check if server is running
ps aux | grep "node.*index.js" | grep -v grep

# To see console output, restart the server in a visible terminal
cd api && npm start
```

## Common Error Patterns

### Database Connection Errors
```bash
grep -i "database\|postgres\|connection\|pool" api/server.log | tail -20
```

### API Sync Errors
```bash
grep -i "sync\|external api\|space devs" api/server.log | tail -20
```

### Authentication Errors
```bash
grep -i "auth\|unauthorized\|token\|jwt" api/server.log | tail -20
```

### Route/Endpoint Errors
```bash
grep -i "404\|not found\|route" api/server.log | tail -20
```

## One-Liner: Quick Error Check
```bash
# Show last 30 lines with any errors highlighted
tail -30 api/server.log | grep --color=always -i error || tail -30 api/server.log
```

## View Logs with Less (Better for Large Files)
```bash
# Open log file in less (press 'q' to quit, '/' to search)
less api/server.log

# Search in less: press '/' then type your search term, press 'n' for next match
```

