#!/usr/bin/env bash
#===============================================================================
# install.sh
#
# This script installs the "server-agent" binary, its environment file, and the
# systemd service unit so that the server-agent runs as a root service on Debian 12.
#
# You need to give execution permissions to this script:
#   sudo chmod +x install.sh
#
# Usage:
#   sudo ./install.sh
#
# Prerequisites:
#   - You have built "server-agent" and it is in the current directory.
#   - You have a ".env" file in the current directory formatted as KEY=value pairs.
#   - You have "server-agent.service" in the current directory (the unit file).
#
# Steps performed:
#   1. Create target directories if missing
#   2. Copy "server-agent" to /usr/local/bin, chown to root, chmod 755
#   3. Copy ".env" to /etc/server-agent/.env, chown to root, chmod 644
#   4. Copy "server-agent.service" to /etc/systemd/system/, chown to root, chmod 644
#   5. systemctl daemon-reload; enable and start server-agent.service
#===============================================================================

set -euo pipefail

# 1. Define variables for paths
BIN_NAME="server-agent"
BIN_SRC="./${BIN_NAME}"
BIN_DST="/usr/local/bin/${BIN_NAME}"

ENV_DIR="/etc/server-agent"
ENV_SRC="./.env"
ENV_DST="${ENV_DIR}/.env"

SERVICE_NAME="server-agent.service"
SERVICE_SRC="./${SERVICE_NAME}"
SERVICE_DST="/etc/systemd/system/${SERVICE_NAME}"

# 2. Check existence of source files
echo "Checking for required files..."
if [[ ! -f "${BIN_SRC}" ]]; then
  echo "Error: Binary '${BIN_SRC}' not found in current directory."
  exit 1
fi

if [[ ! -f "${ENV_SRC}" ]]; then
  echo "Error: Environment file '${ENV_SRC}' not found in current directory."
  exit 1
fi

if [[ ! -f "${SERVICE_SRC}" ]]; then
  echo "Error: Service file '${SERVICE_SRC}' not found in current directory."
  exit 1
fi

# 3. Create /usr/local/bin if it doesn't exist (it almost always does)
echo "Ensuring /usr/local/bin exists..."
mkdir -p /usr/local/bin
chmod 755 /usr/local/bin

# 4. Copy the binary
echo "Installing binary to ${BIN_DST}..."
cp "${BIN_SRC}" "${BIN_DST}"
chown root:root "${BIN_DST}"
chmod 755 "${BIN_DST}"

# 5. Create /etc/server-agent and copy .env
echo "Creating environment directory at ${ENV_DIR}..."
mkdir -p "${ENV_DIR}"
chmod 755 "${ENV_DIR}"

echo "Installing .env file to ${ENV_DST}..."
cp "${ENV_SRC}" "${ENV_DST}"
chown root:root "${ENV_DST}"
chmod 644 "${ENV_DST}"

# 6. Copy the systemd service file
echo "Installing systemd unit to ${SERVICE_DST}..."
cp "${SERVICE_SRC}" "${SERVICE_DST}"
chown root:root "${SERVICE_DST}"
chmod 644 "${SERVICE_DST}"

# 7. Reload systemd, enable, and start service
echo "Reloading systemd daemon..."
systemctl daemon-reload

echo "Enabling service '${SERVICE_NAME}' to start on boot..."
systemctl enable "${SERVICE_NAME}"

echo "Starting service '${SERVICE_NAME}' now..."
systemctl start "${SERVICE_NAME}"

echo "Installation complete."
echo "You can check status with: systemctl status ${SERVICE_NAME}"
