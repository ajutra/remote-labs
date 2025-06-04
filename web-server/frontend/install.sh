#!/usr/bin/env bash
#===============================================================================
# install-frontend.sh
#
# This script will:
#   1) Detect the non-root user invoking sudo
#   2) Create a Bash-based wrapper (/home/<user>/bin/npm-dev.sh) that:
#        • Exports NVM_DIR and sources nvm.sh from ~/.nvm
#        • Executes `npm run dev` (no `cd`)
#   3) Make that wrapper executable
#   4) Create a systemd service (`frontend-dev.service`) that:
#        • Uses WorkingDirectory=<current directory>
#        • ExecStart calls the wrapper
#   5) Reload systemd, enable the service at boot, and start it immediately
#
# Requirements:
#   • You must have Node and npm installed via nvm under ~/.nvm for your user.
#   • This script must be run with sudo.
#
# Usage:
#   cd /path/to/your/frontend      # wherever your package.json lives
#   sudo chmod +x install.sh
#   sudo ./install.sh
#===============================================================================

set -euo pipefail

##########################
# 1) Detect the non-root user
##########################
if [[ -n "${SUDO_USER:-}" && "${SUDO_USER}" != "root" ]]; then
  INSTALL_USER="${SUDO_USER}"
else
  INSTALL_USER="${USER}"
fi

# Capture whatever directory this script is run from:
FRONTEND_DIR="$(pwd)"
WRAPPER_DIR="/home/${INSTALL_USER}/bin"
WRAPPER_PATH="${WRAPPER_DIR}/npm-dev.sh"
SERVICE_NAME="frontend-dev.service"
SERVICE_PATH="/etc/systemd/system/${SERVICE_NAME}"

echo
echo "============================================"
echo " Installing frontend service as user: ${INSTALL_USER}"
echo " Directory: ${FRONTEND_DIR}"
echo "============================================"
echo

##########################
# 2) Create ~/bin/npm-dev.sh wrapper (Bash)
##########################
echo "→ Ensuring wrapper directory exists: ${WRAPPER_DIR}"
sudo -u "${INSTALL_USER}" mkdir -p "${WRAPPER_DIR}"

echo "→ Writing Bash wrapper script to ${WRAPPER_PATH}"
# Use an unquoted here‐doc so variables inside EOF are literal until expanded above.
sudo tee "${WRAPPER_PATH}" > /dev/null <<'EOF'
#!/usr/bin/env bash
#
# npm-dev.sh -- Bash wrapper to load NVM and run `npm run dev`.
#
# This script does NOT change directory; systemd's WorkingDirectory takes care of that.

export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
else
  echo "✗ ERROR: Cannot find nvm.sh in \$NVM_DIR (make sure nvm is installed)." >&2
  exit 1
fi

# npm is now on PATH. Run Vite dev server:
exec npm run dev
EOF

echo "→ Making wrapper executable"
sudo chown "${INSTALL_USER}:${INSTALL_USER}" "${WRAPPER_PATH}"
sudo chmod 755 "${WRAPPER_PATH}"
echo "✓ Wrapper created and made executable."
echo

##########################
# 3) Create the systemd service unit file
##########################
echo "→ Creating systemd service at ${SERVICE_PATH}"
sudo tee "${SERVICE_PATH}" > /dev/null <<EOF
[Unit]
Description=Frontend Dev Server (npm run dev)
After=network.target

[Service]
Type=simple
User=${INSTALL_USER}
# Use the directory where install.sh was run:
WorkingDirectory=${FRONTEND_DIR}
# ExecStart calls our Bash wrapper, which loads NVM and runs `npm run dev`
ExecStart=${WRAPPER_PATH}
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

echo "→ Setting permissions on service file"
sudo chmod 644 "${SERVICE_PATH}"
sudo chown root:root "${SERVICE_PATH}"
echo "✓ Service file written to ${SERVICE_PATH}."
echo

##########################
# 4) Reload systemd, enable and start the service
##########################
echo "→ Reloading systemd daemon"
sudo systemctl daemon-reload

echo "→ Enabling ${SERVICE_NAME} to start on boot"
sudo systemctl enable "${SERVICE_NAME}"

echo "→ Starting ${SERVICE_NAME} now"
sudo systemctl restart "${SERVICE_NAME}"
echo

echo "============================================"
echo "  FRONTEND SERVICE INSTALLED SUCCESSFULLY!"
echo "  • Status:   sudo systemctl status ${SERVICE_NAME}"
echo "  • Logs:     sudo journalctl -u ${SERVICE_NAME} -b"
echo "============================================"
echo

exit 0

