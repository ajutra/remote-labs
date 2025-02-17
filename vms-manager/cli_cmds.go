package main

import (
	"fmt"
	"log"
	"os/exec"
	"strings"
	"sync"
)

type VmManager interface {
	CloneVM(originalVmName string, newVmName string) error
	DeleteVM(vmName string) error
	StartVM(vmName string) error
	StopVM(vmName string) error
	RestartVM(vmName string) error
	ForceStopVM(vmName string) error
	ListVMsStatus() (map[string]string, error)
}

type VmManagerImpl struct{}

var (
	mutexMap = make(map[string]*sync.Mutex)
	mutex    sync.Mutex
)

func (manager *VmManagerImpl) CloneVM(originalVmName string, newVmName string) error {
	vmMutex := getMutex(originalVmName)
	vmMutex.Lock()
	defer vmMutex.Unlock()

	log.Printf("Cloning VM '%s' to '%s'...", originalVmName, newVmName)

	cmd := exec.Command(
		"virt-clone",
		"--connect", "qemu:///system",
		"--original", originalVmName,
		"--name", newVmName,
		"--file", "/var/lib/libvirt/images/"+newVmName+".qcow2",
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return logAndReturnError(
			"Error cloning VM '"+originalVmName+"' to '"+newVmName+"': ", string(output))
	}

	log.Printf("Cloned VM '%s' to '%s' successfully!", originalVmName, newVmName)

	return nil
}

func (manager *VmManagerImpl) DeleteVM(vmName string) error {
	vmMutex := getMutex(vmName)
	vmMutex.Lock()
	defer vmMutex.Unlock()

	log.Printf("Deleting VM '%s'...", vmName)

	cmd := exec.Command(
		"virsh", "undefine", vmName, "--remove-all-storage",
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return logAndReturnError("Error deleting VM '"+vmName+"': ", string(output))
	}

	log.Printf("Deleted VM '%s' successfully!", vmName)

	return nil
}

func (manager *VmManagerImpl) StartVM(vmName string) error {
	vmMutex := getMutex(vmName)
	vmMutex.Lock()
	defer vmMutex.Unlock()

	log.Printf("Starting VM '%s'...", vmName)

	cmd := exec.Command(
		"virsh", "start", vmName,
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return logAndReturnError("Error starting VM '"+vmName+"': ", string(output))
	}

	log.Printf("Started VM '%s' successfully!", vmName)

	return nil
}

func (manager *VmManagerImpl) StopVM(vmName string) error {
	vmMutex := getMutex(vmName)
	vmMutex.Lock()
	defer vmMutex.Unlock()

	log.Printf("Stopping VM '%s'...", vmName)

	cmd := exec.Command(
		"virsh", "shutdown", vmName,
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return logAndReturnError("", string(output))
	}

	log.Printf("Stopped VM '%s' successfully!", vmName)

	return nil
}

func (manager *VmManagerImpl) RestartVM(vmName string) error {
	vmMutex := getMutex(vmName)
	vmMutex.Lock()
	defer vmMutex.Unlock()

	log.Printf("Restarting VM '%s'...", vmName)

	cmd := exec.Command(
		"virsh", "reboot", vmName,
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return logAndReturnError("", string(output))
	}

	log.Printf("Restarted VM '%s' successfully!", vmName)

	return nil
}

func (manager *VmManagerImpl) ForceStopVM(vmName string) error {
	vmMutex := getMutex(vmName)
	vmMutex.Lock()
	defer vmMutex.Unlock()

	log.Printf("Force stopping VM '%s'...", vmName)

	cmd := exec.Command(
		"virsh", "destroy", vmName,
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return logAndReturnError("", string(output))
	}

	log.Printf("Force stopped VM '%s' successfully!", vmName)

	return nil
}

func (manager *VmManagerImpl) ListVMsStatus() (map[string]string, error) {
	log.Printf("Getting VMs status...")

	cmd := exec.Command(
		"virsh", "list", "--all",
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return nil, logAndReturnError("", string(output))
	}

	lines := strings.Split(string(output), "\n")
	vmStatusMap := make(map[string]string)

	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) >= 3 && fields[0] != "Id" {
			vmStatusMap[fields[1]] = fields[2]
			if len(fields) > 3 {
				vmStatusMap[fields[1]] += " " + fields[3]
			}
		}
	}

	log.Printf("VMs status:")
	for vmName, status := range vmStatusMap {
		log.Printf("%s: %s", vmName, status)
	}

	return vmStatusMap, nil
}

func getMutex(vmName string) *sync.Mutex {
	mutex.Lock()
	defer mutex.Unlock()

	if mutexMap[vmName] == nil {
		mutexMap[vmName] = &sync.Mutex{}
	}

	return mutexMap[vmName]
}

func logAndReturnError(customMsg string, err string) error {
	err = strings.TrimPrefix(err, "error")
	err = strings.TrimPrefix(err, "ERROR")
	err = strings.TrimPrefix(err, ":")
	err = strings.TrimSpace(err)
	log.Printf("%s%s", customMsg, err)
	return fmt.Errorf("%s%s", customMsg, err)
}

func NewVmManager() VmManager {
	return &VmManagerImpl{}
}
