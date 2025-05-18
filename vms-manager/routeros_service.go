package main

import (
	"fmt"
	"log"
	"strconv"
	"strings"
	"sync"

	"github.com/go-routeros/routeros/v3"
)

type RouterOSService interface {
	Close()
	RemoveRoute(dst, gateway, table string) (response *routeros.Reply, err error)
	ApplyVlanConfig(
		vlan int,
		vlanPort int,
		vlanBridge string,
		taggedBridges []string,
		externalGateway string,
		gatewaySubnetMask int,
	) error
	RemoveVlanConfig(
		vlan int,
		vlanPort int,
		vlanBridge string,
		externalGateway string,
		gatewaySubnetMask int,
	) error
	ApplyVmConfig(vmNetworkConfig VmNetworkConfig, vlan int, userPubKey string)
	RemoveVmConfig(vlan int, vlanIdentifier int)
	GetWireguardPublicKey(name string) (string, error)
}

type RouterOSServiceImpl struct {
	client *routeros.Client
	mutex  sync.Mutex
}

func NewRouterOSService(addr, user, pass string) (RouterOSService, error) {
	c, err := routeros.Dial(addr, user, pass)
	if err != nil {
		return nil, err
	}
	return &RouterOSServiceImpl{client: c, mutex: sync.Mutex{}}, nil
}

func (s *RouterOSServiceImpl) Close() { s.client.Close() }

func (s *RouterOSServiceImpl) ApplyVlanConfig(
	vlan int,
	vlanPort int,
	vlanBridge string,
	taggedBridges []string,
	externalGateway string,
	gatewaySubnetMask int,
) error {
	if _, err := s.addWireguard(
		fmt.Sprintf("VPN%d", vlan),
		vlanPort,
		1420,
		fmt.Sprintf("wireguard%d", vlan),
	); err != nil {
		return err
	}

	if _, err := s.addVlan(
		fmt.Sprintf("VLAN%d", vlan),
		vlanBridge,
		fmt.Sprintf("vlan%d", vlan),
		vlan,
	); err != nil {
		return err
	}

	if _, err := s.addInterfaceList(
		fmt.Sprintf("VRF%d", vlan),
	); err != nil {
		return err
	}

	if _, err := s.addVrf(
		fmt.Sprintf("VRF%d", vlan),
		fmt.Sprintf("vrf%d", vlan),
		fmt.Sprintf("vlan%d", vlan),
		fmt.Sprintf("wireguard%d", vlan),
	); err != nil {
		return err
	}

	if _, err := s.addBridgeVlan(
		vlanBridge,
		fmt.Sprintf("VLAN%d", vlan),
		vlan,
		taggedBridges...,
	); err != nil {
		return err
	}

	if _, err := s.addListMember(
		fmt.Sprintf("VRF%d", vlan),
		fmt.Sprintf("vlan%d", vlan),
		fmt.Sprintf("VRF%d", vlan),
	); err != nil {
		return err
	}

	if _, err := s.addListMember(
		fmt.Sprintf("VRF%d", vlan),
		fmt.Sprintf("wireguard%d", vlan),
		fmt.Sprintf("VRF%d", vlan),
	); err != nil {
		return err
	}

	if _, err := s.addIPAddress(
		fmt.Sprintf("%s/%d", getVlanGatewayIp(vlan), gatewaySubnetMask),
		fmt.Sprintf("VLAN%d", vlan),
		fmt.Sprintf("vlan%d", vlan),
	); err != nil {
		return err
	}

	if _, err := s.addIPAddress(
		fmt.Sprintf("%s/%d", getVpnGatewayIp(vlan), gatewaySubnetMask),
		fmt.Sprintf("VPN%d", vlan),
		fmt.Sprintf("wireguard%d", vlan),
	); err != nil {
		return err
	}

	if _, err := s.addFirewallFilter(
		"accept",
		"input",
		"defconf: accept from WAN for Wireguard",
		map[string]string{
			"dst-port":          strconv.Itoa(vlanPort),
			"in-interface-list": "WAN",
			"protocol":          "udp",
		},
	); err != nil {
		return err
	}

	if _, err := s.addFirewallFilter(
		"accept",
		"forward",
		fmt.Sprintf("defconf: accept from VRF%d to WAN", vlan),
		map[string]string{
			"in-interface-list":  fmt.Sprintf("VRF%d", vlan),
			"out-interface-list": "WAN",
		},
	); err != nil {
		return err
	}

	if _, err := s.addFirewallFilter(
		"accept",
		"forward",
		fmt.Sprintf("defconf: accept from VRF%d to VRF%d", vlan, vlan),
		map[string]string{
			"in-interface-list":  fmt.Sprintf("VRF%d", vlan),
			"out-interface-list": fmt.Sprintf("VRF%d", vlan),
		},
	); err != nil {
		return err
	}

	if _, err := s.addRoutingTable(fmt.Sprintf("vrf%d", vlan)); err != nil {
		return err
	}

	if _, err := s.addRoute(
		getVlanNetworkIpWithSubnet(vlan),
		fmt.Sprintf("vlan%d@vrf%d", vlan, vlan),
		"main",
	); err != nil {
		return err
	}

	if _, err := s.addRoute(
		"0.0.0.0/0",
		externalGateway+"@main",
		fmt.Sprintf("vrf%d", vlan),
	); err != nil {
		return err
	}

	return nil
}

func (s *RouterOSServiceImpl) RemoveVlanConfig(
	vlan int,
	vlanPort int,
	vlanBridge string,
	externalGateway string,
	gatewaySubnetMask int,
) error {
	log.Println("Removing vlan config...")
	if _, err := s.RemoveRoute(
		"0.0.0.0/0",
		externalGateway,
		fmt.Sprintf("vrf%d", vlan),
	); err != nil {
		log.Println("Error removing route: ", err.Error())
	}

	if _, err := s.RemoveRoute(
		getVlanNetworkIpWithSubnet(vlan),
		fmt.Sprintf("vlan%d@vrf%d", vlan, vlan),
		"main",
	); err != nil {
		log.Println("Error removing route: ", err.Error())
	}

	if _, err := s.removeFirewallFilter(
		map[string]string{
			"action":             "accept",
			"chain":              "forward",
			"in-interface-list":  fmt.Sprintf("VRF%d", vlan),
			"out-interface-list": fmt.Sprintf("VRF%d", vlan),
		},
	); err != nil {
		log.Println("Error removing firewall filter: ", err.Error())
	}

	if _, err := s.removeFirewallFilter(
		map[string]string{
			"action":             "accept",
			"chain":              "forward",
			"in-interface-list":  fmt.Sprintf("VRF%d", vlan),
			"out-interface-list": "WAN",
		},
	); err != nil {
		log.Println("Error removing firewall filter: ", err.Error())
	}

	if _, err := s.removeFirewallFilter(
		map[string]string{
			"action":            "accept",
			"chain":             "input",
			"dst-port":          strconv.Itoa(vlanPort),
			"in-interface-list": "WAN",
			"protocol":          "udp",
		},
	); err != nil {
		log.Println("Error removing firewall filter: ", err.Error())
	}

	if _, err := s.removeIPAddress(
		fmt.Sprintf("%s/%d", getVpnGatewayIp(vlan), gatewaySubnetMask),
		fmt.Sprintf("wireguard%d", vlan),
	); err != nil {
		log.Println("Error removing ip address: ", err.Error())
	}

	if _, err := s.removeIPAddress(
		fmt.Sprintf("%s/%d", getVlanGatewayIp(vlan), gatewaySubnetMask),
		fmt.Sprintf("vlan%d", vlan),
	); err != nil {
		log.Println("Error removing ip address: ", err.Error())
	}

	if _, err := s.removeListMember(fmt.Sprintf("VRF%d", vlan), fmt.Sprintf("wireguard%d", vlan)); err != nil {
		log.Println("Error removing list member: ", err.Error())
	}

	if _, err := s.removeListMember(fmt.Sprintf("VRF%d", vlan), fmt.Sprintf("vlan%d", vlan)); err != nil {
		log.Println("Error removing list member: ", err.Error())
	}

	if _, err := s.removeBridgeVlan(vlanBridge, vlan); err != nil {
		log.Println("Error removing bridge vlan: ", err.Error())
	}

	if _, err := s.removeVrf(fmt.Sprintf("vrf%d", vlan)); err != nil {
		log.Println("Error removing vrf: ", err.Error())
	}

	if _, err := s.removeInterfaceList(fmt.Sprintf("VRF%d", vlan)); err != nil {
		log.Println("Error removing interface list: ", err.Error())
	}

	if _, err := s.removeVlan(fmt.Sprintf("vlan%d", vlan)); err != nil {
		log.Println("Error removing vlan: ", err.Error())
	}

	if _, err := s.removeWireguard(fmt.Sprintf("wireguard%d", vlan)); err != nil {
		log.Println("Error removing wireguard: ", err.Error())
	}

	if _, err := s.removeRoutingTable(fmt.Sprintf("vrf%d", vlan)); err != nil {
		log.Println("Error removing routing table: ", err.Error())
	}

	return nil
}

func (s *RouterOSServiceImpl) ApplyVmConfig(vmNetworkConfig VmNetworkConfig, vlan int, userPubKey string) {
	for {
		if _, err := s.addWireguardPeer(
			fmt.Sprintf("VPN%d", vlan),
			fmt.Sprintf("wireguard%d", vlan),
			fmt.Sprintf("peer%d-%d", vlan, vmNetworkConfig.VmVlanIdentifier),
			userPubKey,
			getNetworkAddressWithSubnet(vmNetworkConfig.IpAddWithSubnet),
			getInterfaceAddressWithSubnet(vmNetworkConfig.IpAddWithSubnet),
		); err != nil {
			log.Println("Error adding wireguard peer: ", err.Error())
			log.Println("Retrying...")
			s.RemoveVmConfig(vlan, vmNetworkConfig.VmVlanIdentifier)
			continue
		}
		break
	}
}

func (s *RouterOSServiceImpl) RemoveVmConfig(vlan int, vlanIdentifier int) {
	if _, err := s.removeWireguardPeer(fmt.Sprintf("peer%d-%d", vlan, vlanIdentifier)); err != nil {
		log.Println("Error removing wireguard peer: ", err.Error())
	}
}

func (s *RouterOSServiceImpl) removeByFilter(cmd string, filter ...string) (response *routeros.Reply, err error) {
	args := []string{
		fmt.Sprintf("%s/print", cmd),
	}

	for _, f := range filter {
		args = append(args, "?"+f)
	}

	args = append(args, "=.proplist=.id")

	findResp, findErr := s.client.RunArgs(args)
	if findErr != nil || len(findResp.Re) == 0 {
		return nil, fmt.Errorf("failed to find %s: %v", filter, findErr)
	}

	id := findResp.Re[0].Map[".id"]

	removeResp, removeErr := s.client.RunArgs([]string{
		fmt.Sprintf("%s/remove", cmd),
		fmt.Sprintf("=.id=%s", id),
	})
	if removeErr != nil {
		return nil, fmt.Errorf("failed to remove %s: %v", filter, removeErr)
	}

	return removeResp, nil
}

/*
func (s *RouterOSServiceImpl) addComment(cmd, comment string, filter ...string) (response *routeros.Reply, err error) {
	args := []string{
		fmt.Sprintf("%s/print", cmd),
	}

	for _, f := range filter {
		args = append(args, "?"+f)
	}

	args = append(args, "=.proplist=.id")

	findResp, findErr := s.client.RunArgs(args)
	if findErr != nil || len(findResp.Re) == 0 {
		return nil, fmt.Errorf("failed to find %s: %v", filter, err)
	}

	id := findResp.Re[0].Map[".id"]

	addCommentResp, addCommentErr := s.client.RunArgs([]string{
		fmt.Sprintf("%s/set", cmd),
		fmt.Sprintf("=.id=%s", id),
		fmt.Sprintf("=comment=%s", comment),
	})
	if addCommentErr != nil {
		return nil, fmt.Errorf("failed to add comment to %s: %v", filter, addCommentErr)
	}

	return addCommentResp, nil
}
*/

func (s *RouterOSServiceImpl) addWireguard(comment string, listenPort, mtu int, name string) (response *routeros.Reply, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	addWireguardResp, addWireguardErr := s.client.RunArgs([]string{
		"/interface/wireguard/add",
		fmt.Sprintf("=name=%s", name),
		fmt.Sprintf("=listen-port=%d", listenPort),
		fmt.Sprintf("=mtu=%d", mtu),
	})
	if addWireguardErr != nil {
		return nil, fmt.Errorf("failed to add wireguard: %v", addWireguardErr)
	}

	/*
		if err := s.addComment("/interface/wireguard", comment, "name="+name); err != nil {
			return err
		}
	*/

	return addWireguardResp, nil
}

func (s *RouterOSServiceImpl) removeWireguard(name string) (response *routeros.Reply, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	return s.removeByFilter("/interface/wireguard", "name="+name)
}

func (s *RouterOSServiceImpl) addVlan(comment string, iface, name string, vlanID int) (response *routeros.Reply, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	args := []string{
		"/interface/vlan/add",
		fmt.Sprintf("=name=%s", name),
		fmt.Sprintf("=interface=%s", iface),
		fmt.Sprintf("=vlan-id=%d", vlanID),
	}

	addVlanResp, addVlanErr := s.client.RunArgs(args)
	if addVlanErr != nil {
		return nil, fmt.Errorf("failed to add vlan: %v", addVlanErr)
	}

	/*
		if err := s.addComment("/interface/vlan", comment, "name="+name); err != nil {
			return err
		}
	*/
	return addVlanResp, nil
}

func (s *RouterOSServiceImpl) removeVlan(name string) (response *routeros.Reply, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	return s.removeByFilter("/interface/vlan", "name="+name)
}

func (s *RouterOSServiceImpl) addInterfaceList(name string) (response *routeros.Reply, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	addInterfaceListResp, addInterfaceListErr := s.client.RunArgs([]string{
		"/interface/list/add",
		fmt.Sprintf("=name=%s", name),
	})
	if addInterfaceListErr != nil {
		return nil, fmt.Errorf("failed to add interface list: %v", addInterfaceListErr)
	}

	return addInterfaceListResp, nil
}

func (s *RouterOSServiceImpl) removeInterfaceList(name string) (response *routeros.Reply, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	return s.removeByFilter("/interface/list", "name="+name)
}

func (s *RouterOSServiceImpl) addVrf(comment string, name string, ifaces ...string) (response *routeros.Reply, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	addVrfResp, addVrfErr := s.client.RunArgs([]string{
		"/ip/vrf/add",
		fmt.Sprintf("=name=%s", name),
		fmt.Sprintf("=interfaces=%s", strings.Join(ifaces, ",")),
	})
	if addVrfErr != nil {
		return nil, fmt.Errorf("failed to add vrf: %v", addVrfErr)
	}

	/*
		if err := s.addComment("/ip/vrf", comment, "name="+name); err != nil {
			return err
		}
	*/
	return addVrfResp, nil
}

func (s *RouterOSServiceImpl) removeVrf(name string) (response *routeros.Reply, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	return s.removeByFilter("/ip/vrf", "name="+name)
}

func (s *RouterOSServiceImpl) addBridgeVlan(bridge, comment string, vlanID int, tagged ...string) (response *routeros.Reply, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	args := []string{
		"/interface/bridge/vlan/add",
		fmt.Sprintf("=bridge=%s", bridge),
		fmt.Sprintf("=vlan-ids=%d", vlanID),
		fmt.Sprintf("=tagged=%s", strings.Join(tagged, ",")),
	}

	addBridgeVlanResp, addBridgeVlanErr := s.client.RunArgs(args)
	if addBridgeVlanErr != nil {
		return nil, fmt.Errorf("failed to add bridge vlan: %v", addBridgeVlanErr)
	}

	/*
		if err := s.addComment("/interface/bridge/vlan", comment, "vlan-ids="+strconv.Itoa(vlanID)); err != nil {
			return err
		}
	*/
	return addBridgeVlanResp, nil
}

func (s *RouterOSServiceImpl) removeBridgeVlan(bridge string, vlanID int) (response *routeros.Reply, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	return s.removeByFilter(
		"/interface/bridge/vlan",
		"bridge="+bridge,
		"vlan-ids="+strconv.Itoa(vlanID),
	)
}

func (s *RouterOSServiceImpl) addListMember(comment, iface, list string) (response *routeros.Reply, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	args := []string{
		"/interface/list/member/add",
		fmt.Sprintf("=list=%s", list),
		fmt.Sprintf("=interface=%s", iface),
	}

	addListMemberResp, addListMemberErr := s.client.RunArgs(args)
	if addListMemberErr != nil {
		return nil, fmt.Errorf("failed to add list member: %v", addListMemberErr)
	}

	/*
		if err := s.addComment(
			"/interface/list/member",
			comment,
			"list="+list,
			"interface="+iface,
		); err != nil {
			return err
		}
	*/
	return addListMemberResp, nil
}

func (s *RouterOSServiceImpl) removeListMember(list, iface string) (response *routeros.Reply, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	return s.removeByFilter(
		"/interface/list/member",
		"list="+list,
		"interface="+iface,
	)
}

func (s *RouterOSServiceImpl) addWireguardPeer(comment, iface, name, pubKey string, allowedAddrs ...string) (response *routeros.Reply, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	args := []string{
		"/interface/wireguard/peers/add",
		fmt.Sprintf("=interface=%s", iface),
		fmt.Sprintf("=name=%s", name),
		fmt.Sprintf("=public-key=%s", pubKey),
		fmt.Sprintf("=allowed-address=%s", strings.Join(allowedAddrs, ",")),
	}

	addWireguardPeerResp, addWireguardPeerErr := s.client.RunArgs(args)
	if addWireguardPeerErr != nil {
		return nil, fmt.Errorf("failed to add wireguard peer: %v", addWireguardPeerErr)
	}

	/*
		if err := s.addComment("/interface/wireguard/peers", comment, "name="+name); err != nil {
				return err
			}
	*/
	return addWireguardPeerResp, nil
}

func (s *RouterOSServiceImpl) removeWireguardPeer(name string) (response *routeros.Reply, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	return s.removeByFilter("/interface/wireguard/peers", "name="+name)
}

func (s *RouterOSServiceImpl) addIPAddress(addr, comment, iface string) (response *routeros.Reply, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	args := []string{
		"/ip/address/add",
		fmt.Sprintf("=interface=%s", iface),
		fmt.Sprintf("=address=%s", addr),
	}

	addIPAddressResp, addIPAddressErr := s.client.RunArgs(args)
	if addIPAddressErr != nil {
		return nil, fmt.Errorf("failed to add ip address: %v", addIPAddressErr)
	}

	/*
		if err := s.addComment("/ip/address", comment, "interface="+iface, "address="+addr); err != nil {
			return err
		}
	*/
	return addIPAddressResp, nil
}

func (s *RouterOSServiceImpl) removeIPAddress(addr, iface string) (response *routeros.Reply, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	return s.removeByFilter(
		"/ip/address",
		"interface="+iface,
		"address="+addr,
	)
}

func (s *RouterOSServiceImpl) addFirewallFilter(action, chain, comment string, params map[string]string) (response *routeros.Reply, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	args := []string{"/ip/firewall/filter/add", fmt.Sprintf("=chain=%s", chain), fmt.Sprintf("=action=%s", action)}

	for k, v := range params {
		args = append(args, fmt.Sprintf("=%s=%s", k, v))
	}

	addFirewallFilterResp, addFirewallFilterErr := s.client.RunArgs(args)
	if addFirewallFilterErr != nil {
		return nil, fmt.Errorf("failed to add firewall filter: %v", addFirewallFilterErr)
	}

	/*
		filter := []string{
			fmt.Sprintf("chain=%s", chain),
			fmt.Sprintf("action=%s", action),
		}
		for k, v := range params {
			filter = append(filter, fmt.Sprintf("%s=%s", k, v))
		}


		if err := s.addComment("/ip/firewall/filter", comment, filter...); err != nil {
			return err
		}
	*/
	return addFirewallFilterResp, nil
}

func (s *RouterOSServiceImpl) removeFirewallFilter(filters map[string]string) (response *routeros.Reply, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	parts := []string{}
	for k, v := range filters {
		parts = append(parts, fmt.Sprintf("%s=%s", k, v))
	}
	return s.removeByFilter("/ip/firewall/filter", parts...)
}

func (s *RouterOSServiceImpl) addRoutingTable(name string) (response *routeros.Reply, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	addRoutingTableResp, addRoutingTableErr := s.client.RunArgs([]string{
		"/routing/table/add",
		fmt.Sprintf("=name=%s", name),
	})
	if addRoutingTableErr != nil {
		return nil, fmt.Errorf("failed to add routing table: %v", addRoutingTableErr)
	}

	return addRoutingTableResp, nil
}

func (s *RouterOSServiceImpl) removeRoutingTable(name string) (response *routeros.Reply, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	for {
		// Sometimes the routing table can not be removed immediately, so we need to retry
		resp, err := s.removeByFilter("/routing/table", "name="+name)
		if err != nil {
			log.Println("Error removing routing table: ", err.Error())
			log.Println("Retrying...")
			continue
		} else {
			return resp, nil
		}
	}
}

func (s *RouterOSServiceImpl) addRoute(dst, gateway, table string) (response *routeros.Reply, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	addRouteResp, addRouteErr := s.client.RunArgs([]string{
		"/ip/route/add",
		fmt.Sprintf("=dst-address=%s", dst),
		fmt.Sprintf("=gateway=%s", gateway),
		fmt.Sprintf("=routing-table=%s", table),
	})
	if addRouteErr != nil {
		return nil, fmt.Errorf("failed to add route: %v", addRouteErr)
	}

	return addRouteResp, nil
}

func (s *RouterOSServiceImpl) RemoveRoute(dst, gateway, table string) (response *routeros.Reply, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	return s.removeByFilter(
		"/ip/route",
		"dst-address="+dst,
		"gateway="+gateway,
		"routing-table="+table,
	)
}

func (s *RouterOSServiceImpl) GetWireguardPublicKey(name string) (string, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	resp, err := s.client.RunArgs([]string{
		"/interface/wireguard/print",
		fmt.Sprintf("?name=%s", name),
		"=.proplist=.id,public-key",
	})
	if err != nil {
		return "", err
	}

	if len(resp.Re) == 0 {
		return "", fmt.Errorf("failed to find wireguard interface %s", name)
	}

	return resp.Re[0].Map["public-key"], nil
}
