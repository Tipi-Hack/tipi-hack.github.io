---
title: Ph0wn 2018 - Push me
authors: cnotin
layout: writeup
ctf_url: http://ph0wn.org/
---
Category: Reverse

## Challenge description
> How long is forever?
> Are you late? Or have you found many flags?
> Are you in Wonderland? Or are you in hell?
> 
> You should really check on the watch, it is full of surprises, especially its buttons...
> 
> -------
> You should get this app and figure out the mysteries of this watch...
> Then, borrow the watch to get the flag :)
>
> Author: ludoze

## Challenge resolution
The smartwatch was tactile and had a physical button on the side. We played with the button and noticed notifications displayed in some cases but without really understanding what happened... Some were encouraging and others not...

The source code of the app was provided so we dived into it. However it was based on a sample project that had many files and features. Therefore, we had to isolate the custom part.

We searched the displayed messages in the project files but it did not work. We noticed that the messsage telling us that we failed had "ko" in the title. Therefore, we searched for this exact single word and got lucky:
![](/assets/ph0wn-push_me-ko.png)

Indeed the messages were base64-encoded to make it more difficult to find them: good idea!

We decoded all the messages, especially the `finalSentence` hoping for a quick-win :wink:
![](/assets/ph0wn-push_me-fake_flag.png)

Ok... We had to review the code to really understand what to do. You can find attached all the relevant custom code at the end of this post.

Here is a sample of the interesting part:
![](/assets/ph0wn-push_me-pressions.png)

We understood that we had to push the button 3 times, then 2 times, then 6 times, and finally 2 times. For each stage, we had between 3.5 and 4.5 seconds to do this.

And for the last stage, we had less than 250ms between the first two presses:
```java
private boolean closeTime() {
    return ((buttonPression[1] - buttonPression[0]) < 250);
}
```

After a few tries, we finally had the joy to see the flag displayed on the smartwatch!
![](/assets/ph0wn-push_me-flag.jpg)

### Appendix: relevant source code
Here is the custom source code added for this challenge.
```java
public void runButtonAction() {
    Prefs prefs = GBApplication.getPrefs();

    if (currentButtonTimerActivationTime != currentButtonPressTime) {
        return;
    }

    String requiredButtonPressMessage = prefs.getString(MiBandConst.PREF_MIBAND_BUTTON_PRESS_BROADCAST,
            this.getContext().getString(R.string.mi2_prefs_button_press_broadcast_default_value));

    Intent in = new Intent();
    in.setAction(requiredButtonPressMessage);
    in.putExtra("button_id", currentButtonActionId);
    LOG.info("Sending " + requiredButtonPressMessage + " with button_id " + currentButtonActionId);
    this.getContext().getApplicationContext().sendBroadcast(in);
    if (prefs.getBoolean(MiBandConst.PREF_MIBAND_BUTTON_ACTION_VIBRATE, false)) {
        performPreferredNotification(null, null, null, HuamiService.ALERT_LEVEL_VIBRATE_ONLY, null);
    }

    currentButtonActionId = 0;

    currentButtonPressCount = 0;
    currentButtonPressTime = System.currentTimeMillis();
}

private void generateNotificationCustom(String info, String[] listOfString) {
    Random rand = new Random();
    int index = rand.nextInt(listOfString.length);

    String encoded = listOfString[index];
    byte[] data = android.util.Base64.decode(encoded, android.util.Base64.DEFAULT);
    String text = new String(data);

    byte[] dataInfo = android.util.Base64.decode(info, android.util.Base64.DEFAULT);
    String infoF = new String(dataInfo);

    generateNotificationToWatch(infoF, text, "");
}

public void myHandleButton() {
    ///logMessageContent(value);

    // If disabled we return from function immediately
    Prefs prefs = GBApplication.getPrefs();
    /*if (!prefs.getBoolean(MiBandConst.PREF_MIBAND_BUTTON_ACTION_ENABLE, false)) {
        return;
    }*/


    long currentTime = System.currentTimeMillis();

    if (buttonPression == null) {
        buttonPression = new long[10];
        nbPression = 0;
    }
    if (nbPression < 10) {
        buttonPression[nbPression] = currentTime;
        nbPression++;
    } else {
        nbPression = 11;
    }

    if (nbPression >= 10) {
        nbPression = 0;
        mode = NORMAL_MODE;
        stopTimer();
        stopSMSTimer();
    } else {
        if (nbPression == 1) {
            startTimer();
        }
    }
}

private void stopTimer(){
    if(mTimer1 != null){
        mTimer1.cancel();
        mTimer1.purge();
    }
}

private boolean closeTime() {
    return ((buttonPression[1] - buttonPression[0]) < 250);
}


private void startTimer(){
    mTimer1 = new Timer();
    mTt1 = new TimerTask() {
        public void run() {
            mTimerHandler.post(new Runnable() {
                public void run(){
                    if (nbPression > 1 ) {
                        if (mode == NORMAL_MODE) {
                            if (nbPression == 3) {
                                generateNotificationCustom(headers[0], sentencesOK);
                                mode = STAGE_3;
                                startSMSTimer();
                            } else {
                                generateNotificationCustom(headers[1], sentencesKO);
                                nbPression = 0;
                            }
                        } else {
                            stopSMSTimer();
                            if (mode == STAGE_3) {
                                if (nbPression == 2) {
                                    generateNotificationCustom(headers[0], sentencesOK);
                                    mode = STAGE_2;
                                    startSMSTimer(4500);
                                } else {
                                    generateNotificationCustom(headers[1], sentencesKO);
                                    stopSMSMode();
                                }
                            } else if (mode == STAGE_2) {
                                startSMSTimer();
                                if (nbPression == 6) {
                                    generateNotificationCustom(headers[0], sentencesOK);
                                    mode = STAGE_4;
                                    startSMSTimer();
                                } else {
                                    generateNotificationCustom(headers[1], sentencesKO);
                                    stopSMSMode();
                                }
                            } else if (mode == STAGE_4) {
                                //startSMSTimer();
                                if ((nbPression == 2) && (closeTime())) {
                                    generateNotificationCustom(headers[0], finalSentence);
                                } else {
                                    generateNotificationCustom(headers[1], sentencesKO);
                                    stopSMSMode();
                                }
                            }
                        }

                    }
                    nbPression = 0;

                }
            });
        }
    };

    mTimer1.schedule(mTt1, 2500);
}

private void stopSMSTimer(){
    if(SMSTimer != null){
        SMSTimer.cancel();
        SMSTimer.purge();
    }
}

private void startSMSTimer() {
    startSMSTimer(3500);
}

private void startSMSTimer(long duration) {
    SMSTimer = new Timer();
    SMSTask = new TimerTask() {
        public void run() {
            SMSTimerHandler.post(new Runnable() {
                public void run(){
                    if (nbPression == 0) {
                        mode = NORMAL_MODE;
                    }
                }
            });
        }
    };
    SMSTimer.schedule(SMSTask, duration);
}

private void stopSMSMode() {
    stopSMSTimer();
    mode = NORMAL_MODE;
}
```