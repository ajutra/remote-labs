package main

import (
	"fmt"
	"log"
	"os/exec"
	"strings"
	"sync"
)

var cloneMutex sync.Mutex

func CloneVM(originalVmName string, newVmName string) error {
	if err := checkIfVmIsStopped(originalVmName); err != nil {
		return err
	}

	cloneMutex.Lock()
	defer cloneMutex.Unlock()

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
		return err
	}

	log.Printf("virt-clone output: %s", output)

	return nil
}

func checkIfVmIsStopped(vmName string) error {
	cmd := exec.Command(
		"bash", "-c",
		"virsh", "list", "--all",
		"|", "grep", vmName,
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return err
	}

	if !strings.Contains(string(output), "shut off") {
		return fmt.Errorf("VM %s must be stopped before cloning", vmName)
	}

	return nil
}
