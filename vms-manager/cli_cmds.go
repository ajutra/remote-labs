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

	log.Printf("Cloning VM %s to %s", originalVmName, newVmName)

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
			"Error cloning VM "+originalVmName+" into "+newVmName+": ", string(output))
	}

	log.Printf("Cloned VM %s to %s successfully", originalVmName, newVmName)

	return nil
}

func (manager *VmManagerImpl) DeleteVM(vmName string) error {
	vmMutex := getMutex(vmName)
	vmMutex.Lock()
	defer vmMutex.Unlock()

	cmd := exec.Command(
		"virsh", "undefine", vmName, "--remove-all-storage",
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return logAndReturnError("Error deleting VM "+vmName+": ", string(output))
	}

	return nil
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
