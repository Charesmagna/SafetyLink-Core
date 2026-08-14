NODE_ENV=production node dist/server.cjs > prod6.log 2>&1 &
PID=$!
sleep 2
if ps -p $PID > /dev/null; then
  echo "ALIVE"
  kill $PID
else
  echo "DEAD"
fi
