## Micro Survivor

Tiny survivors-like game that fits under 14 kB of minified JS code.

### Features

- multiple player classes
- 3 different weapons
- bosses
- 14 kB minified, 7 kB gzipped

### Injecting into your website

```javascript
// injects the game canvas into element with id="survivors"
microSurvivors(document.querySelector("#survivors"));

// injects the game canvas into element with id="survivors", with 800x800 size
microSurvivors(document.querySelector("#survivors"), 800, 800);
```
