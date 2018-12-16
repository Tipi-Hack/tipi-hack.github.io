---
title: Ph0wn - Save the factory
authors: cnotin
layout: writeup
ctf_url: http://ph0wn.org/
---
Category: Prog

## Challenge description
We were provided with information about a factory with machines controlled by a main board that was compromised by an attacker. We were told that the [OPC UA](https://en.wikipedia.org/wiki/OPC_Unified_Architecture) machine to machine communication protocol for industrial automation was used. We had SSH access to this main board (Linux based) with an example Python client. The OPC UA server was also directly available via TCP.

## Challenge resolution
The provided sample client was based on the `python-opcua` library. We discovered that this library also provides tools such as `uals` ([tool](https://github.com/FreeOpcUa/python-opcua/blob/master/tools/uals) and [implementation](https://github.com/FreeOpcUa/python-opcua/blob/4a9c569ab13875a31ee2fd450e2e3943636a86ca/opcua/tools.py#L274)).

OPC UA is based on a tree with nodes containing data. The `uals` tool walks the tree and displays the values.
![](/assets/ph0wn-save_the_factory-uals.png){: .image }

We spot the `BlackBox` node that was indicated in the challenge description.

We re-launch `uals` to walks the tree, up to the specified depth (`-d 2`) and quickly find the flag:
![](/assets/ph0wn-save_the_factory-uals2.png){: .image }

It was certainly not the intended solution, but it worked :wink:

We could also have used a GUI tool such as [OPC-UA GUI Client](https://github.com/FreeOpcUa/opcua-client-gui) and connect directly via Internet:
![](/assets/ph0wn-save_the_factory-gui.png){: .image }