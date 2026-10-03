# Mini-Timer-App
A customizable mini timer app that allows you to create presets and add your own alarms for the timers you create. Great for planning.

This app was created using HTML, CSS, JavaScript, and [Electron](https://www.electronjs.org/) to compile the app.

## Main App Features
1.  Timer Creation
    - You have the ability to create two type of alarms in this app, ***preset and custom***
    - To create a **preset** alarm:
        - Click the **preset** button
        - Choose a preset from the 1st dropdown menu. If you do not have one, you can make one in the **Presets** tab
        - Choose an alarm. Of course, you can choose to have no alarm and the timer will still work
        - Click the **check mark box** when done, and your timer will be added to the list of timers
    - Refreshing the app or going to another tab will **NOT** delete your timers

    - To create a **custom** alarm:
        - Click the **custom** button
        - Enter a name for the timer. Max 20 characters
        - Enter a time in all 3 boxes
        - Choose an alarm. Of course, you can choose to have no alarm and the timer will still work
        - Click the **check mark box** when done, and your timer will be added to the list of timers
    -Refreshing the app or going to another tab will **NOT** delete your timers

2.  Preset Creation
    - You can create your own presets for your timers by going to the Presets page.
    - To create a preset:
        - Type in a Preset name
        - Type in a time in the hh:mm:ss format (you must type the ':'s)
        - Click the **Add Preset** button
        - After creation, you can delete this preset as well.

3.  Alarm Creation
    - You can create your own alarms for your timers (for both preset and custom)
    - To create an alarm:
        - Type in an Alarm name
        - Choose an audio file (preferably mp3 or wav)
        - Click the **Add alarm button**
        - After creation, you can delete this alarm as well. You can also play and stop the audio

## Secondary App Features
1.  App Reset
    - The **Reset App** button will prompt you to delete all saved info. This includes:
        - Selected theme
        - All alarms
        - All presets
        - All timers
    - You have the option to cancel as a failsave

2.  Dark Mode or Light Mode
    - By clicking the **Dark Mode** button, the system, which is default in light mode, will switch
    - This is not saved to the system, and will switch back to light mode upon a refresh, restart, or tab change
3.  Volume Control
    - The volume control controls the volume for **ALL** timer alarms (as of right now). 
    - Default volume is 100%. Volume decreases in 10% increments
    - You can check the volume by hovering over the speaker icon

4.  Theme Change
    - You can change your theme by clicking the color box in the top right of the app.
    - After you select a color, it will automatically save to the system, so no need for a submit button

## Notes
1.  Timers will not play and will reset back to initial set value when refreshing the tab or going to other tabs.

2.  Timer alarms can layer over each other.