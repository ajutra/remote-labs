#!/usr/bin/env bash
#===============================================================================
# install.sh
#
# Installs and configures the "server-agent" service on Debian 12 (systemd) as root.
#
# This script will:
#   1) Verify that the following files exist in the current directory:
#        • server-agent           (compiled Go binary)
#        • .env                   (environment file for the service)
#   2) Create /etc/server-agent and copy .env there
#   3) Copy the server-agent binary into /usr/local/bin and set ownership/permissions
#   4) Generate the systemd unit file at /etc/systemd/system/server-agent.service
#        • Sets WorkingDirectory=/etc/server-agent so the binary’s open(".env") finds /etc/server-agent/.env
#        • Runs as root (default)
#   5) Reload systemd, enable the service to start on boot, and start it immediately
#
# Usage:
#   sudo chmod +x install.sh
#   sudo ./install.sh
#
# Notes:
#   • The “server-agent” binary attempts open(".env"), so we set WorkingDirectory=/etc/server-agent.
#   • All files under /etc/server-agent and /etc/systemd/system are owned by root:root.
#===============================================================================
set -euo pipefail

echo
echo "=============================================="
echo "   Installing server-agent Service (Debian 12) "
echo "=============================================="
echo

#---------------------------------------------------------------------
# 1) Verify required source files in the working directory
#---------------------------------------------------------------------
SRC_DIR="$(pwd)"
BIN_NAME="server-agent"
BIN_SRC="${SRC_DIR}/${BIN_NAME}"
ENV_SRC="${SRC_DIR}/.env"

echo "→ Verifying required files exist..."
for path in "${BIN_SRC}" "${ENV_SRC}"; do
  if [[ ! -f "${path}" ]]; then
    echo "  ✗ ERROR: File not found: ${path}"
    echo "      Please copy the following into this directory before running:"
    echo "        • ${BIN_NAME}     (compiled Go binary)"
    echo "        • .env            (service environment file)"
    exit 1
  else
    echo "  ✓ Found: $(basename "${path}")"
  fi
done
echo

#---------------------------------------------------------------------
# 2) Create /etc/server-agent and copy .env
#---------------------------------------------------------------------
ETC_DIR="/etc/server-agent"
echo "→ Creating directory ${ETC_DIR} (if needed)..."
mkdir -p "${ETC_DIR}"
chmod 755 "${ETC_DIR}"
echo "   • Directory: ${ETC_DIR} (mode 755, owned by root)"
echo

echo "→ Copying .env → ${ETC_DIR}/.env"
cp "${ENV_SRC}" "${ETC_DIR}/.env"
chown root:root "${ETC_DIR}/.env"
chmod 644 "${ETC_DIR}/.env"
echo "   • /etc/server-agent/.env (mode 644, owned by root)"
echo

#---------------------------------------------------------------------
# 3) Copy the server-agent binary to /usr/local/bin
#---------------------------------------------------------------------
BIN_DST="/usr/local/bin/${BIN_NAME}"
echo "→ Installing binary: ${BIN_NAME} → ${BIN_DST}"
cp "${BIN_SRC}" "${BIN_DST}"
chown root:root "${BIN_DST}"
chmod 755 "${BIN_DST}"
echo "   • ${BIN_DST} (mode 755, owned by root)"
echo

#---------------------------------------------------------------------
# 4) Generate the systemd service unit file
#---------------------------------------------------------------------
SERVICE_DST="/etc/systemd/system/server-agent.service"
echo "→ Creating systemd unit: ${SERVICE_DST}"
cat > "${SERVICE_DST}" << 'EOF'
[Unit]
Description=Server Agent Service
After=network.target
[Service]
WorkingDirectory=/etc/server-agent
ExecStart=/usr/local/bin/server-agent
Restart=always
RestartSec=5s
[Install]
WantedBy=multi-user.target
EOF

chown root:root "${SERVICE_DST}"
chmod 644 "${SERVICE_DST}"
echo "   • ${SERVICE_DST} (mode 644, owned by root)"
echo

#---------------------------------------------------------------------
# 5) Reload systemd, enable & start the server-agent.service
#---------------------------------------------------------------------
echo "→ Reloading systemd daemon so it picks up the new unit..."
systemctl daemon-reload
echo "   • systemd daemon reloaded"
echo

echo "→ Enabling server-agent.service to start on boot..."
systemctl enable server-agent.service
echo "   • server-agent.service enabled"
echo

echo "→ Starting (or restarting) server-agent.service now..."
systemctl restart server-agent.service
echo "   • server-agent.service restarted"
echo

#---------------------------------------------------------------------
# 6) Final status messages
#---------------------------------------------------------------------
echo "=============================================="
echo "    server-agent Installation Complete         "
echo "=============================================="
echo
echo " • To check service status:   sudo systemctl status server-agent.service"
echo " • To view logs:              sudo journalctl -u server-agent.service -b"
echo " • Files installed under:"
echo "     /etc/server-agent      (.env)"
echo "     /usr/local/bin/${BIN_NAME}"
echo "     /etc/systemd/system/server-agent.service"
echo
echo "Your server-agent should now be running as a root service."
echo

exit 0