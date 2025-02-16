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
}

type VmManagerImpl struct{}

var (
	mutexMap = make(map[string]*sync.Mutex)
	mutex    sync.Mutex
)

func (manager *VmManagerImpl) CloneVM(originalVmName string, newVmName string) error {
	if err := checkIfVmIsStopped(originalVmName); err != nil {
		return err
	}

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
		return fmt.Errorf("Error cloning VM %s: %s", originalVmName, string(output))
	}

	log.Printf("virt-clone output: %s", output)

	return nil
}

func checkIfVmIsStopped(vmName string) error {
	cmd := exec.Command(
		"bash", "-c",
		"virsh list --all | grep "+vmName,
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return fmt.Errorf("Error checking if VM %s is stopped: %s", vmName, string(output))
	}

	if !strings.Contains(string(output), "shut off") {
		return fmt.Errorf("VM %s must be stopped before cloning", vmName)
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

func NewVmManager() VmManager {
	return &VmManagerImpl{}
}
