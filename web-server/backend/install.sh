#!/usr/bin/env bash
#===============================================================================
# install.sh
#
# Installs and configures the "backend" service on Debian 12 (systemd),
# running as a non-root user and depending on a PostgreSQL database via Docker.
#
# Prerequisites:
#   • You have compiled "backend" and that binary is in this directory.
#   • You have a ".env" file (flattened; no ${…}) in this directory.
#   • You have a ".env.db" file for the database (Docker Compose) in this dir.
#   • You have a "compose.yaml" file that defines the Postgres container.
#   • The current user has privileges to run docker containers.
#     • This can be achieved by adding the user to the docker group:
#       sudo usermod -aG docker $USER
#       newgrp docker
#
# This script will:
#   1) Detect the non-root user who invoked sudo (or fallback to $USER)
#   2) Verify that the following files exist in the current directory:
#        • backend                (compiled Go binary)
#        • .env                   (environment file for the service)
#        • .env.db                (environment file for the database)
#        • compose.yaml           (Docker-Compose spec for PostgreSQL)
#   3) Create /etc/backend and copy .env, .env.db, compose.yaml there
#   4) Copy the backend binary into /usr/local/bin and set ownership/permissions
#   5) Ensure Docker is running, then launch or restart the Postgres container via Docker Compose
#   6) Create a systemd unit file at /etc/systemd/system/backend.service
#        • Sets WorkingDirectory=/etc/backend so the binary can load “.env” by filename
#        • Runs under the non-root user
#        • Restarts automatically on failure
#   7) Reload systemd, enable the service to start at boot, and start it immediately
#
# Usage:
#   sudo chmod +x install.sh
#   sudo ./install.sh
#
# Notes:
#   • The Go binary is expected to do godotenv.Load(".env"),
#     so we do NOT use a wrapper. Instead, we set WorkingDirectory so “.env” lives next to the binary’s CWD.
#   • All files under /etc/backend are owned by root:root with mode 644 (directories 755).
#   • The systemd service runs as the unprivileged user, not root.
#===============================================================================

set -euo pipefail

##########################
# 1) Detect “real” non-root user
##########################
if [[ -n "${SUDO_USER:-}" && "${SUDO_USER}" != "root" ]]; then
  INSTALL_USER="${SUDO_USER}"
else
  INSTALL_USER="${USER}"
fi

echo
echo "============================================"
echo " Installing backend Service as user: ${INSTALL_USER}"
echo "============================================"
echo

##########################
# 2) Verify required files exist in current dir
##########################
CWD="$(pwd)"
BIN_NAME="backend"
BIN_SRC="${CWD}/${BIN_NAME}"
ENV_SRC="${CWD}/.env"
ENV_DB_SRC="${CWD}/.env.db"
COMPOSE_SRC="${CWD}/compose.yaml"

echo "→ Checking for required files in ${CWD} ..."
MISSING=0
for path in "${BIN_SRC}" "${ENV_SRC}" "${ENV_DB_SRC}" "${COMPOSE_SRC}"; do
  if [[ ! -f "${path}" ]]; then
    echo "  ✗ ERROR: File not found: ${path}"
    MISSING=1
  else
    echo "  ✓ Found: ${path}"
  fi
done

if [[ ${MISSING} -ne 0 ]]; then
  echo
  echo " Aborting: please place all four files in one directory."
  echo "  • ${BIN_NAME}"
  echo "  • .env       (flattened, no \${…})"
  echo "  • .env.db    (DB creds for Docker Compose)"
  echo "  • compose.yaml"
  echo
  exit 1
fi
echo

##########################
# 3) Create /etc/backend and copy over .env, .env.db, compose.yaml
##########################
ETC_DIR="/etc/backend"
echo "→ Creating configuration directory: ${ETC_DIR}"
mkdir -p "${ETC_DIR}"
chmod 755 "${ETC_DIR}"

echo "→ Copying .env → ${ETC_DIR}/.env"
cp "${ENV_SRC}" "${ETC_DIR}/.env"
chown root:root "${ETC_DIR}/.env"
chmod 644 "${ETC_DIR}/.env"

echo "→ Copying .env.db → ${ETC_DIR}/.env.db"
cp "${ENV_DB_SRC}" "${ETC_DIR}/.env.db"
chown root:root "${ETC_DIR}/.env.db"
chmod 644 "${ETC_DIR}/.env.db"

echo "→ Copying compose.yaml → ${ETC_DIR}/compose.yaml"
cp "${COMPOSE_SRC}" "${ETC_DIR}/compose.yaml"
chown root:root "${ETC_DIR}/compose.yaml"
chmod 644 "${ETC_DIR}/compose.yaml"

echo

##########################
# 4) Ensure Docker service is running, then start Postgres via docker-compose
##########################
echo "→ Ensuring docker.service is active …"
if ! systemctl is-active --quiet docker.service; then
  echo "   • docker.service is not running; starting it now …"
  systemctl start docker.service
fi
echo

echo "→ Launching Postgres container with docker-compose"
# We run docker-compose as INSTALL_USER so that any host-mounted volumes end up
# owned by your user (not root). If you’re using Docker Compose v2, replace
# `docker-compose` with `docker compose`.
sudo -u "${INSTALL_USER}" docker compose -f "${ETC_DIR}/compose.yaml" up -d

echo "   • Current status of containers:"
sudo -u "${INSTALL_USER}" docker compose -f "${ETC_DIR}/compose.yaml" ps
echo

##########################
# 5) Install the backend binary to /usr/local/bin
##########################
BIN_DST="/usr/local/bin/${BIN_NAME}"
echo "→ Installing binary → ${BIN_DST}"
cp "${BIN_SRC}" "${BIN_DST}"
chown root:root "${BIN_DST}"
chmod 755 "${BIN_DST}"
echo

##########################
# 6) Create the systemd unit (runs as non-root user)
##########################
SERVICE_DST="/etc/systemd/system/backend.service"
echo "→ Writing systemd unit → ${SERVICE_DST}"
cat > "${SERVICE_DST}" << EOF
[Unit]
Description=Web Server Backend Service
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=${INSTALL_USER}
WorkingDirectory=${ETC_DIR}
EnvironmentFile=${ETC_DIR}/.env
ExecStart=/usr/local/bin/backend
Restart=always
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

chown root:root "${SERVICE_DST}"
chmod 644 "${SERVICE_DST}"
echo

##########################
# 7) Reload systemd, enable, and start backend.service
##########################
echo "→ Reloading systemd daemon …"
systemctl daemon-reload

echo "→ Enabling backend.service so it starts on boot …"
systemctl enable backend.service

echo "→ Starting backend.service now …"
systemctl restart backend.service
echo

echo "============================================"
echo "  INSTALLATION COMPLETE!"
echo "  • Check status:   sudo systemctl status backend.service"
echo "  • View logs:      sudo journalctl -u backend.service -b"
echo "  • DB container:   Check postgres via docker-compose ps"
echo "============================================"
echo

exit 0
