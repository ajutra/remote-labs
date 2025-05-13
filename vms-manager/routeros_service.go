package main

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/go-routeros/routeros/v3"
)

type RouterOSService interface {
	Close()
	AddWireguard(comment string, listenPort, mtu int, name string) error
	RemoveWireguard(name string) error
	AddVlan(comment string, iface, name string, vlanID int) error
	RemoveVlan(name string) error
	AddInterfaceList(name string) error
	RemoveInterfaceList(name string) error
	AddVrf(comment, name string, ifaces ...string) error
	RemoveVrf(name string) error
	AddBridgeVlan(bridge, comment string, vlanID int, tagged ...string) error
	RemoveBridgeVlan(bridge string, vlanID int) error
	AddList(name string) error
	RemoveList(name string) error
	AddListMember(comment, iface, list string) error
	RemoveListMember(list, iface string) error
	AddWireguardPeer(comment, iface, name, pubKey string, allowedAddrs ...string) error
	RemoveWireguardPeer(name string) error
	AddIPAddress(addr, comment, iface string) error
	RemoveIPAddress(addr, iface string) error
	AddFirewallFilter(action, chain, comment string, params map[string]string) error
	RemoveFirewallFilter(filters map[string]string) error
	AddRoute(dst, gateway, table string) error
	RemoveRoute(dst, gateway, table string) error
	GetWireguardPublicKey(name string) (string, error)
}

type RouterOSServiceImpl struct {
	client *routeros.Client
}

func NewRouterOSService(addr, user, pass string) (RouterOSService, error) {
	c, err := routeros.Dial(addr, user, pass)
	if err != nil {
		return nil, err
	}
	return &RouterOSServiceImpl{client: c}, nil
}

func (s *RouterOSServiceImpl) Close() { s.client.Close() }

func (s *RouterOSServiceImpl) removeByFilter(cmd string, filter ...string) error {
	args := []string{
		fmt.Sprintf("%s/print", cmd),
	}

	for _, f := range filter {
		args = append(args, "?"+f)
	}

	args = append(args, "=.proplist=.id")

	resp, err := s.client.RunArgs(args)
	if err != nil || len(resp.Re) == 0 {
		return fmt.Errorf("failed to find %s: %v", filter, err)
	}

	id := resp.Re[0].Map[".id"]

	if _, err := s.client.RunArgs([]string{
		fmt.Sprintf("%s/remove", cmd),
		fmt.Sprintf("=.id=%s", id),
	}); err != nil {
		return err
	}

	return nil
}

func (s *RouterOSServiceImpl) addComment(cmd, comment string, filter ...string) error {
	args := []string{
		fmt.Sprintf("%s/print", cmd),
	}

	for _, f := range filter {
		args = append(args, "?"+f)
	}

	args = append(args, "=.proplist=.id")

	resp, err := s.client.RunArgs(args)
	if err != nil || len(resp.Re) == 0 {
		return fmt.Errorf("failed to find %s: %v", filter, err)
	}

	id := resp.Re[0].Map[".id"]

	if _, err := s.client.RunArgs([]string{
		fmt.Sprintf("%s/set", cmd),
		fmt.Sprintf("=.id=%s", id),
		fmt.Sprintf("=comment=%s", comment),
	}); err != nil {
		return err
	}

	return nil
}

func (s *RouterOSServiceImpl) AddWireguard(comment string, listenPort, mtu int, name string) error {
	if _, err := s.client.RunArgs([]string{
		"/interface/wireguard/add",
		fmt.Sprintf("=name=%s", name),
		fmt.Sprintf("=listen-port=%d", listenPort),
		fmt.Sprintf("=mtu=%d", mtu),
	}); err != nil {
		return err
	}

	if err := s.addComment("/interface/wireguard", comment, "name="+name); err != nil {
		return err
	}

	return nil
}

func (s *RouterOSServiceImpl) RemoveWireguard(name string) error {
	return s.removeByFilter("/interface/wireguard", "name="+name)
}

func (s *RouterOSServiceImpl) AddVlan(comment string, iface, name string, vlanID int) error {
	args := []string{
		"/interface/vlan/add",
		fmt.Sprintf("=name=%s", name),
		fmt.Sprintf("=interface=%s", iface),
		fmt.Sprintf("=vlan-id=%d", vlanID),
	}

	if _, err := s.client.RunArgs(args); err != nil {
		return err
	}

	if err := s.addComment("/interface/vlan", comment, "name="+name); err != nil {
		return err
	}

	return nil
}

func (s *RouterOSServiceImpl) RemoveVlan(name string) error {
	return s.removeByFilter("/interface/vlan", "name="+name)
}

func (s *RouterOSServiceImpl) AddInterfaceList(name string) error {
	_, err := s.client.RunArgs([]string{
		"/interface/list/add",
		fmt.Sprintf("=name=%s", name),
	})
	return err
}

func (s *RouterOSServiceImpl) RemoveInterfaceList(name string) error {
	return s.removeByFilter("/interface/list", "name="+name)
}

func (s *RouterOSServiceImpl) AddVrf(comment string, name string, ifaces ...string) error {
	if _, err := s.client.RunArgs([]string{
		"/ip/vrf/add",
		fmt.Sprintf("=name=%s", name),
		fmt.Sprintf("=interfaces=%s", strings.Join(ifaces, ",")),
	}); err != nil {
		return err
	}

	if err := s.addComment("/ip/vrf", comment, "name="+name); err != nil {
		return err
	}

	return nil
}

func (s *RouterOSServiceImpl) RemoveVrf(name string) error {
	return s.removeByFilter("/ip/vrf", "name="+name)
}

func (s *RouterOSServiceImpl) AddBridgeVlan(bridge, comment string, vlanID int, tagged ...string) error {
	args := []string{
		"/interface/bridge/vlan/add",
		fmt.Sprintf("=bridge=%s", bridge),
		fmt.Sprintf("=vlan-ids=%d", vlanID),
		fmt.Sprintf("=tagged=%s", strings.Join(tagged, ",")),
	}

	if _, err := s.client.RunArgs(args); err != nil {
		return err
	}

	if err := s.addComment("/interface/bridge/vlan", comment, "vlan-ids="+strconv.Itoa(vlanID)); err != nil {
		return err
	}

	return nil
}

func (s *RouterOSServiceImpl) RemoveBridgeVlan(bridge string, vlanID int) error {
	return s.removeByFilter(
		"/interface/bridge/vlan",
		"bridge="+bridge,
		"vlan-ids="+strconv.Itoa(vlanID),
	)
}

func (s *RouterOSServiceImpl) AddList(name string) error {
	_, err := s.client.RunArgs([]string{
		"/interface/list/add",
		fmt.Sprintf("=name=%s", name),
	})
	return err
}

func (s *RouterOSServiceImpl) RemoveList(name string) error {
	return s.removeByFilter("/interface/list", "name="+name)
}

func (s *RouterOSServiceImpl) AddListMember(comment, iface, list string) error {
	args := []string{
		"/interface/list/member/add",
		fmt.Sprintf("=list=%s", list),
		fmt.Sprintf("=interface=%s", iface),
	}

	if _, err := s.client.RunArgs(args); err != nil {
		return err
	}

	if err := s.addComment(
		"/interface/list/member",
		comment,
		"list="+list,
		"interface="+iface,
	); err != nil {
		return err
	}

	return nil
}

func (s *RouterOSServiceImpl) RemoveListMember(list, iface string) error {
	return s.removeByFilter(
		"/interface/list/member",
		"list="+list,
		"interface="+iface,
	)
}

func (s *RouterOSServiceImpl) AddWireguardPeer(comment, iface, name, pubKey string, allowedAddrs ...string) error {
	args := []string{
		"/interface/wireguard/peers/add",
		fmt.Sprintf("=interface=%s", iface),
		fmt.Sprintf("=name=%s", name),
		fmt.Sprintf("=public-key=%s", pubKey),
		fmt.Sprintf("=allowed-address=%s", strings.Join(allowedAddrs, ",")),
	}

	if _, err := s.client.RunArgs(args); err != nil {
		return err
	}

	if err := s.addComment("/interface/wireguard/peers", comment, "name="+name); err != nil {
		return err
	}

	return nil
}

func (s *RouterOSServiceImpl) RemoveWireguardPeer(name string) error {
	return s.removeByFilter("/interface/wireguard/peers", "name="+name)
}

func (s *RouterOSServiceImpl) AddIPAddress(addr, comment, iface string) error {
	args := []string{
		"/ip/address/add",
		fmt.Sprintf("=interface=%s", iface),
		fmt.Sprintf("=address=%s", addr),
	}

	if _, err := s.client.RunArgs(args); err != nil {
		return err
	}

	if err := s.addComment("/ip/address", comment, "interface="+iface, "address="+addr); err != nil {
		return err
	}
	return nil
}

func (s *RouterOSServiceImpl) RemoveIPAddress(addr, iface string) error {
	return s.removeByFilter(
		"/ip/address",
		"interface="+iface,
		"address="+addr,
	)
}

func (s *RouterOSServiceImpl) AddFirewallFilter(action, chain, comment string, params map[string]string) error {
	args := []string{"/ip/firewall/filter/add", fmt.Sprintf("=chain=%s", chain), fmt.Sprintf("=action=%s", action)}

	for k, v := range params {
		args = append(args, fmt.Sprintf("=%s=%s", k, v))
	}

	if _, err := s.client.RunArgs(args); err != nil {
		return err
	}

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
	return nil
}

func (s *RouterOSServiceImpl) RemoveFirewallFilter(filters map[string]string) error {
	parts := []string{}
	for k, v := range filters {
		parts = append(parts, fmt.Sprintf("%s=%s", k, v))
	}
	return s.removeByFilter("/ip/firewall/filter", parts...)
}

func (s *RouterOSServiceImpl) AddRoute(dst, gateway, table string) error {
	_, err := s.client.RunArgs([]string{
		"/ip/route/add",
		fmt.Sprintf("=dst-address=%s", dst),
		fmt.Sprintf("=gateway=%s", gateway),
		fmt.Sprintf("=routing-table=%s", table),
	})
	return err
}

func (s *RouterOSServiceImpl) RemoveRoute(dst, gateway, table string) error {
	return s.removeByFilter(
		"/ip/route",
		"dst-address="+dst,
		"gateway="+gateway,
		"routing-table="+table,
	)
}

func (s *RouterOSServiceImpl) GetWireguardPublicKey(name string) (string, error) {
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
