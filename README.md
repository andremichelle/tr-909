### VECTOR-909

Roland TR-909 drum-machine with only hand-made html, svg & css. 100% vector graphics. No bitmaps.

### Update!

We have sounds! Also, about 90% of the 909 features are already implemented. The original is quite cumbersome to use but I didn't want to break the retro feeling. Hence this version is even worse to operate since we only have one mouse cursor. To simultanously hit more than one key, hold the SHIFT key on your keyboard. It is a good idea to download the original manual until I add my own manual.

*To preview the sounds, just click the main-keys in the bottom row. They all play their sounds as the original machine does.*

### Credits
Logo SVGs (Roland, TR-909 & Rhythm Composer) by [Isaac Cotec](https://subaqueous.gumroad.com/l/hmOwu?recommended_by=search&_ga=2.213635036.938996232.1655202059-1482949479.1654938206&_gl=1*yr8fvz*_ga*MTQ4Mjk0OTQ3OS4xNjU0OTM4MjA2*_ga_6LJN6D94N6*MTY1NTIwMjA3My4zLjEuMTY1NTIwMjA3OC4w)

### Disclaimer
_**The use of any trade name or trademark is for identification and educational purposes only and does not imply any association with the trademark holder of their product brand.**_

[Open](https://andremichelle.github.io/vector-909/) | [Wiki](https://en.wikipedia.org/wiki/Roland_TR-909)
![alt screenshot](screenshot.png)

### Build
Make sure to have sass installed and run in the console:

    sass sass/main.sass:bin/main.css --watch

Make sure to have typescript installed and run in the console:

    tsc -p ./typescript/tsconfig.json --watch
