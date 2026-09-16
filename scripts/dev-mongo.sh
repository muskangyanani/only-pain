#!/usr/bin/env bash
# Starts a single-node MongoDB replica set for local development.
# Prisma's MongoDB connector needs a replica set (it uses transactions).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA="$ROOT/.data/mongo"
LOG="$ROOT/.data/mongo.log"
PORT="${MONGO_PORT:-27018}"
mkdir -p "$DATA"
if mongosh --quiet --port "$PORT" --eval 'db.runCommand({ping:1}).ok' >/dev/null 2>&1; then
  echo "mongod already running on :$PORT"
else
  mongod --replSet rs0 --port "$PORT" --bind_ip 127.0.0.1 --dbpath "$DATA" --logpath "$LOG" --fork >/dev/null
  echo "mongod started on :$PORT (log: $LOG)"
fi
# Initiate the replica set once (idempotent).
mongosh --quiet --port "$PORT" --eval '
  try { rs.status(); print("replica set already initiated"); }
  catch (e) { rs.initiate({_id:"rs0", members:[{_id:0, host:"127.0.0.1:'"$PORT"'"}]}); print("replica set initiated"); }
'
