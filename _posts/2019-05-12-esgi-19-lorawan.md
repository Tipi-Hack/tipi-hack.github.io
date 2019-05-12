---
title: Hacklab ESGI CTF - Proof Of Life 2
authors: cnotin
layout: writeup
ctf_url: https://hacklab-esgi.org/
---
Solves: 1 / Points: ?? / Category: ??

## Challenge description
For this challenge we are provided with a USB RTL-SDR dongle and a small antenna. We are told that the radio protocol used is LoRaWAN/LoRa, and that there is somewhere a transmitter which broadcasts a message containing the flag.

## Challenge resolution
We discover that [GNU Radio](https://www.gnuradio.org/) (very popular SDR toolkit) has a fork which can process LoRa: [gr-lora](https://github.com/rpp0/gr-lora)

Since at this moment we do not know anything about SDR and LoRa, we take the time to thoroughly read the [gr-lora tutorial](https://github.com/rpp0/gr-lora/wiki/Capturing-LoRa-signals-using-an-RTL-SDR-device). The tool is provided as a very handy Docker container. By the way, it is the occasion to discover that Docker containers can display GUIs through some X socket sharing!

Now that we are equipped, we need to spot the location where the transmitter is located to have the strongest signal. It is easy, since we spot a few competitors in a corridor, sitting with SDR dongles and antennas, in front of a data room. Hi, fellow hackers!

Our first try is not conclusive at all. Decoded LoRa output is supposed to be written in the GNU Radio console but nothing appears... 
The reassuring thing is that we see regular radio peaks in the spectrogram, meaning that we are in the right place and that everything is correctly connected.
![](/assets/esgi-19-lora-1.png)

The tutorial explains that we need to find the frequency (it was given in the challenge description) and that there is an offset, depending on the dongle, to measure and configure in the software.

There are several settings that we can play with and we actually spend around 1 hour tweaking them. We go extreme with the offset since we use a value of "-1M" instead of "26k" in the tutorial. Then, we finally get lucky and something is properly captured and decoded!
We immediately see some transmitted output:
![](/assets/esgi-19-lora-2.png)

After hex-decoding, we have:
> ESGI{H3art_Be37_Am_I-4L1ve?}

## Discussion
We are clearly lucky here, considering that we do that for the first time... that we do not know much of the theory behind... and that for the whole CTF we were the only team to solve this challenge.

Our dear readers, who know better than us LoRa, are strongly invited to start the discussion on our [Tipi'Hack Twitter](https://twitter.com/tipi_hack). Tell us if we missed something, or if we could have done better on this challenge.