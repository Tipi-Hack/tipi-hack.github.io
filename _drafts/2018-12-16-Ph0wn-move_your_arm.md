---
title: Ph0wn - Wanna drink? Move your arm!
authors: crypt0_M3lon
layout: writeup
ctf_url: http://ph0wn.org/
---
Category: Prog

## Challenge description
In these challenge we were provided an ssh access to a Lego robotic arm. We used Python in our solution, another approach is available on [Duks' blog](http://duksctf.github.io/2018/12/14/Ph0wn2018-wannadrink.html).

> Ph0wn aliens have abducted my coke and put it in the fridge. But, now, I am thirsty. Open the door with the robotic arm, and you will get a free coke ... and a flag!
> Fortunately, the aliens have left a few instructions in case they would format their internal memory.
> - You first  must request access to the robot by giving your IP address, one team at a time. Then you can connect to the robot on `ph0wn2018-robot` with IP address `10.210.17.146`
> - Once connected, you must make a program to move the arm and open the door. The door must rotate of 180 degrees to get the can. **Knocking down the fridge is prohibited** (you must get the can without destroying the fridge, you vandals!)
> - The flag is NOT in the robot system, it is printed on the coke can. Oh, by the way, a very powerful lazer beam will strike your own computer if you were to erase to content of the system, or if you get the can without using the robotic arm.
> Last but not least, they have noted the login/password on a post-it just next to the printed manual:
> - Login: `robot`
> - Password: `maker`
> The flag has the usual format.
> Author: ludoze

## Challenge resolution
Once connected on the device, we had to identify what to do. A short Google search showed that such kind of robot can be managed using Python script and the ev3dev package. Fortunately, we had a Python interpreter installed on the robot with Ev3dev package. After taking a look at the [documentation](https://ev3dev-lang.readthedocs.io/projects/python-ev3dev/en/stable/spec.html), we were able to call the `ev3dev.core.list_motors()` function to retrieve the name of the three motors available on the robotic arm. A first one for up/down movement, a second for rotation and the last one managing the pinch.

It exist many ways to use a motor. We decided to use a fonction which move the motor for a certain time to a certain speed:
```python
from ev3dev..ev import *

motor = Motor('motor_name')
motor.run_timed(time_sp=3000, speed_sp=-750)
```
And it moved! Note that the sense of rotation could be changed be setting `speed_sp` to a negative or positive value.
Then we just had to move the robotic arm until we were able to open the fridge :)
