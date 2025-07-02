# Remote Labs

## Overview

This project automates the deployment and management of on-premise remote laboratories. It provides:

* A **Web Server** (Go and React) for provisioning VMs, managing users, subjects, and templates.
* A **Server Agent** (Go) that runs on hypervisor nodes to create, start, stop, and delete KVM/QEMU virtual machines using **Cloud-Init** templates.
* A **VMS Manager** (Go) to act as an orchestrator to provide VMs and set up network configuration
* **WireGuard** integration for secure per-VM VPN tunnels.

## Features

* **VM Lifecycle Management:** Create, start, stop, delete instances programmatically.
* **VPN Encryption:** Automatic WireGuard tunnel setup per VM for secure connectivity.
* **User & Course Management:** Role-based access control for administrators, professors, and students.
* **Cloud-Init Support:** Automated VM initialization with user-data scripts.
* **Scalability:** Distributed architecture with server agents on each host and a central API.

## Architecture

```text
+-----------------------+         +----------------------+         +----------------+
|        Web UI         | <-----> |   REST API Backend   | <-----> | PostgreSQL DB  |
| (web-server/frontend) |         | (web-server/backend) |         |                |
|                       |         +----------------------+         +----------------+
+-----------------------+                    ^
                                             |
                                             v
+-----------------+               +----------------------+         +----------------+
|                 | <-----------> |     VMS Manager      | <-----> | PostgreSQL DB  |
| Mikrotik Router |               |    (vms-manager)     |         |                |
|                 |               +----------------------+         +----------------+ 
+-----------------+                          ^
        ^                                    |
        |                                    |
        | Wireguard                          |
        |                                    |
        v                                    v
 +-------------+                  +----------------------+
|  KVM/QEMU    |<-----------------|    Server Agent(s)   |
|    Hosts     |                  |    (server-agent)    |
+--------------+                  +----------------------+                         
```

## Installation

### Prerequisites

* Linux host with **KVM/QEMU** support, **Systemd**, **Go** (for building server-agent) and the following libraries: libvirt-daemon-system virtinst genisoimage
* Router with **RouterOS** 
* **Docker & Docker Compose**
* A **Cloud-Init Image** (e.g. [Debian12](https://cloud.debian.org/images/cloud/bookworm/latest/debian-12-generic-amd64.qcow2))

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/remote-vms-deployment.git
cd remote-vms-deployment-main
```

### 2. Configure Server Agent

1. Copy and fill `.env.template`:

   ```bash
   cp server-agent/.env.template server-agent/.env
   # Edit server-agent/.env to match your environment
   ```

2. Put your cloud-init image in your CLOUD_INIT_IMAGES_PATH from the previous .env
   
3. Run installer on each hypervisor node:

   ```bash
   cd server-agent
   sudo ./install.sh
   ```

### 3. Deploy VMS Manager

1. Copy and fill `.env.template`:

   ```bash
   cp vms-manager/.env.template vms-manager/.env
   # Edit vms-manager/.env to match your environment
   ```
2. Run VMS Manager containers:

   ```bash
   docker compose up -d
   ```

### 3. Deploy Web Server

1. Copy and fill `.env.template`:

   ```bash
   cp web-server/.env.template web-server/.env
   # Edit web-server/.env to match your environment
   ```
2. Run VMS Manager containers:

   ```bash
   docker compose up -d
   ```

## Contributing

Contributions are welcome! Please:

1. Fork the repo.
2. Create a feature branch: `git checkout -b feature/my-feature`.
3. Commit your changes: `git commit -m 'Add some feature'`.
4. Push to branch: `git push origin feature/my-feature`.
5. Open a Pull Request.

## License

This project is licensed under the **GNU Affero General Public License v3.0**. See the [LICENSE](LICENSE) file for details.

## Contact

For questions or support, contact the project maintainer at `ajuanolat@gmail.com`.

## Authors

**VMS Manager & Server Agent:** Aitor Juanola

**Web Server:** Julen Rodríguez

**GitHub:** 

[github.com/ajutra](https://github.com/ajutra)

[github.com/JulenRM10](https://github.com/JulenRM10)
