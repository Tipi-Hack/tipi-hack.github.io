from gattlib import GATTRequester
from Crypto.Cipher import AES

'''
-------------------------------------------------------------
Ph0wn 2018 - Toothbrush challenge solution
Based on example code by @cryptax
September 18, 2018
-------------------------------------------------------------

REQUIREMENTS:
- Linux
- bluetooth dev libraries
- gattlib: sudo pip install gattlib

Example:
  sudo apt-get install libglib2.0-dev python-setuptools python-pip \
     g++ libbluetooth-dev libboost-python-dev libboost-thread-dev
  sudo pip install gattlib

RUN:

$ sudo python example.py

TROUBLESHOOTING:

- Only one connection at a time on the toothbrush
- "Channel or attrib not ready": make sure you don't have another program (smartphone?) using BLE and connected to the toothbrush
- "Device busy" => sudo bccmd -d hci0 warmreset

'''

cipher = AES.new("e02b90e8e50be5b001c299a5039462c2".decode("hex"), AES.MODE_ECB)


class MyRequester(GATTRequester):
    def on_notification(self, handle, data):
        data = str(data)  # change type
        data = data[3:]  # remove first 3 bytes (only keep payload)
        data = data[::-1]  # reverse

        if len(data) % 16 == 0:  # only try to reverse if it's a block
            decrypted = cipher.decrypt(data)
            print decrypted


class ToothBrush(object):
    def __init__(self, address, verbose=False):
        self.address = address
        self.req = MyRequester(address, False)
        if verbose:
            print "[+] Tooth Brush object instantiated"

    def connect(self, verbose=False):
        if verbose:
            print "Connecting to %s..." % (self.address)
        self.req.connect(wait=True, channel_type='public')
        if verbose:
            print "[+] Connected to %s" % (self.address)

    def disconnect(self, verbose=False):
        self.req.disconnect()
        if verbose:
            print("[+] Disconnected")

    def is_connected(self):
        return self.req.is_connected()

    def enable_notif(self, handle):
        ''' low level function to enable notifications for a given handle '''
        self.req.write_by_handle(handle, str(bytearray([01, 00])))

    def enable_button_notif(self):
        self.enable_notif(0x0026)
        print "[+] Enabled notif"

        for i in range(0, 256):
            self.enable_notif(0x0026)
            event = str(bytearray([0x41, 0x41, 0x41, 0x41, 0x41,        # raw data: 5 bytes (not used)
                                   0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0x00,  # start date: 6 bytes (YY MM DD HH MM SS)
                                   0xFF, 0xFF, 0xFF, 0xFF,              # brushing duration: 4 bytes
                                   i,                                   # index: 1 byte
                                   ]))

            event = cipher.encrypt(event)
            event = event[::-1]  # reverse
            self.req.write_by_handle(0x0028, event)


if __name__ == '__main__':
    args = {}
    args.mac = "00:07:80:20:B2:41"
    args.verbose = True
    brush = ToothBrush(address=args.mac, verbose=args.verbose)
    if not brush.is_connected():
        brush.connect(verbose=args.verbose)

    # enable notifications so we see what happens
    brush.enable_button_notif()

    raw_input("Press ENTER to EXIT - otherwise, just use the toothbrush")

    if brush.is_connected():
        brush.disconnect(verbose=args.verbose)
