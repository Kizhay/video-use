#!/usr/bin/env bash
# Дежурство: спрашивает сервер о новом задании монтажа каждые 20 с.
# Выход 0 + /tmp/job.json — задание взято; выход 3 — за отведённое время заданий не было.
# Нужны: MONTAGE_POLL_KEY (секрет из настроек подпрограммы), MONTAGE_BASE (по умолчанию прод).
BASE="${MONTAGE_BASE:-https://lk.rocketmetrix.ru}"; LIMIT="${1:-540}"; t0=$(date +%s)
[ -z "$MONTAGE_POLL_KEY" ] && { echo "нет MONTAGE_POLL_KEY"; exit 2; }
while [ $(( $(date +%s) - t0 )) -lt "$LIMIT" ]; do
  code=$(curl -s -m 20 -o /tmp/job.json -w '%{http_code}' -H "x-montage-key: $MONTAGE_POLL_KEY" "$BASE/api/video/montage/claim")
  if [ "$code" = 200 ] && [ -s /tmp/job.json ]; then echo "ЗАДАНИЕ:"; cat /tmp/job.json; echo; exit 0; fi
  [ "$code" != 204 ] && echo "$(date +%T) ответ сервера $code"
  sleep 20
done
echo "заданий не было"; exit 3
