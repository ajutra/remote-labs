package main

import (
	"fmt"
	"log"
	"os/exec"
	"strings"
)

type ServerAgent interface {
	CloneVM(baseVmId string, newVmId string) error
	DeleteVM(vmId string) error
	StartVM(vmId string) error
	StopVM(vmId string) error
	RestartVM(vmId string) error
	ForceStopVM(vmId string) error
	ListVMsStatus() ([]ListVMsStatusResponse, error)
}

type ServerAgentImpl struct{}

func (agent *ServerAgentImpl) CloneVM(baseVmId string, newVmId string) error {
	log.Printf("Cloning VM '%s' to '%s'...", baseVmId, newVmId)

	cmd := exec.Command(
		"virt-clone",
		"--connect", "qemu:///system",
		"--original", baseVmId,
		"--name", newVmId,
		"--file", "/var/lib/libvirt/images/"+newVmId+".qcow2",
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return logAndReturnError("Error cloning VM '"+baseVmId+"' to '"+newVmId+"': ", string(output))
	}

	log.Printf("Cloned VM '%s' to '%s' successfully!", baseVmId, newVmId)

	return nil
}

func (agent *ServerAgentImpl) DeleteVM(vmId string) error {
	log.Printf("Deleting VM '%s'...", vmId)

	cmd := exec.Command(
		"virsh", "undefine", vmId, "--remove-all-storage",
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return logAndReturnError("Error deleting VM '"+vmId+"': ", string(output))
	}

	log.Printf("Deleted VM '%s' successfully!", vmId)

	return nil
}

func (agent *ServerAgentImpl) StartVM(vmId string) error {
	log.Printf("Starting VM '%s'...", vmId)

	cmd := exec.Command(
		"virsh", "start", vmId,
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return logAndReturnError("Error starting VM '"+vmId+"': ", string(output))
	}

	log.Printf("Started VM '%s' successfully!", vmId)

	return nil
}

func (agent *ServerAgentImpl) StopVM(vmId string) error {
	log.Printf("Stopping VM '%s'...", vmId)

	cmd := exec.Command(
		"virsh", "shutdown", vmId,
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return logAndReturnError("Error stopping VM '"+vmId+"': ", string(output))
	}

	log.Printf("Stopped VM '%s' successfully!", vmId)

	return nil
}

func (agent *ServerAgentImpl) RestartVM(vmId string) error {
	log.Printf("Restarting VM '%s'...", vmId)

	cmd := exec.Command(
		"virsh", "reboot", vmId,
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return logAndReturnError("Error restarting VM '"+vmId+"': ", string(output))
	}

	log.Printf("Restarted VM '%s' successfully!", vmId)

	return nil
}

func (agent *ServerAgentImpl) ForceStopVM(vmId string) error {
	log.Printf("Force stopping VM '%s'...", vmId)

	cmd := exec.Command(
		"virsh", "destroy", vmId,
	)

	output, err := cmd.CombinedOutput()

	if err != nil {
		return logAndReturnError("Error force stopping VM '"+vmId+"': ", string(output))
	}

	log.Printf("Force stopped VM '%s' successfully!", vmId)

	return nil
}

func (agent *ServerAgentImpl) ListVMsStatus() ([]ListVMsStatusResponse, error) {
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
		if len(fields) == 3 && fields[0] != "Id" {
			vmStatusMap[fields[1]] = fields[2]
		} else if len(fields) > 3 && fields[0] != "Id" {
			vmStatusMap[fields[1]] = fields[2] + " " + fields[3]
		}
	}

	log.Printf("VMs status:")
	for vmName, status := range vmStatusMap {
		log.Printf("%s: %s", vmName, status)
	}

	return toVMsStatusResponse(vmStatusMap), nil
}

func toVMsStatusResponse(vmStatusMap map[string]string) []ListVMsStatusResponse {
	response := []ListVMsStatusResponse{}
	for vmName, status := range vmStatusMap {
		response = append(response, ListVMsStatusResponse{VmId: vmName, Status: status})
	}
	return response
}

func logAndReturnError(customMsg string, err string) error {
	err = strings.TrimPrefix(err, "error")
	err = strings.TrimPrefix(err, "ERROR")
	err = strings.TrimPrefix(err, ":")
	err = strings.TrimSpace(err)
	log.Printf("%s%s", customMsg, err)
	return fmt.Errorf("%s%s", customMsg, err)
}

func NewServerAgent() ServerAgent {
	return &ServerAgentImpl{}
}
